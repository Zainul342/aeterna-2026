/**
 * AETERNA 2026 — Monk Mode Task List
 * 
 * Client component with useOptimistic for <50ms perceived latency.
 * Displays max 3 tasks per day (Monk Mode constraint).
 */

'use client';

import { useOptimistic, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';
import { checkOffAction, uncheckAction } from '@/app/actions/execution.actions';
import { cn } from '@/lib/utils';

// ===========================================
// TYPES
// ===========================================

type DailyAction = {
    id: string;
    title: string;
    is_completed: boolean;
    completed_at: string | null;
    energy_level: number | null;
};

type MonkModeListProps = {
    actions: DailyAction[];
    cycleId: string;
};

type OptimisticAction = DailyAction & {
    pending?: boolean;
};

// ===========================================
// COMPONENT
// ===========================================

export const MonkModeList = ({ actions, cycleId }: MonkModeListProps) => {
    const [isPending, startTransition] = useTransition();

    // Optimistic state for instant UI feedback
    const [optimisticActions, setOptimisticAction] = useOptimistic<
        OptimisticAction[],
        { id: string; completed: boolean }
    >(
        actions.map(a => ({ ...a, pending: false })),
        (state, { id, completed }) =>
            state.map(action =>
                action.id === id
                    ? { ...action, is_completed: completed, pending: true }
                    : action
            )
    );

    const handleToggle = (action: DailyAction) => {
        const newCompleted = !action.is_completed;

        // Optimistic update (instant)
        startTransition(async () => {
            setOptimisticAction({ id: action.id, completed: newCompleted });

            // Server confirmation (background)
            if (newCompleted) {
                await checkOffAction({ actionId: action.id });
            } else {
                await uncheckAction(action.id);
            }
        });
    };

    const completedCount = optimisticActions.filter(a => a.is_completed).length;
    const progress = Math.round((completedCount / 3) * 100);

    return (
        <div className="space-y-4">
            {/* Progress Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                    Today's Focus
                </h3>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-2xl font-bold tabular-nums",
                        progress >= 85 ? "text-[#CCFF00]" :
                            progress >= 50 ? "text-amber-400" :
                                "text-zinc-400"
                    )}>
                        {progress}%
                    </span>
                    {isPending && (
                        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    className={cn(
                        "h-full rounded-full",
                        progress >= 85 ? "bg-[#CCFF00]" :
                            progress >= 50 ? "bg-amber-400" :
                                "bg-zinc-600"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            </div>

            {/* Task List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {optimisticActions.map((action, index) => (
                        <motion.div
                            key={action.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                duration: 0.2,
                                delay: index * 0.05,
                                layout: { duration: 0.2 }
                            }}
                        >
                            <TaskItem
                                action={action}
                                onToggle={() => handleToggle(action)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {optimisticActions.length === 0 && (
                <div className="py-8 text-center text-zinc-500">
                    <p>No tasks for today.</p>
                    <p className="text-sm mt-1">Add up to 3 focus tasks.</p>
                </div>
            )}

            {/* Monk Mode Reminder */}
            {optimisticActions.length < 3 && optimisticActions.length > 0 && (
                <p className="text-xs text-zinc-600 text-center">
                    {3 - optimisticActions.length} more task{3 - optimisticActions.length > 1 ? 's' : ''} available
                </p>
            )}
        </div>
    );
};

// ===========================================
// SUB-COMPONENTS
// ===========================================

type TaskItemProps = {
    action: OptimisticAction;
    onToggle: () => void;
};

const TaskItem = ({ action, onToggle }: TaskItemProps) => {
    const isCompleted = action.is_completed;
    const isPending = action.pending;

    return (
        <button
            onClick={onToggle}
            disabled={isPending}
            className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                "hover:scale-[1.01] active:scale-[0.99]",
                isCompleted
                    ? "bg-[#CCFF00]/10 border-[#CCFF00]/30"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700",
                isPending && "opacity-70"
            )}
        >
            {/* Checkbox */}
            <div className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                isCompleted
                    ? "bg-[#CCFF00] border-[#CCFF00]"
                    : "border-zinc-600 hover:border-zinc-400"
            )}>
                {isCompleted && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <Check className="w-4 h-4 text-black" strokeWidth={3} />
                    </motion.div>
                )}
                {isPending && !isCompleted && (
                    <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />
                )}
            </div>

            {/* Task Title */}
            <span className={cn(
                "flex-1 text-left font-medium transition-all",
                isCompleted
                    ? "text-zinc-400 line-through"
                    : "text-white"
            )}>
                {action.title}
            </span>

            {/* Completion indicator */}
            {isCompleted && action.completed_at && (
                <span className="text-xs text-zinc-500">
                    {new Date(action.completed_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            )}
        </button>
    );
};

export default MonkModeList;
