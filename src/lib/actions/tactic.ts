/**
 * AETERNA 2026 — Tactic Server Actions
 * 
 * @description Server-side actions for tactic management.
 * 
 * ⚠️ CRITICAL: Tactics use VERSIONING in PostgreSQL.
 * When you UPDATE a tactic, the database trigger:
 *   1. Sets is_active = FALSE on the current record
 *   2. Creates a NEW record with incremented version
 *   3. Links new record via previous_version_id
 * 
 * This means the returned tactic after UPDATE has a DIFFERENT ID.
 * Frontend must use the new ID for all subsequent operations.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { Tactic, TacticUpdate } from '@/types/database';

/**
 * Create a new tactic
 */
export const createTactic = async (input: {
    goalId: string;
    userId: string;
    title: string;
    description?: string;
    weight?: number;
}): Promise<{ data: Tactic | null; error: string | null }> => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== input.userId) {
        return { data: null, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('tactics')
        .insert({
            goal_id: input.goalId,
            user_id: input.userId,
            title: input.title,
            description: input.description ?? null,
            weight: input.weight ?? 1,
            is_active: true,
            version: 1,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating tactic:', error);
        return { data: null, error: error.message };
    }

    return { data, error: null };
};

/**
 * Update a tactic
 * 
 * ⚠️ VERSIONING TRIGGER: This UPDATE will create a NEW record in PostgreSQL.
 * The original record (tacticId) will have is_active set to FALSE.
 * The returned tactic has a DIFFERENT ID than the input tacticId.
 * 
 * IMPORTANT: Use the returned tactic.id for all subsequent operations,
 * as the original tacticId is now "closed" (is_active: false).
 * 
 * @param tacticId - Current tactic ID (will become inactive)
 * @param updates - Fields to update
 * @returns New tactic with NEW ID (different from input tacticId)
 */
export const updateTactic = async (
    tacticId: string,
    updates: TacticUpdate
): Promise<{ data: Tactic | null; error: string | null; originalIdClosed: boolean }> => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { data: null, error: 'Unauthorized', originalIdClosed: false };
    }

    // Verify ownership
    const { data: existing } = await supabase
        .from('tactics')
        .select('user_id, is_active')
        .eq('id', tacticId)
        .single();

    if (!existing || existing.user_id !== user.id) {
        return { data: null, error: 'Tactic not found or unauthorized', originalIdClosed: false };
    }

    if (!existing.is_active) {
        return {
            data: null,
            error: 'Cannot update an inactive tactic. Use the latest active version.',
            originalIdClosed: false
        };
    }

    /**
     * ⚠️ DATABASE TRIGGER: version_tactic()
     * 
     * When this UPDATE executes, PostgreSQL will:
     *   1. Set is_active = FALSE on record with id = tacticId
     *   2. Create NEW record with:
     *      - New UUID
     *      - version = old_version + 1
     *      - previous_version_id = tacticId
     *      - is_active = TRUE
     * 
     * The returned data will be the NEW record, not the original.
     */
    const { data, error } = await supabase
        .from('tactics')
        .update(updates)
        .eq('id', tacticId)
        .select()
        .single();

    if (error) {
        console.error('Error updating tactic:', error);
        return { data: null, error: error.message, originalIdClosed: false };
    }

    // Note: data.id is now DIFFERENT from tacticId
    // The original tacticId record is now is_active: false

    return {
        data,
        error: null,
        originalIdClosed: true // Signal to frontend that original ID is no longer valid
    };
};

/**
 * Get active tactics for a goal
 * Only returns is_active = true records (current versions)
 */
export const getTacticsForGoal = async (goalId: string): Promise<Tactic[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tactics')
        .select('*')
        .eq('goal_id', goalId)
        .eq('is_active', true) // Only current versions
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching tactics:', error);
        return [];
    }

    return data ?? [];
};

/**
 * Get version history for a tactic
 * Follows the previous_version_id chain
 */
export const getTacticHistory = async (tacticId: string): Promise<Tactic[]> => {
    const supabase = await createClient();
    const history: Tactic[] = [];
    let currentId: string | null = tacticId;

    while (currentId) {
        const { data, error } = await supabase
            .from('tactics')
            .select('*')
            .eq('id', currentId)
            .single();

        if (error || !data) break;

        history.push(data);
        currentId = data.previous_version_id;
    }

    return history;
};

/**
 * Soft delete a tactic (set is_active = false)
 * Note: This doesn't create a new version, just deactivates
 */
export const deactivateTactic = async (tacticId: string): Promise<{ success: boolean; error: string | null }> => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('tactics')
        .update({ is_active: false })
        .eq('id', tacticId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deactivating tactic:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
};
