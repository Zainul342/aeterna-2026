/**
 * AETERNA 2026 — AI Server Actions
 * 
 * Handles AI coaching context preparation and non-streaming operations.
 * For streaming responses, use the /api/coach route.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ===========================================
// SCHEMAS
// ===========================================

const CoachContextSchema = z.object({
    cycleId: z.string().uuid(),
});

// ===========================================
// TYPES
// ===========================================

export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

export type CoachContext = {
    vision: string;
    currentGoal: string;
    weeklyScore: number;
    dailyScore: number;
    streak: number;
    isShielded: boolean;
    currentWeek: number;
    remainingDays: number;
};

// ===========================================
// ACTIONS
// ===========================================

/**
 * Build context for AI Legacy Coach
 * 
 * Gathers all relevant user data to inject into the AI prompt:
 * - Vision statement (10-year legacy)
 * - Current goal
 * - Execution scores
 * - Streak information
 */
export const buildCoachContext = async (
    input: z.infer<typeof CoachContextSchema>
): Promise<ActionResult<CoachContext>> => {
    try {
        const validated = CoachContextSchema.parse(input);

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get profile with vision and streaks
        const { data: profile } = await supabase
            .from('profiles')
            .select('vision_statement, winning_streak, losing_streak')
            .eq('id', user.id)
            .single();

        // Get cycle info
        const { data: cycle } = await supabase
            .from('cycles')
            .select('start_date, end_date')
            .eq('id', validated.cycleId)
            .single();

        // Get current goal (highest priority)
        const { data: goals } = await supabase
            .from('goals')
            .select('title')
            .eq('cycle_id', validated.cycleId)
            .order('priority', { ascending: true })
            .limit(1);

        // Calculate current week
        const startDate = new Date(cycle?.start_date ?? new Date());
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.max(1, Math.min(12, Math.floor(diffDays / 7) + 1));

        // Get remaining days
        const endDate = new Date(cycle?.end_date ?? new Date());
        const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

        // Get weekly score
        const { data: weeklyScore } = await supabase
            .from('weekly_scores')
            .select('score, is_shielded')
            .eq('cycle_id', validated.cycleId)
            .eq('week_number', currentWeek)
            .maybeSingle();

        // Get today's score
        const todayStr = today.toISOString().split('T')[0];
        const { data: todayActions } = await supabase
            .from('daily_actions')
            .select('is_completed')
            .eq('cycle_id', validated.cycleId)
            .eq('action_date', todayStr);

        const completed = todayActions?.filter(a => a.is_completed).length ?? 0;
        const dailyScore = Math.round((completed / 3) * 100);

        return {
            success: true,
            data: {
                vision: profile?.vision_statement ?? 'Build a meaningful legacy',
                currentGoal: goals?.[0]?.title ?? 'Focus on execution',
                weeklyScore: weeklyScore?.score ?? 0,
                dailyScore,
                streak: profile?.winning_streak ?? 0,
                isShielded: weeklyScore?.is_shielded ?? false,
                currentWeek,
                remainingDays,
            },
        };

    } catch (err) {
        if (err instanceof z.ZodError) {
            return { success: false, error: err.errors[0].message };
        }
        console.error('buildCoachContext error:', err);
        return { success: false, error: 'Failed to build context' };
    }
};

/**
 * Get AI prompt for Legacy Coach
 * 
 * Constraints:
 * - Max 100 words
 * - Authoritative yet empowering tone
 * - Links daily actions to 10-year legacy
 */
export const getCoachSystemPrompt = (): string => {
    return `You are the user's Legacy Partner for AETERNA 2026.

CONSTRAINTS:
- Maximum 100 words per response
- Never shame or guilt-trip
- Always connect today's action to 10-year legacy
- Provide ONE actionable next step
- Tone: Direct, confident, empowering

RESPONSE FORMAT:
[Observation] → [Identity Affirmation] → [Single Action]

STYLE:
- Speak like a trusted mentor who sees their potential
- Reference their vision statement naturally
- Use "you" not "the user"
- End with a clear, specific action`;
};

/**
 * Build user message for AI with injected context
 */
export const buildCoachUserMessage = (context: CoachContext): string => {
    const streakText = context.streak > 0
        ? `${context.streak}-day winning streak`
        : context.isShielded
            ? 'shielded week (recovery mode)'
            : 'building momentum';

    return `Context:
- Vision: "${context.vision}"
- Current 12-Week Goal: ${context.currentGoal}
- Week ${context.currentWeek} of 12 (${context.remainingDays} days remaining)
- Weekly Score: ${context.weeklyScore}%
- Today's Score: ${context.dailyScore}%
- Status: ${streakText}

Provide your coaching nudge (max 100 words):`;
};
