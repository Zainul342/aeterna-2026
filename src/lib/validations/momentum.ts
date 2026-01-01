/**
 * AETERNA 2026 — Momentum Validation Utilities
 * 
 * @description Validation logic for Shield Credits and momentum scoring.
 * These utilities ensure data integrity and enforce business rules.
 */

import { createClient } from '@/lib/supabase/client';
import type { MomentumCredit, WeeklyScore } from '@/types/database';

// ===========================================
// CONSTANTS
// ===========================================

export const CREDITS_PER_QUARTER = 3;
export const EXECUTION_THRESHOLD = 85;
export const WARNING_THRESHOLD = 50;
export const MONK_MODE_MAX_TASKS = 3;

// ===========================================
// SHIELD CREDIT VALIDATION
// ===========================================

/**
 * Check if a valid (non-revoked) shield credit exists for a specific week
 * 
 * @param userId - User ID
 * @param cycleId - Current cycle ID
 * @param weekNumber - Week number (1-12)
 * @returns Shield credit if exists and not revoked, null otherwise
 */
export const getValidShieldCredit = async (
    userId: string,
    cycleId: string,
    weekNumber: number
): Promise<MomentumCredit | null> => {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('momentum_credits')
        .select('*')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .eq('week_number', weekNumber)
        .eq('revoked', false)
        .maybeSingle();

    if (error) {
        console.error('Error checking shield credit:', error);
        return null;
    }

    return data;
};

/**
 * Check if a shield credit can be applied for score override
 * 
 * @param userId - User ID
 * @param cycleId - Current cycle ID
 * @param weekNumber - Week number (1-12)
 * @returns Object with canOverride flag and reason
 */
export const canOverrideScore = async (
    userId: string,
    cycleId: string,
    weekNumber: number
): Promise<{ canOverride: boolean; reason: string; shield: MomentumCredit | null }> => {
    const shield = await getValidShieldCredit(userId, cycleId, weekNumber);

    if (!shield) {
        return {
            canOverride: false,
            reason: 'No valid shield credit exists for this week',
            shield: null,
        };
    }

    if (shield.revoked) {
        return {
            canOverride: false,
            reason: 'Shield credit has been revoked',
            shield: null,
        };
    }

    return {
        canOverride: true,
        reason: 'Valid shield credit found',
        shield,
    };
};

/**
 * Get remaining shield credits for user in current quarter
 * 
 * @param userId - User ID
 * @param cycleId - Current cycle ID
 * @returns Number of remaining credits (0-3)
 */
