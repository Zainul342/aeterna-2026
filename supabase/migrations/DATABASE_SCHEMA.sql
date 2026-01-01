-- =====================================================
-- AETERNA 2026 — Database Schema Migration
-- =====================================================
-- Version: 1.0.0
-- Created: 2026-01-01
-- Description: Core tables, triggers, views, and RLS policies
-- =====================================================

-- ===========================================
-- SECTION 1: ENUM TYPES
-- ===========================================

-- Cycle status enum (must be created before tables)
CREATE TYPE cycle_status AS ENUM ('active', 'closed');

-- Energy level enum for daily tracking
CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high', 'peak');


-- ===========================================
-- SECTION 2: CORE TABLES
-- ===========================================

-- -----------------------------------------
-- Table: profiles
-- User profile with vision and shield credits
-- -----------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    vision_statement TEXT,
    shield_credits INTEGER NOT NULL DEFAULT 3 CHECK (shield_credits >= 0 AND shield_credits <= 3),
    timezone TEXT DEFAULT 'UTC',
    nudge_enabled BOOLEAN DEFAULT true,
    winning_streak INTEGER DEFAULT 0,
    losing_streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles with vision statement and momentum credits';
COMMENT ON COLUMN profiles.shield_credits IS 'Number of shield credits remaining (resets each quarter)';
COMMENT ON COLUMN profiles.vision_statement IS 'User''s 10-year legacy vision for AI coaching context';


-- -----------------------------------------
-- Table: cycles
-- 12-week execution cycles
-- -----------------------------------------
CREATE TABLE cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Q1 2026',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cycle_status cycle_status NOT NULL DEFAULT 'active',
    final_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    -- Calculated field for current week (1-12)
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    -- Ensure exactly 84 days (12 weeks)
    CONSTRAINT valid_cycle_length CHECK (end_date - start_date = 83)
);

-- Partial unique index: Only one active cycle per user
CREATE UNIQUE INDEX idx_one_active_cycle_per_user 
ON cycles(user_id) 
WHERE cycle_status = 'active';

COMMENT ON TABLE cycles IS '12-week execution cycles with status tracking';
COMMENT ON COLUMN cycles.final_score IS 'Calculated upon cycle closure (average of weekly scores)';


-- -----------------------------------------
-- Table: goals
-- 12-week goals linked to cycles
-- -----------------------------------------
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_metric TEXT,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE goals IS 'High-level 12-week goals (max 3 per cycle recommended)';
COMMENT ON COLUMN goals.priority IS '1 = Highest priority, 3 = Lowest';


-- -----------------------------------------
-- Table: tactics
-- Strategic actions linked to goals
-- -----------------------------------------
CREATE TABLE tactics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tactics IS 'Weekly tactics that contribute to goals';
COMMENT ON COLUMN tactics.weight IS 'Impact weight for scoring (1-10)';


-- -----------------------------------------
-- Table: daily_actions
-- Daily executable tasks (Monk Mode: max 3 visible)
-- -----------------------------------------
CREATE TABLE daily_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tactic_id UUID REFERENCES tactics(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    action_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    notes TEXT,
    
    -- AI search vector for semantic queries
    search_vector TSVECTOR,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate actions on the same date
    CONSTRAINT unique_action_per_date UNIQUE (user_id, title, action_date)
);

COMMENT ON TABLE daily_actions IS 'Daily executable actions with Monk Mode constraint (max 3 per day)';
COMMENT ON COLUMN daily_actions.energy_level IS 'User energy level when completing (1=Low, 5=Peak)';
COMMENT ON COLUMN daily_actions.search_vector IS 'Full-text search vector for AI semantic queries';


-- -----------------------------------------
-- Table: momentum_credits (IMMUTABLE)
-- Shield credits for life events
-- -----------------------------------------
CREATE TABLE momentum_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT NOT NULL,
    biometrics_verified BOOLEAN DEFAULT false,
    ai_detected BOOLEAN DEFAULT false,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES profiles(id),
    
    -- One shield per week per user
    CONSTRAINT unique_shield_per_week UNIQUE (user_id, cycle_id, week_number)
);

COMMENT ON TABLE momentum_credits IS 'Immutable shield credit log - users can only INSERT';
COMMENT ON COLUMN momentum_credits.biometrics_verified IS 'True if shield was verified via biometric data';
COMMENT ON COLUMN momentum_credits.revoked IS 'Can only be set by service_role for abuse prevention';


