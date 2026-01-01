/**
 * AETERNA 2026 — Execution Server Actions
 * 
 * Handles task check-offs, scoring, and momentum tracking.
 * Designed for Zero-Friction execution (<3s input latency).
 * 
 * Note: Frontend uses useOptimistic for instant feedback.
 * These actions handle DB confirmation only.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ===========================================
// SCHEMAS
// ===========================================

const CheckOffSchema = z.object({
    actionId: z.string().uuid(),
    energyLevel: z.number().min(1).max(5).optional(),
});

const UpdateTacticSchema = z.object({
    tacticId: z.string().uuid(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    weight: z.number().min(1).max(10).optional(),
});

const ActivateShieldSchema = z.object({
    cycleId: z.string().uuid(),
    weekNumber: z.number().min(1).max(12),
    reason: z.string().min(10, 'Please provide a reason (min 10 chars)'),
});

// ===========================================
// TYPES
// ===========================================

export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

// ===========================================
// ACTIONS
// ===========================================

/**
 * Check off a daily action
 * 
 * Zero-Friction Design: Frontend uses useOptimistic for instant feedback.
 * This action only handles DB confirmation.
 * 
 * ⚠️ TRIGGER: Updating is_completed triggers weekly score recalculation
 */
export const checkOffAction = async (
    input: z.infer<typeof CheckOffSchema>
): Promise<ActionResult<{ completed_at: string }>> => {
    try {
        const validated = CheckOffSchema.parse(input);

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Update action
        const { data, error } = await supabase
            .from('daily_actions')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
                energy_level: validated.energyLevel ?? null,
            })
            .eq('id', validated.actionId)
            .eq('user_id', user.id)
            .select('completed_at')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        // Revalidate dashboard for score updates
        revalidatePath('/dashboard');

        return {
            success: true,
            data: { completed_at: data.completed_at },
        };

    } catch (err) {
        if (err instanceof z.ZodError) {
            return { success: false, error: err.errors[0].message };
        }
        console.error('checkOffAction error:', err);
        return { success: false, error: 'Failed to check off action' };
    }
};

/**
 * Undo a checked-off action
 */
export const uncheckAction = async (
    actionId: string
): Promise<ActionResult> => {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('daily_actions')
            .update({
                is_completed: false,
                completed_at: null,
                energy_level: null,
            })
            .eq('id', actionId)
            .eq('user_id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard');

        return { success: true };

    } catch (err) {
        console.error('uncheckAction error:', err);
        return { success: false, error: 'Failed to uncheck action' };
    }
};

/**
 * Update a tactic (triggers versioning)
 * 
 * ⚠️ VERSIONING: The DB trigger creates a NEW record.
 * This action returns the NEW tactic ID for client use.
 */
export const updateTactic = async (
    input: z.infer<typeof UpdateTacticSchema>
): Promise<ActionResult<{ newTacticId: string; version: number }>> => {
    try {
        const validated = UpdateTacticSchema.parse(input);

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify current tactic is active
        const { data: currentTactic } = await supabase
            .from('tactics')
            .select('is_active, version')
            .eq('id', validated.tacticId)
            .eq('user_id', user.id)
            .single();

        if (!currentTactic?.is_active) {
            return {
                success: false,
                error: 'Cannot update an inactive tactic. Use the latest version.'
            };
        }

        // Build update payload
        const updates: Record<string, unknown> = {};
        if (validated.title) updates.title = validated.title;
        if (validated.description !== undefined) updates.description = validated.description;
        if (validated.weight) updates.weight = validated.weight;

        /**
         * ⚠️ DB TRIGGER: version_tactic()
         * 
         * When this UPDATE executes:
         * 1. Original record becomes is_active: false
         * 2. NEW record created with incremented version
         * 3. Response contains the NEW record
         */
        const { data, error } = await supabase
            .from('tactics')
            .update(updates)
            .eq('id', validated.tacticId)
            .select('id, version')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard');

        // Return NEW tactic ID (different from input tacticId)
        return {
            success: true,
            data: {
                newTacticId: data.id,
                version: data.version,
            },
        };

    } catch (err) {
        if (err instanceof z.ZodError) {
            return { success: false, error: err.errors[0].message };
        }
        console.error('updateTactic error:', err);
        return { success: false, error: 'Failed to update tactic' };
    }
};

/**
 * Activate a momentum shield for the current week
 */
export const activateShield = async (
    input: z.infer<typeof ActivateShieldSchema>
): Promise<ActionResult<{ remainingCredits: number }>> => {
    try {
        const validated = ActivateShieldSchema.parse(input);

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check remaining credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('shield_credits')
            .eq('id', user.id)
            .single();

        if (!profile || profile.shield_credits <= 0) {
            return { success: false, error: 'No shield credits remaining' };
        }

        // Check if shield already exists for this week
        const { data: existingShield } = await supabase
            .from('momentum_credits')
            .select('id')
            .eq('user_id', user.id)
            .eq('cycle_id', validated.cycleId)
            .eq('week_number', validated.weekNumber)
            .maybeSingle();

        if (existingShield) {
            return { success: false, error: 'Shield already active for this week' };
        }

        // Insert shield (immutable)
        const { error: insertError } = await supabase
            .from('momentum_credits')
            .insert({
                user_id: user.id,
                cycle_id: validated.cycleId,
                week_number: validated.weekNumber,
                reason: validated.reason,
            });

        if (insertError) {
            return { success: false, error: insertError.message };
        }

        // Decrement profile credits
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                shield_credits: profile.shield_credits - 1,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to decrement credits:', updateError);
        }

        revalidatePath('/dashboard');

        return {
            success: true,
            data: { remainingCredits: profile.shield_credits - 1 },
        };

    } catch (err) {
        if (err instanceof z.ZodError) {
            return { success: false, error: err.errors[0].message };
        }
        console.error('activateShield error:', err);
        return { success: false, error: 'Failed to activate shield' };
    }
};

/**
 * Get today's actions for Monk Mode display
 */
export const getTodaysActions = async (cycleId: string) => {
    try {
        const supabase = await createClient();

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_actions')
            .select('*')
            .eq('cycle_id', cycleId)
            .eq('action_date', today)
            .order('created_at', { ascending: true })
            .limit(3); // Monk Mode: max 3

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };

    } catch (err) {
        console.error('getTodaysActions error:', err);
        return { success: false, error: 'Failed to get actions' };
    }
};

/**
 * Get weekly score with shield status
 */
export const getWeeklyScore = async (
    cycleId: string,
    weekNumber: number
) => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('weekly_scores')
            .select('*')
            .eq('cycle_id', cycleId)
            .eq('week_number', weekNumber)
            .maybeSingle();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };

    } catch (err) {
        console.error('getWeeklyScore error:', err);
        return { success: false, error: 'Failed to get score' };
    }
};