export const getRemainingShieldCredits = async (
    userId: string,
    cycleId: string
): Promise<number> => {
    const supabase = createClient();

    const { count, error } = await supabase
        .from('momentum_credits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .eq('revoked', false);

    if (error) {
        console.error('Error counting shield credits:', error);
        return 0;
    }

    const usedCredits = count ?? 0;
    return Math.max(0, CREDITS_PER_QUARTER - usedCredits);
};

/**
 * Validate if user can activate a new shield credit
 * 
 * @param userId - User ID
 * @param cycleId - Current cycle ID
 * @param weekNumber - Target week number
 * @returns Validation result with canActivate flag
 */
export const validateShieldActivation = async (
    userId: string,
    cycleId: string,
    weekNumber: number
): Promise<{ canActivate: boolean; reason: string; remainingCredits: number }> => {
    // Check remaining credits
    const remaining = await getRemainingShieldCredits(userId, cycleId);

    if (remaining <= 0) {
        return {
            canActivate: false,
            reason: 'No shield credits remaining this cycle',
            remainingCredits: 0,
        };
    }

    // Check if shield already exists for this week
    const existingShield = await getValidShieldCredit(userId, cycleId, weekNumber);

    if (existingShield) {
        return {
            canActivate: false,
            reason: 'Shield already activated for this week',
            remainingCredits: remaining,
        };
    }

    // Check for abuse pattern (optional - requires historical data)
    const isAbuse = await detectChronicLowEffort(userId);

    if (isAbuse) {
        return {
            canActivate: false,
            reason: 'Shield rejected: chronic low effort pattern detected',
            remainingCredits: remaining,
        };
    }

    return {
        canActivate: true,
        reason: 'Shield activation allowed',
        remainingCredits: remaining,
    };
};

// ===========================================
// ABUSE PREVENTION
// ===========================================

/**
 * Detect chronic low effort patterns to prevent shield abuse
 * Compares recent 4 weeks against 12-week baseline
 * 
 * @param userId - User ID
 * @returns True if chronic low effort detected
 */
export const detectChronicLowEffort = async (userId: string): Promise<boolean> => {
    const supabase = createClient();

    // Get last 12 weeks of scores
    const { data: history, error } = await supabase
        .from('weekly_scores')
        .select('score')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(12);

    if (error || !history || history.length < 8) {
        // Not enough data to determine pattern
        return false;
    }

    const scores = history.map((h) => h.score);
    const totalAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
    const recentAverage = scores.slice(0, 4).reduce((a, b) => a + b, 0) / 4;

    // Flag as chronic if:
    // 1. Recent 4 weeks are 40% below baseline
    // 2. AND baseline itself is below 60%
    if (recentAverage < totalAverage * 0.6 && totalAverage < 60) {
        return true;
    }

    return false;
};

// ===========================================
// SCORE CALCULATIONS
// ===========================================

/**
 * Calculate execution status based on score and shield
 * 
 * @param score - Execution score (0-100)
 * @param isShielded - Whether week is shielded
 * @returns Execution status enum
 */
export const getExecutionStatus = (
    score: number,
    isShielded: boolean
): 'EXECUTION_ELITE' | 'ON_TRACK' | 'WARNING' | 'CRITICAL' | 'SHIELDED' => {
    if (isShielded) return 'SHIELDED';
    if (score >= EXECUTION_THRESHOLD) return 'EXECUTION_ELITE';
    if (score >= 70) return 'ON_TRACK';
    if (score >= WARNING_THRESHOLD) return 'WARNING';
    return 'CRITICAL';
};

/**
 * Calculate daily score (Monk Mode: always out of 3)
 * 
 * @param completedTasks - Number of completed tasks
 * @returns Score 0-100
 */
export const calculateDailyScore = (completedTasks: number): number => {
    return Math.round((Math.min(completedTasks, MONK_MODE_MAX_TASKS) / MONK_MODE_MAX_TASKS) * 100);
};

/**
 * Calculate weekly score from daily scores
 * 
 * @param dailyScores - Array of daily scores
 * @returns Average score 0-100
 */
export const calculateWeeklyScore = (dailyScores: number[]): number => {
    if (dailyScores.length === 0) return 0;
    const sum = dailyScores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / dailyScores.length);
};

/**
 * Get display score considering shield status
 * If shielded, returns the previous week's score
 * 
 * @param currentScore - Current calculated score
 * @param isShielded - Whether current week is shielded
 * @param previousScore - Previous week's score (for shield fallback)
 * @returns Display score
 */
export const getDisplayScore = (
    currentScore: number,
    isShielded: boolean,
    previousScore: number | null
): number => {
    if (isShielded && previousScore !== null) {
        return previousScore;
    }
    return currentScore;
};

// ===========================================
// MOMENTUM STATE
// ===========================================

/**
 * Calculate momentum state based on streaks
 * 
 * @param winningStreak - Consecutive winning days
 * @param losingStreak - Consecutive losing days
 * @returns Momentum state for UI theming
 */
export const getMomentumState = (
    winningStreak: number,
    losingStreak: number
): 'NEUTRAL' | 'FLOW_VELOCITY' | 'RESET_SANCTUARY' => {
    if (winningStreak >= 7) {
        return 'FLOW_VELOCITY';
    }
    if (losingStreak >= 3) {
        return 'RESET_SANCTUARY';
    }
    return 'NEUTRAL';
};
