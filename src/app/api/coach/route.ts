/**
 * AETERNA 2026 — AI Coach Streaming API Route
 * 
 * Streaming Edge Route for Gemini 1.5 Flash responses.
 * Uses Vercel AI SDK for optimal streaming performance.
 * 
 * Endpoint: POST /api/coach
 */

import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@/lib/supabase/server';

// Edge runtime for optimal streaming
export const runtime = 'edge';

// ===========================================
// CONSTANTS
// ===========================================

const SYSTEM_PROMPT = `You are the user's Legacy Partner for AETERNA 2026.

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

// ===========================================
// ROUTE HANDLER
// ===========================================

export async function POST(req: Request) {
    try {
        // Get request body
        const { context } = await req.json();

        if (!context) {
            return new Response('Missing context', { status: 400 });
        }

        // Verify authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Build user message with context
        const userMessage = buildUserMessage(context);

        // Stream response from Gemini
        const result = streamText({
            model: google('gemini-1.5-flash-latest'),
            system: SYSTEM_PROMPT,
            prompt: userMessage,
            maxTokens: 150, // Enforce ~100 word limit
            temperature: 0.7, // Balanced creativity
        });

        // Return streaming response
        return result.toDataStreamResponse();

    } catch (error) {
        console.error('Coach API error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

// ===========================================
// HELPERS
// ===========================================

type CoachContext = {
    vision: string;
    currentGoal: string;
    weeklyScore: number;
    dailyScore: number;
    streak: number;
    isShielded: boolean;
    currentWeek: number;
    remainingDays: number;
};

function buildUserMessage(context: CoachContext): string {
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
}
