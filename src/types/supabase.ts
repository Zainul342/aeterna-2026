/**
 * AETERNA 2026 — Supabase Generated Types
 * 
 * Auto-generated from Supabase schema
 * Last Updated: January 1, 2026
 * 
 * DO NOT EDIT MANUALLY - regenerate using:
 * npx supabase gen types typescript --project-id ygwokboklvbkfddjnqbo
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            cycles: {
                Row: {
                    closed_at: string | null
                    created_at: string | null
                    cycle_status: Database["public"]["Enums"]["cycle_status"]
                    end_date: string
                    final_score: number | null
                    id: string
                    name: string
                    start_date: string
                    user_id: string
                }
                Insert: {
                    closed_at?: string | null
                    created_at?: string | null
                    cycle_status?: Database["public"]["Enums"]["cycle_status"]
                    end_date: string
                    final_score?: number | null
                    id?: string
                    name?: string
                    start_date: string
                    user_id: string
                }
                Update: {
                    closed_at?: string | null
                    created_at?: string | null
                    cycle_status?: Database["public"]["Enums"]["cycle_status"]
                    end_date?: string
                    final_score?: number | null
                    id?: string
                    name?: string
                    start_date?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "cycles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            daily_actions: {
                Row: {
                    action_date: string
                    completed_at: string | null
                    created_at: string | null
                    cycle_id: string
                    energy_level: number | null
                    id: string
                    is_completed: boolean | null
                    notes: string | null
                    search_vector: unknown | null
                    tactic_id: string | null
                    title: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    action_date: string
                    completed_at?: string | null
                    created_at?: string | null
                    cycle_id: string
                    energy_level?: number | null
                    id?: string
                    is_completed?: boolean | null
                    notes?: string | null
                    search_vector?: unknown | null
                    tactic_id?: string | null
                    title: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    action_date?: string
                    completed_at?: string | null
                    created_at?: string | null
                    cycle_id?: string
                    energy_level?: number | null
                    id?: string
                    is_completed?: boolean | null
                    notes?: string | null
                    search_vector?: unknown | null
                    tactic_id?: string | null
                    title?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_actions_cycle_id_fkey"
                        columns: ["cycle_id"]
                        isOneToOne: false
                        referencedRelation: "cycles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_actions_tactic_id_fkey"
                        columns: ["tactic_id"]
                        isOneToOne: false
                        referencedRelation: "tactics"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_actions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            goals: {
                Row: {
                    created_at: string | null
                    current_value: number | null
                    cycle_id: string
                    description: string | null
                    id: string
                    priority: number | null
                    target_metric: string | null
                    target_value: number | null
                    title: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    current_value?: number | null
                    cycle_id: string
                    description?: string | null
                    id?: string
                    priority?: number | null
                    target_metric?: string | null
                    target_value?: number | null
                    title: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    current_value?: number | null
                    cycle_id?: string
                    description?: string | null
                    id?: string
                    priority?: number | null
                    target_metric?: string | null
                    target_value?: number | null
                    title?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goals_cycle_id_fkey"
                        columns: ["cycle_id"]
                        isOneToOne: false
                        referencedRelation: "cycles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "goals_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            momentum_credits: {
                Row: {
                    ai_detected: boolean | null
                    applied_at: string | null
                    biometrics_verified: boolean | null
                    cycle_id: string
                    id: string
                    reason: string
                    revoked: boolean | null
                    revoked_at: string | null
                    revoked_by: string | null
                    user_id: string
                    week_number: number
                }
                Insert: {
                    ai_detected?: boolean | null
                    applied_at?: string | null
                    biometrics_verified?: boolean | null
                    cycle_id: string
                    id?: string
                    reason: string
                    revoked?: boolean | null
                    revoked_at?: string | null
                    revoked_by?: string | null
                    user_id: string
                    week_number: number
                }
                Update: {
                    ai_detected?: boolean | null
                    applied_at?: string | null
                    biometrics_verified?: boolean | null
                    cycle_id?: string
                    id?: string
                    reason?: string
                    revoked?: boolean | null
                    revoked_at?: string | null
                    revoked_by?: string | null
                    user_id?: string
                    week_number?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "momentum_credits_cycle_id_fkey"
                        columns: ["cycle_id"]
                        isOneToOne: false
                        referencedRelation: "cycles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "momentum_credits_revoked_by_fkey"
                        columns: ["revoked_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "momentum_credits_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    full_name: string
                    id: string
                    losing_streak: number | null
                    nudge_enabled: boolean | null
                    shield_credits: number
                    timezone: string | null
                    updated_at: string | null
                    vision_statement: string | null
                    winning_streak: number | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    full_name: string
                    id: string
                    losing_streak?: number | null
                    nudge_enabled?: boolean | null
                    shield_credits?: number
                    timezone?: string | null
                    updated_at?: string | null
                    vision_statement?: string | null
                    winning_streak?: number | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    full_name?: string
                    id?: string
                    losing_streak?: number | null
                    nudge_enabled?: boolean | null
                    shield_credits?: number
                    timezone?: string | null
                    updated_at?: string | null
                    vision_statement?: string | null
                    winning_streak?: number | null
                }
                Relationships: []
            }
            tactics: {
                Row: {
                    created_at: string | null
                    description: string | null
                    goal_id: string
                    id: string
                    is_active: boolean | null
                    previous_version_id: string | null
                    title: string
                    updated_at: string | null
                    user_id: string
                    version: number | null
                    weight: number
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    goal_id: string
                    id?: string
                    is_active?: boolean | null
                    previous_version_id?: string | null
                    title: string
                    updated_at?: string | null
                    user_id: string
                    version?: number | null
                    weight?: number
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    goal_id?: string
                    id?: string
                    is_active?: boolean | null
                    previous_version_id?: string | null
                    title?: string
                    updated_at?: string | null
                    user_id?: string
                    version?: number | null
                    weight?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "tactics_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tactics_previous_version_id_fkey"
                        columns: ["previous_version_id"]
                        isOneToOne: false
                        referencedRelation: "tactics"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tactics_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            weekly_scores: {
                Row: {
                    created_at: string | null
                    cycle_id: string
                    id: string
                    is_shielded: boolean | null
                    score: number
                    tasks_completed: number | null
                    tasks_total: number | null
                    updated_at: string | null
                    user_id: string
                    week_number: number
                    week_start: string
                }
                Insert: {
                    created_at?: string | null
                    cycle_id: string
                    id?: string
                    is_shielded?: boolean | null
                    score?: number
                    tasks_completed?: number | null
                    tasks_total?: number | null
                    updated_at?: string | null
                    user_id: string
                    week_number: number
                    week_start: string
                }
                Update: {
                    created_at?: string | null
                    cycle_id?: string
                    id?: string
                    is_shielded?: boolean | null
                    score?: number
                    tasks_completed?: number | null
                    tasks_total?: number | null
                    updated_at?: string | null
                    user_id?: string
                    week_number?: number
                    week_start?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "weekly_scores_cycle_id_fkey"
                        columns: ["cycle_id"]
                        isOneToOne: false
                        referencedRelation: "cycles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "weekly_scores_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            close_cycle: {
                Args: {
                    p_cycle_id: string
                }
                Returns: undefined
            }
            get_current_week: {
                Args: {
                    p_cycle_id: string
                }
                Returns: number
            }
            get_remaining_days: {
                Args: {
                    p_cycle_id: string
                }
                Returns: number
            }
        }
        Enums: {
            cycle_status: "active" | "closed"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]

// Convenience aliases
export type Profile = Tables<'profiles'>
export type Cycle = Tables<'cycles'>
export type Goal = Tables<'goals'>
export type Tactic = Tables<'tactics'>
export type DailyAction = Tables<'daily_actions'>
export type MomentumCredit = Tables<'momentum_credits'>
export type WeeklyScore = Tables<'weekly_scores'>
export type CycleStatus = Enums<'cycle_status'>