-- -----------------------------------------
-- Table: weekly_scores
-- Aggregated weekly execution scores
-- -----------------------------------------
CREATE TABLE weekly_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
    week_start DATE NOT NULL,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_total INTEGER DEFAULT 0,
    is_shielded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_weekly_score UNIQUE (user_id, cycle_id, week_number)
);

COMMENT ON TABLE weekly_scores IS 'Aggregated weekly scores with shield status';


-- ===========================================
-- SECTION 3: INDEXES (Sub-50ms Goals)
-- ===========================================

-- Composite index for fast user+cycle+date queries
CREATE INDEX idx_daily_actions_user_cycle_date 
ON daily_actions(user_id, cycle_id, action_date DESC);

-- BRIN index for time-series queries (very efficient for date ranges)
CREATE INDEX idx_daily_actions_brin 
ON daily_actions USING BRIN(action_date);

-- GIN index for AI semantic search
CREATE INDEX idx_daily_actions_search 
ON daily_actions USING GIN(search_vector);

-- Fast cycle lookup by user and status
CREATE INDEX idx_cycles_user_status 
ON cycles(user_id, cycle_status);

-- Fast goal lookup by cycle
CREATE INDEX idx_goals_cycle 
ON goals(cycle_id);

-- Fast tactic lookup by goal
CREATE INDEX idx_tactics_goal 
ON tactics(goal_id);

-- Fast weekly score lookup
CREATE INDEX idx_weekly_scores_user_cycle 
ON weekly_scores(user_id, cycle_id, week_number);

-- Momentum credits lookup
CREATE INDEX idx_momentum_credits_user_cycle 
ON momentum_credits(user_id, cycle_id) 
WHERE revoked = false;


-- ===========================================
-- SECTION 4: MATERIALIZED VIEW
-- ===========================================

