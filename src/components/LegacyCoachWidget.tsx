/**
 * AETERNA 2026 — Legacy Coach Widget
 * 
 * Client component using useChat from ai/react for streaming.
 * Displays AI coaching messages with Gemini 1.5 Flash.
 */

'use client';

import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===========================================
// TYPES
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

type LegacyCoachWidgetProps = {
    context: CoachContext;
    initialMessage?: string;
};

// ===========================================
// COMPONENT
// ===========================================

export const LegacyCoachWidget = ({
    context,
    initialMessage
}: LegacyCoachWidgetProps) => {
    const [autoSpeak, setAutoSpeak] = useState(false);

    const { messages, isLoading, reload, error } = useChat({
        api: '/api/coach',
        body: { context },
        initialMessages: initialMessage
            ? [{ id: 'initial', role: 'assistant', content: initialMessage }]
            : [],
    });

    // Get latest assistant message
    const latestMessage = messages
        .filter(m => m.role === 'assistant')
        .slice(-1)[0];

    // Auto-speak new messages
    useEffect(() => {
        if (autoSpeak && latestMessage?.content && !isLoading) {
            speak(latestMessage.content);
        }
    }, [latestMessage?.content, isLoading, autoSpeak]);

    // Request fresh coaching
    const requestCoaching = () => {
        reload();
    };

    // Text-to-speech
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/5 via-transparent to-cyan-500/5 pointer-events-none" />

            {/* Content */}
            <div className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isLoading
                                ? "bg-[#CCFF00]/20 animate-pulse"
                                : "bg-[#CCFF00]/10"
                        )}>
                            <Sparkles className="w-4 h-4 text-[#CCFF00]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Legacy Coach</h3>
                            <p className="text-xs text-zinc-500">
                                Week {context.currentWeek} • {context.remainingDays} days left
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                autoSpeak
                                    ? "bg-[#CCFF00]/20 text-[#CCFF00]"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                            aria-label={autoSpeak ? "Mute" : "Enable voice"}
                        >
                            {autoSpeak ? (
                                <Volume2 className="w-4 h-4" />
                            ) : (
                                <VolumeX className="w-4 h-4" />
                            )}
                        </button>

                        <button
                            onClick={requestCoaching}
                            disabled={isLoading}
                            className={cn(
                                "p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors",
                                isLoading && "animate-spin"
                            )}
                            aria-label="Refresh coaching"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Score context */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            context.weeklyScore >= 85 ? "bg-[#CCFF00]" :
                                context.weeklyScore >= 50 ? "bg-amber-400" :
                                    "bg-red-400"
                        )} />
                        <span className="text-zinc-400">
                            {context.weeklyScore}% weekly
                        </span>
                    </div>

                    {context.streak > 0 && (
                        <span className="text-[#CCFF00] font-medium">
                            🔥 {context.streak} day streak
                        </span>
                    )}

                    {context.isShielded && (
                        <span className="text-yellow-400 font-medium">
                            🛡️ Shielded
                        </span>
                    )}
                </div>

                {/* Message */}
                <AnimatePresence mode="wait">
                    {error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                        >
                            <p className="text-red-400 text-sm">
                                Unable to connect to coach. Please try again.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={latestMessage?.id ?? 'empty'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "p-4 rounded-2xl",
                                context.streak >= 7
                                    ? "bg-[#CCFF00]/10 border border-[#CCFF00]/20"
                                    : "bg-zinc-800/50"
                            )}
                        >
                            {isLoading && !latestMessage?.content ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-[#CCFF00]"
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    delay: i * 0.2
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-zinc-500 text-sm">Preparing your nudge...</span>
                                </div>
                            ) : (
                                <p className="text-white leading-relaxed">
                                    {latestMessage?.content || "Ready to receive your daily coaching nudge."}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action button */}
                {!latestMessage && !isLoading && (
                    <button
                        onClick={requestCoaching}
                        className="w-full py-3 rounded-xl bg-[#CCFF00] text-black font-semibold 
                       hover:bg-[#CCFF00]/90 transition-colors"
                    >
                        Get Today's Nudge
                    </button>
                )}
            </div>
        </div>
    );
};

export default LegacyCoachWidget;
