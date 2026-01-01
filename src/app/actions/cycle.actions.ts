/**
 * AETERNA 2026 — Cycle Server Actions
 * 
 * Handles cycle initialization, management, and lifecycle.
 * Uses atomic RPC for transactional cycle creation.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ===========================================
// SCHEMAS
// ===========================================

const GoalInputSchema = z.object({
    title: z.string().min(1, 'Goal title is required'),
    description: z.string().optional(),
    priority: z.number().min(1).max(3).default(1),
});

const InitializeCycleSchema = z.object({
    userId: z.string().uuid(),
    name: z.string().min(1, 'Cycle name is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    vision: z.string().optional(),
    goals: z.array(GoalInputSchema).max(3, 'Maximum 3 goals allowed'),
});

// ===========================================
// TYPES
// ===========================================

export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

export type CycleInitResult = {
    cycle_id: string;
    start_date: string;
    end_date: string;
    days_generated: number;
};

// ===========================================
// ACTIONS
// ===========================================

/**
 * Initialize a new 12-week cycle atomically
 * 
 * Uses Supabase RPC to ensure Goals, Tactics, and Cycle 
 * creation are atomic (all-or-nothing transaction).
 * 
 * ⚠️ TRIGGER: Creates 84 daily_actions automatically
 */
export const initializeCycle = async (
    input: z.infer<typeof InitializeCycleSchema>
): Promise<ActionResult<CycleInitResult>> => {
    try {
        // Validate input
        const validated = InitializeCycleSchema.parse(input);

        const supabase = await createClient();

        // Verify user session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== validated.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check for existing active cycle
        const { data: existingCycle } = await supabase
            .from('cycles')
            .select('id')
            .eq('user_id', validated.userId)
            .eq('cycle_status', 'active')
            .maybeSingle();

        if (existingCycle) {
            return {
                success: false,
                error: 'An active cycle already exists. Close it before creating a new one.'
            };
        }

        // Call atomic RPC
        const { data, error } = await supabase.rpc('initialize_cycle', {
            p_user_id: validated.userId,
            p_name: validated.name,
            p_start_date: validated.startDate,
            p_vision: validated.vision ?? null,
            p_goals: validated.goals,
        });

        if (error) {
            console.error('RPC Error:', error);
            return { success: false, error: error.message };
        }

        if (!data.success) {
            return { success: false, error: data.error };
        }

        // Revalidate dashboard
        revalidatePath('/dashboard');

        return {
            success: true,
            data: {
                cycle_id: data.cycle_id,
                start_date: data.start_date,
                end_date: data.end_date,
                days_generated: data.days_generated,
            },
        };

    } catch (err) {
        if (err instanceof z.ZodError) {
            return { success: false, error: err.errors[0].message };
        }
        console.error('initializeCycle error:', err);
        return { success: false, error: 'Failed to initialize cycle' };
    }
};

/**
 * Close an active cycle and calculate final score
 */
export const closeCycle = async (
    cycleId: string
): Promise<ActionResult<{ final_score: number }>> => {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify ownership
        const { data: cycle } = await supabase
            .from('cycles')
            .select('user_id, cycle_status')
            .eq('id', cycleId)
            .single();

        if (!cycle || cycle.user_id !== user.id) {
            return { success: false, error: 'Cycle not found' };
        }

        if (cycle.cycle_status === 'closed') {
            return { success: false, error: 'Cycle is already closed' };
        }

        // Call close_cycle RPC
        const { error } = await supabase.rpc('close_cycle', {
            p_cycle_id: cycleId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Get final score
        const { data: closedCycle } = await supabase
            .from('cycles')
            .select('final_score')
            .eq('id', cycleId)
            .single();

        revalidatePath('/dashboard');

        return {
            success: true,
            data: { final_score: closedCycle?.final_score ?? 0 },
        };

    } catch (err) {
        console.error('closeCycle error:', err);
        return { success: false, error: 'Failed to close cycle' };
    }
};

/**
 * Get active cycle with computed values
 */
export const getActiveCycle = async (userId: string) => {
    try {
        const supabase = await createClient();

        const { data: cycle, error } = await supabase
            .from('cycles')
            .select('*')
            .eq('user_id', userId)
            .eq('cycle_status', 'active')
            .maybeSingle();

        if (error) {
            return { success: false, error: error.message };
        }

        if (!cycle) {
            return { success: true, data: null };
        }

        // Calculate current week and remaining days
        const startDate = new Date(cycle.start_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.floor(diffDays / 7) + 1;
        const endDate = new Date(cycle.end_date);
        const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

        return {
            success: true,
            data: {
                ...cycle,
                currentWeek: Math.max(1, Math.min(12, currentWeek)),
                remainingDays,
            },
        };

    } catch (err) {
        console.error('getActiveCycle error:', err);
        return { success: false, error: 'Failed to get cycle' };
    }
};
