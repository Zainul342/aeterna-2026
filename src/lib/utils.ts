/**
 * AETERNA 2026 — Utility Functions
 * 
 * Common utility functions used across the application.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs));
};

/**
 * Format date to YYYY-MM-DD for PostgreSQL
 */
export const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Calculate end date for 12-week cycle (start + 83 days)
 */
export const calculateCycleEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 83);
    return endDate;
};

/**
 * Get current week number within a cycle (1-12)
 */
export const getCurrentWeek = (startDate: Date): number => {
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(12, weekNumber));
};

/**
 * Get remaining days in cycle
 */
export const getRemainingDays = (endDate: Date): number => {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate execution status from score
 */
export const getExecutionStatus = (
    score: number,
    isShielded: boolean
): 'EXECUTION_ELITE' | 'ON_TRACK' | 'WARNING' | 'CRITICAL' | 'SHIELDED' => {
    if (isShielded) return 'SHIELDED';
    if (score >= 85) return 'EXECUTION_ELITE';
    if (score >= 70) return 'ON_TRACK';
    if (score >= 50) return 'WARNING';
    return 'CRITICAL';
};

/**
 * Get momentum state for UI theming
 */
export const getMomentumState = (
    winningStreak: number,
    losingStreak: number
): 'NEUTRAL' | 'FLOW_VELOCITY' | 'RESET_SANCTUARY' => {
    if (winningStreak >= 7) return 'FLOW_VELOCITY';
    if (losingStreak >= 3) return 'RESET_SANCTUARY';
    return 'NEUTRAL';
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
};
