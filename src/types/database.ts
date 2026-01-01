/**
 * AETERNA 2026 — Database Type Definitions
 * 
 * Generated from Supabase schema (Senior Architect Validated)
 * Last Updated: January 1, 2026
 * 
 * @description TypeScript interfaces for all database tables and views.
 * These types should be used across the application for type safety.
 */

// ===========================================
// ENUMS
// ===========================================

export type CycleStatus = 'active' | 'closed';

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export type ExecutionStatus = 
  | 'EXECUTION_ELITE'  // 85-100%
  | 'ON_TRACK'         // 70-84%
  | 'WARNING'          // 50-69%
  | 'CRITICAL'         // 0-49%
  | 'SHIELDED';        // Shield activated

export type MomentumState = 'NEUTRAL' | 'FLOW_VELOCITY' | 'RESET_SANCTUARY';

// ===========================================
// CORE TABLES
// ===========================================

/**
 * User profile with vision and momentum credits
 */
export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  vision_statement: string | null;
  shield_credits: number; // 0-3
  timezone: string;
  nudge_enabled: boolean;
  winning_streak: number;
  losing_streak: number;
  created_at: string;
  updated_at: string;
}

/**
 * 12-week execution cycle
 * 
 * ⚠️ TRIGGER: On INSERT, 84 daily_actions rows are auto-generated
 */
export interface Cycle {
  id: string;
  user_id: string;
  name: string;
  start_date: string; // DATE format: 'YYYY-MM-DD'
  end_date: string;   // DATE format: 'YYYY-MM-DD'
  cycle_status: CycleStatus;
  final_score: number | null;
  created_at: string;
  closed_at: string | null;
}

/**
 * High-level 12-week goal
 */
export interface Goal {
  id: string;
  cycle_id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_metric: string | null;
  target_value: number | null;
  current_value: number;
  priority: 1 | 2 | 3;
  created_at: string;
  updated_at: string;
}

/**
 * Weekly tactic with versioning
 * 
 * ⚠️ VERSIONING: Updates create NEW records, old records become is_active: false
 * The returned record after UPDATE has a DIFFERENT ID than the original.
 */
export interface Tactic {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description: string | null;
  weight: number; // 1-10
  is_active: boolean;
  version: number;
  previous_version_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Daily executable action (Monk Mode: max 3 visible per day)
 * 
 * ⚠️ AUTO-GENERATED: 84 rows created when parent cycle is inserted
 * ⚠️ TRIGGER: Updating is_completed triggers weekly score recalculation
 */
export interface DailyAction {
  id: string;
  tactic_id: string | null;
  user_id: string;
  cycle_id: string;
  title: string;
  action_date: string; // DATE format: 'YYYY-MM-DD'
  is_completed: boolean;
  completed_at: string | null;
  energy_level: EnergyLevel | null;
  notes: string | null;
  search_vector: string | null; // TSVECTOR (opaque to frontend)
  created_at: string;
  updated_at: string;
}

/**
 * Shield credit activation (IMMUTABLE)
 * 
 * ⚠️ IMMUTABLE: Users can INSERT only. No UPDATE or DELETE allowed.
 * Only service_role can set revoked = true for abuse prevention.
 */
export interface MomentumCredit {
  id: string;
  user_id: string;
  cycle_id: string;
  week_number: number; // 1-12
  applied_at: string;
  reason: string;
  biometrics_verified: boolean;
  ai_detected: boolean;
  revoked: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
}

/**
 * Aggregated weekly execution score
 */
export interface WeeklyScore {
  id: string;
  user_id: string;
  cycle_id: string;
  week_number: number; // 1-12
  week_start: string; // DATE format
  score: number; // 0-100
  tasks_completed: number;
  tasks_total: number;
  is_shielded: boolean;
  created_at: string;
  updated_at: string;
}

// ===========================================
// MATERIALIZED VIEW
// ===========================================

/**
 * Materialized view for dashboard performance
 * 
 * ⚠️ REFRESH: Call refresh_weekly_scores_mv() after batch updates
 */
export interface WeeklyScoreMV {
  user_id: string;
  cycle_id: string;
  week_number: number;
  week_start: string;
  tasks_completed: number;
  tasks_total: number;
  raw_score: number;
  is_shielded: boolean;
  display_score: number | null; // NULL if shielded (use previous week's score)
}

// ===========================================
// INPUT TYPES (for mutations)
// ===========================================

/**
 * Input for creating a new cycle
 * 
 * ⚠️ IMPORTANT: start_date must be a valid DATE string ('YYYY-MM-DD')
 * to properly trigger the generate_daily_actions() function
 */
export interface CycleInput {
  user_id: string;
  name: string;
  start_date: string; // Must be DATE format: 'YYYY-MM-DD'
  end_date: string;   // Must be start_date + 83 days
}

export interface GoalInput {
  cycle_id: string;
  user_id: string;
  title: string;
  description?: string;
  target_metric?: string;
  target_value?: number;
  priority?: 1 | 2 | 3;
}

/**
 * Input for updating a tactic
 * 
 * ⚠️ VERSION TRIGGER: This will create a NEW record and close the old one.
 * The returned tactic will have a different ID.
 */
export interface TacticUpdate {
  title?: string;
  description?: string;
  weight?: number;
}

export interface DailyActionUpdate {
  title?: string;
  is_completed?: boolean;
  energy_level?: EnergyLevel;
  notes?: string;
}

export interface ShieldActivationInput {
  user_id: string;
  cycle_id: string;
  week_number: number;
  reason: string;
  biometrics_verified?: boolean;
  ai_detected?: boolean;
}

// ===========================================
// COMPUTED / DERIVED TYPES
// ===========================================

/**
 * Dashboard summary combining multiple data sources
 */
export interface DashboardSummary {
  cycle: Cycle;
  currentWeek: number;
  remainingDays: number;
  weeklyScore: number;
  dailyScore: number;
  streak: {
    winning: number;
    losing: number;
  };
  shieldCredits: number;
  momentumState: MomentumState;
  todaysTasks: DailyAction[];
}

/**
 * AI Coach context for prompt injection
 */
export interface AICoachContext {
  vision: string;
  goal: string;
  indicators: string[];
  score: number;
  streak: number;
  isShielded: boolean;
}

// ===========================================
// SUPABASE RESPONSE TYPES
// ===========================================

/**
 * Generic Supabase response wrapper
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    code: string;
  } | null;
}

/**
 * Supabase realtime broadcast payload
 */
export interface ScoreUpdatePayload {
  score: number;
  timestamp: number;
}
