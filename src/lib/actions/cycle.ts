/**
 * AETERNA 2026 — Cycle Server Actions
 * 
 * @description Server-side actions for cycle management.
 * Includes proper date formatting for trigger activation.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { Cycle, CycleInput } from '@/types/database';

/**
 * Format date to YYYY-MM-DD string for PostgreSQL DATE type
 * 
 * ⚠️ CRITICAL: The start_date must be a proper DATE string to trigger
 * the generate_daily_actions() function in PostgreSQL.
 * 
 * @param date - JavaScript Date object
 * @returns DATE string in YYYY-MM-DD format
 */
export const formatDateForPostgres = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Calculate end date (start_date + 83 days = 12 weeks)
 * 
 * @param startDate - Cycle start date
 * @returns End date (83 days after start)
 */
export const calculateEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 83); // 84 days total (0-indexed)
    return endDate;
};

/**
 * Create a new 12-week cycle
 * 
 * ⚠️ TRIGGER ACTIVATION: On successful INSERT, PostgreSQL will automatically:
 *    1. Run generate_daily_actions() trigger
 *    2. Create 84 rows in daily_actions table
 *    3. Each row linked to this cycle_id
 * 
 * @param input - Cycle creation input
 * @returns Created cycle or error
 */
export const createCycle = async (input: {
    userId: string;
    name: string;
    startDate: Date;
}): Promise<{ data: Cycle | null; error: string | null }> => {
    const supabase = await createClient();

    // Validate user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== input.userId) {
        return { data: null, error: 'Unauthorized' };
    }

    // Check for existing active cycle
    const { data: existingCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', input.userId)
        .eq('cycle_status', 'active')
        .maybeSingle();

    if (existingCycle) {
        return { data: null, error: 'An active cycle already exists. Close it before creating a new one.' };
    }

    // Format dates properly for PostgreSQL trigger
    const startDateFormatted = formatDateForPostgres(input.startDate);
    const endDate = calculateEndDate(input.startDate);
    const endDateFormatted = formatDateForPostgres(endDate);

    // Insert cycle - this triggers generate_daily_actions()
    const { data, error } = await supabase
        .from('cycles')
        .insert({
            user_id: input.userId,
            name: input.name,
            start_date: startDateFormatted,
            end_date: endDateFormatted,
            cycle_status: 'active',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating cycle:', error);
        return { data: null, error: error.message };
    }

    // Verify daily_actions were generated
    const { count } = await supabase
        .from('daily_actions')
        .select('*', { count: 'exact', head: true })
        .eq('cycle_id', data.id);

    if (count !== 84) {
        console.warn(`Expected 84 daily actions, got ${count}. Trigger may have failed.`);
    }

    return { data, error: null };
};

/**
 * Close an active cycle
 * 
 * @param cycleId - Cycle to close
 * @returns Success status
 */
export const closeCycle = async (cycleId: string): Promise<{ success: boolean; error: string | null }> => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Call the close_cycle PostgreSQL function
    const { error } = await supabase.rpc('close_cycle', {
        p_cycle_id: cycleId,
    });

    if (error) {
        console.error('Error closing cycle:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
};

/**
 * Get active cycle for user
 */
export const getActiveCycle = async (userId: string): Promise<Cycle | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .eq('cycle_status', 'active')
        .maybeSingle();

    if (error) {
        console.error('Error fetching active cycle:', error);
        return null;
    }

    return data;
};

/**
 * Get current week number within a cycle (1-12)
 */
export const getCurrentWeek = (cycle: Cycle): number => {
    const startDate = new Date(cycle.start_date);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(12, weekNumber));
};

/**
 * Get remaining days in cycle
 */
export const getRemainingDays = (cycle: Cycle): number => {
    const endDate = new Date(cycle.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
};