-- Weekly scores materialized view for dashboard performance
CREATE MATERIALIZED VIEW weekly_scores_mv AS
SELECT 
    da.user_id,
    da.cycle_id,
    EXTRACT(WEEK FROM da.action_date) - EXTRACT(WEEK FROM c.start_date) + 1 AS week_number,
    DATE_TRUNC('week', da.action_date)::DATE AS week_start,
    COUNT(*) FILTER (WHERE da.is_completed = true) AS tasks_completed,
    COUNT(*) AS tasks_total,
    ROUND(
        (COUNT(*) FILTER (WHERE da.is_completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) AS raw_score,
    -- Check if shield is applied for this week
    EXISTS (
        SELECT 1 FROM momentum_credits mc 
        WHERE mc.user_id = da.user_id 
        AND mc.cycle_id = da.cycle_id 
        AND mc.week_number = EXTRACT(WEEK FROM da.action_date) - EXTRACT(WEEK FROM c.start_date) + 1
        AND mc.revoked = false
    ) AS is_shielded,
    -- Final score: if shielded, maintain previous week's score
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM momentum_credits mc 
            WHERE mc.user_id = da.user_id 
            AND mc.cycle_id = da.cycle_id 
            AND mc.week_number = EXTRACT(WEEK FROM da.action_date) - EXTRACT(WEEK FROM c.start_date) + 1
            AND mc.revoked = false
        ) THEN NULL -- Will be filled by LAG in application layer
        ELSE ROUND(
            (COUNT(*) FILTER (WHERE da.is_completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
            2
        )
    END AS display_score
FROM daily_actions da
JOIN cycles c ON da.cycle_id = c.id
GROUP BY da.user_id, da.cycle_id, week_number, week_start, c.start_date
ORDER BY da.user_id, da.cycle_id, week_number;

-- Unique index for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_weekly_scores_mv_unique 
ON weekly_scores_mv(user_id, cycle_id, week_number);

COMMENT ON MATERIALIZED VIEW weekly_scores_mv IS 'Pre-aggregated weekly scores for dashboard performance';


-- ===========================================
-- SECTION 5: FUNCTIONS & TRIGGERS
-- ===========================================

-- -----------------------------------------
-- Function: Generate daily actions for new cycle
-- Creates ~84 placeholder rows (12 weeks × 7 days)
-- -----------------------------------------
CREATE OR REPLACE FUNCTION generate_cycle_daily_actions()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate 84 days of placeholder actions (12 weeks)
    INSERT INTO daily_actions (user_id, cycle_id, title, action_date)
    SELECT 
        NEW.user_id,
        NEW.id,
        'Daily Focus Task',
        gs::DATE
    FROM generate_series(
        NEW.start_date, 
        NEW.end_date, 
        INTERVAL '1 day'
    ) AS gs;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-generate actions on cycle creation
CREATE TRIGGER trg_generate_cycle_actions
AFTER INSERT ON cycles
FOR EACH ROW
EXECUTE FUNCTION generate_cycle_daily_actions();

COMMENT ON FUNCTION generate_cycle_daily_actions IS 'Auto-generates 84 daily action rows for a new 12-week cycle';


-- -----------------------------------------
-- Function: Update search vector on action change
-- -----------------------------------------
CREATE OR REPLACE FUNCTION update_action_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.notes, '')
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update search vector
CREATE TRIGGER trg_update_action_search
BEFORE INSERT OR UPDATE OF title, notes ON daily_actions
FOR EACH ROW
EXECUTE FUNCTION update_action_search_vector();


-- -----------------------------------------
-- Function: Update weekly scores on action completion
-- -----------------------------------------
CREATE OR REPLACE FUNCTION update_weekly_scores()
RETURNS TRIGGER AS $$
DECLARE
    v_week_number INTEGER;
    v_week_start DATE;
    v_cycle_start DATE;
    v_is_shielded BOOLEAN;
BEGIN
    -- Get cycle start date
    SELECT start_date INTO v_cycle_start
    FROM cycles WHERE id = NEW.cycle_id;
    
    -- Calculate week number (1-12)
    v_week_number := EXTRACT(DAY FROM NEW.action_date - v_cycle_start)::INTEGER / 7 + 1;
    v_week_start := DATE_TRUNC('week', NEW.action_date)::DATE;
    
    -- Check if this week is shielded
    SELECT EXISTS (
        SELECT 1 FROM momentum_credits 
        WHERE user_id = NEW.user_id 
        AND cycle_id = NEW.cycle_id 
        AND week_number = v_week_number
        AND revoked = false
    ) INTO v_is_shielded;
    
    -- Upsert weekly score
    INSERT INTO weekly_scores (
        user_id, cycle_id, week_number, week_start, 
        score, tasks_completed, tasks_total, is_shielded
    )
    SELECT 
        NEW.user_id,
        NEW.cycle_id,
        v_week_number,
        v_week_start,
        ROUND((COUNT(*) FILTER (WHERE is_completed)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2),
        COUNT(*) FILTER (WHERE is_completed),
        COUNT(*),
        v_is_shielded
    FROM daily_actions
    WHERE user_id = NEW.user_id 
    AND cycle_id = NEW.cycle_id
    AND action_date >= v_week_start
    AND action_date < v_week_start + INTERVAL '7 days'
    ON CONFLICT (user_id, cycle_id, week_number) 
    DO UPDATE SET
        score = EXCLUDED.score,
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_total = EXCLUDED.tasks_total,
        is_shielded = EXCLUDED.is_shielded,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update weekly scores on action change
CREATE TRIGGER trg_update_weekly_scores
AFTER INSERT OR UPDATE OF is_completed ON daily_actions
FOR EACH ROW
EXECUTE FUNCTION update_weekly_scores();


-- -----------------------------------------
-- Function: Update user streaks
-- -----------------------------------------
CREATE OR REPLACE FUNCTION update_user_streaks()
RETURNS TRIGGER AS $$
DECLARE
    v_win_streak INTEGER := 0;
    v_lose_streak INTEGER := 0;
    v_prev_score NUMERIC;
    v_score_record RECORD;
BEGIN
    -- Calculate streaks from recent weekly scores
    FOR v_score_record IN 
        SELECT score FROM weekly_scores 
        WHERE user_id = NEW.user_id 
        ORDER BY week_start DESC 
        LIMIT 12
    LOOP
        IF v_score_record.score >= 85 THEN
            IF v_lose_streak = 0 THEN 
                v_win_streak := v_win_streak + 1;
            ELSE 
                EXIT;
            END IF;
        ELSIF v_score_record.score < 50 THEN
            IF v_win_streak = 0 THEN 
                v_lose_streak := v_lose_streak + 1;
            ELSE 
                EXIT;
            END IF;
        ELSE
            EXIT; -- Neutral score breaks streak
        END IF;
    END LOOP;
    
    -- Update profile streaks
    UPDATE profiles
    SET 
        winning_streak = v_win_streak,
        losing_streak = v_lose_streak,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update streaks on weekly score change
CREATE TRIGGER trg_update_streaks
AFTER INSERT OR UPDATE ON weekly_scores
FOR EACH ROW
EXECUTE FUNCTION update_user_streaks();


-- -----------------------------------------
-- Function: Refresh materialized view (for scheduled jobs)
-- -----------------------------------------
CREATE OR REPLACE FUNCTION refresh_weekly_scores_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_scores_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_weekly_scores_mv IS 'Refreshes the weekly_scores_mv materialized view concurrently';


-- -----------------------------------------
-- Function: Close cycle and calculate final score
-- -----------------------------------------
CREATE OR REPLACE FUNCTION close_cycle(p_cycle_id UUID)
RETURNS void AS $$
DECLARE
    v_final_score NUMERIC;
BEGIN
    -- Calculate final score (average of non-shielded weeks)
    SELECT AVG(score) INTO v_final_score
    FROM weekly_scores
    WHERE cycle_id = p_cycle_id AND is_shielded = false;
    
    -- Update cycle status
    UPDATE cycles
    SET 
        cycle_status = 'closed',
        final_score = v_final_score,
        closed_at = NOW()
    WHERE id = p_cycle_id;
    
    -- Notify for analytics
    PERFORM pg_notify('cycle_closed', p_cycle_id::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===========================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE momentum_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- Profiles Policies
-- -----------------------------------------
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- -----------------------------------------
-- Cycles Policies
-- -----------------------------------------
CREATE POLICY "Users can view own cycles"
ON cycles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles"
ON cycles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles"
ON cycles FOR UPDATE
USING (auth.uid() = user_id);

-- -----------------------------------------
-- Goals Policies
-- -----------------------------------------
CREATE POLICY "Users can view own goals"
ON goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
ON goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON goals FOR DELETE
USING (auth.uid() = user_id);

-- -----------------------------------------
-- Tactics Policies
-- -----------------------------------------
CREATE POLICY "Users can view own tactics"
ON tactics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tactics"
ON tactics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tactics"
ON tactics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tactics"
ON tactics FOR DELETE
USING (auth.uid() = user_id);

-- -----------------------------------------
-- Daily Actions Policies
-- -----------------------------------------
CREATE POLICY "Users can view own actions"
ON daily_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
ON daily_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
ON daily_actions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions"
ON daily_actions FOR DELETE
USING (auth.uid() = user_id);

-- -----------------------------------------
-- Momentum Credits Policies (IMMUTABLE)
-- Users can only INSERT, not UPDATE or DELETE
-- -----------------------------------------
CREATE POLICY "Users can view own credits"
ON momentum_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
ON momentum_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- NO UPDATE or DELETE policies for users (immutable)
-- Only service_role can modify (for abuse prevention)

-- -----------------------------------------
-- Weekly Scores Policies
-- -----------------------------------------
CREATE POLICY "Users can view own scores"
ON weekly_scores FOR SELECT
USING (auth.uid() = user_id);

-- Scores are system-generated, no direct insert/update by users


-- ===========================================
-- SECTION 7: HELPER FUNCTIONS
-- ===========================================

-- Get current week number for a cycle
CREATE OR REPLACE FUNCTION get_current_week(p_cycle_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_start_date DATE;
    v_week INTEGER;
BEGIN
    SELECT start_date INTO v_start_date
    FROM cycles WHERE id = p_cycle_id;
    
    v_week := CEIL(EXTRACT(DAY FROM CURRENT_DATE - v_start_date)::NUMERIC / 7);
    RETURN GREATEST(1, LEAST(12, v_week));
END;
$$ LANGUAGE plpgsql STABLE;

-- Get remaining days in cycle
CREATE OR REPLACE FUNCTION get_remaining_days(p_cycle_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_end_date DATE;
BEGIN
    SELECT end_date INTO v_end_date
    FROM cycles WHERE id = p_cycle_id;
    
    RETURN GREATEST(0, v_end_date - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate daily score (Monk Mode: out of 3)
CREATE OR REPLACE FUNCTION calculate_daily_score(p_user_id UUID, p_date DATE)
RETURNS NUMERIC AS $$
DECLARE
    v_completed INTEGER;
    v_total INTEGER := 3; -- Monk Mode constant
BEGIN
    SELECT COUNT(*) FILTER (WHERE is_completed)
    INTO v_completed
    FROM daily_actions
    WHERE user_id = p_user_id AND action_date = p_date;
    
    RETURN ROUND((v_completed::NUMERIC / v_total) * 100, 2);
END;
$$ LANGUAGE plpgsql STABLE;


-- ===========================================
-- SECTION 8: INITIAL DATA (Optional)
-- ===========================================

-- Create profile on user signup (via trigger on auth.users)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();


-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

COMMENT ON SCHEMA public IS 'AETERNA 2026 - High-performance 12-week execution database';
