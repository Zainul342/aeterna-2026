# AETERNA 2026 — System Flow & Core Logic

> **Version**: 1.0  
> **Last Updated**: December 31, 2024  
> **Scope**: Execution Engine Architecture

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AETERNA 2026 EXECUTION LOOP                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   SUNDAY          MONDAY-SATURDAY         FRIDAY           SUNDAY   │
│   ┌─────┐         ┌───────────┐          ┌──────┐         ┌─────┐  │
│   │PLAN │ ──────► │  EXECUTE  │ ───────► │SCORE │ ──────► │PLAN │  │
│   └─────┘         └───────────┘          └──────┘         └─────┘  │
│      │                  │                    │                │     │
│      ▼                  ▼                    ▼                ▼     │
│   AI Suggest       Monk Mode            Weekly Eval      Next Cycle │
│   3 Tasks          MAX 3 Active         85% Rule         AI Adjust  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Sunday Planning (The Lever Optimizer)

### Core Logic

The AI analyzes the user's 12-week goals and auto-suggests exactly **3 tasks** for the upcoming week. This prevents "Planning Overload" and eliminates decision fatigue.

### AI Task Suggestion Algorithm

```javascript
/**
 * Generate 3 high-leverage tasks for the week
 * @param {Object} user - User profile with goals and history
 * @returns {Array<Task>} Exactly 3 suggested tasks
 */
async function generateWeeklyTasks(user) {
  const context = {
    twelveWeekGoals: user.goals.filter(g => g.cycleId === user.activeCycleId),
    completedTasks: user.tasks.filter(t => t.status === 'completed').slice(-21), // Last 3 weeks
    executionScore: user.metrics.weeklyAverage,
    currentWeek: user.activeCycle.currentWeek,
    remainingWeeks: 12 - user.activeCycle.currentWeek
  };

  const prompt = buildLeverOptimizerPrompt(context);
  
  const suggestions = await gemini.generateContent({
    model: 'gemini-1.5-flash',
    prompt,
    responseSchema: {
      type: 'array',
      items: { type: 'object', properties: { title: 'string', reason: 'string', impact: 'number' }},
      maxItems: 3,
      minItems: 3
    }
  });

  return suggestions.map(s => ({
    ...s,
    status: 'suggested',
    suggestedAt: new Date()
  }));
}
```

### Interaction Flow: 15-Second Approve/Swap

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUNDAY PLANNING MODAL (Auto-opens 6:00 PM)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  "Here are your 3 leveraged tasks for Week 7:"                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 1. [✓] Complete sales deck for Acme Corp                     │   │
│  │       Impact: Closes $15k deal (Goal: Revenue)               │   │
│  │       [Approve] [Swap ↻]                                     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ 2. [✓] Record 2 YouTube videos                               │   │
│  │       Impact: Content pipeline for Jan (Goal: Audience)      │   │
│  │       [Approve] [Swap ↻]                                     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ 3. [✓] Finalize contractor agreement                         │   │
│  │       Impact: Unblocks team scaling (Goal: Operations)       │   │
│  │       [Approve] [Swap ↻]                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Lock In Week →]                     Timer: 00:15 remaining        │
│                                                                     │
│  After 15s, suggestions auto-approved if no action.                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Swap Logic

When user clicks "Swap", AI generates 1 alternative task from the same goal category:

```javascript
async function swapTask(taskIndex, user) {
  const originalTask = user.suggestedTasks[taskIndex];
  const alternative = await gemini.generateContent({
    prompt: `Generate 1 alternative task for goal: ${originalTask.goalId}. 
             Must NOT be: ${originalTask.title}`,
    responseSchema: { type: 'object', properties: { title: 'string', reason: 'string' }}
  });
  
  return alternative;
}
```

### Monday Handoff: Context Amnesia Prevention

```
┌─────────────────────────────────────────────────────────────────────┐
│  AUTOMATED NUDGE — Monday 07:45 AM                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Channel: WhatsApp / Push Notification                              │
│                                                                     │
│  Message Template:                                                  │
│  ─────────────────                                                  │
│  🎯 Week 7 of 12 — Your 3 Tasks:                                    │
│                                                                     │
│  1. Complete sales deck for Acme Corp                               │
│  2. Record 2 YouTube videos                                         │
│  3. Finalize contractor agreement                                   │
│                                                                     │
│  Current Score: 87% | Streak: 12 days 🔥                            │
│                                                                     │
│  [Open AETERNA →]                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Notification Scheduler

```javascript
// Supabase Edge Function: scheduled-nudge
export async function scheduledNudge() {
  const localTime = new Date().toLocaleString('en-US', { timeZone: user.timezone });
  const hour = new Date(localTime).getHours();
  const minute = new Date(localTime).getMinutes();
  const dayOfWeek = new Date(localTime).getDay();

  // Monday (1) at 07:45
  if (dayOfWeek === 1 && hour === 7 && minute === 45) {
    const users = await supabase.from('users').select('*').eq('nudge_enabled', true);
    
    for (const user of users.data) {
      await sendWhatsAppMessage(user.phone, buildNudgeMessage(user));
      await sendPushNotification(user.id, buildNudgeMessage(user));
    }
  }
}
```

---

## Phase 2: Daily Execution (Monk Mode)

### Core Constraint

> **Maximum 3 tasks visible in the main dashboard at any time.**

This is a **hard constraint** enforced at the UI and API level. The system will not allow more than 3 active tasks.

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  VELOCITY DASHBOARD — Week 7, Day 3                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               84 DAYS REMAINING                             │    │
│  │          ████████████░░░░░░░░░░  58%                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  TODAY'S EXECUTION                           SCORE: 67% (2/3)       │
│  ─────────────────────────────────────────────────────────────      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ✅ Complete sales deck for Acme Corp          [DONE 09:32]   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ✅ Record 2 YouTube videos                    [DONE 14:15]   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ⬜ Finalize contractor agreement              [TAP TO DONE]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🎤 "Done" — Voice command active                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Input Methods

| Method | Latency Target | Implementation |
|--------|----------------|----------------|
| **One-Tap** | < 200ms | Optimistic UI update + background sync |
| **Voice "Done"** | < 3s | Web Speech API → Task matching → Confirm |
| **WhatsApp Reply** | < 5s | Webhook → Parse → Update DB |

### Voice Command Flow

```javascript
// Voice command handler
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript.toLowerCase();
  
  if (transcript.includes('done') || transcript.includes('selesai')) {
    // Find the first incomplete task
    const incompleteTask = tasks.find(t => t.status === 'pending');
    
    if (incompleteTask) {
      // Optimistic update
      setTasks(prev => prev.map(t => 
        t.id === incompleteTask.id ? { ...t, status: 'completed' } : t
      ));
      
      // Background sync
      await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date() })
        .eq('id', incompleteTask.id);
      
      // Haptic feedback (mobile)
      navigator.vibrate?.(50);
    }
  }
};
```

### Scoring Formula

```javascript
/**
 * Calculate daily execution score
 * Constraint: Always based on 3 tasks (Monk Mode)
 */
function calculateDailyScore(completedCount) {
  const MONK_MODE_MAX = 3;
  return Math.round((completedCount / MONK_MODE_MAX) * 100);
}

/**
 * Calculate weekly execution score
 * Average of daily scores (Mon-Sun)
 */
function calculateWeeklyScore(dailyScores) {
  if (dailyScores.length === 0) return 0;
  const sum = dailyScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / dailyScores.length);
}

// Example:
// Mon: 3/3 = 100%, Tue: 2/3 = 67%, Wed: 3/3 = 100%
// Weekly so far: (100 + 67 + 100) / 3 = 89%
```

---

## Phase 3: Momentum Credit (The Shield Logic)

### Overview

Users receive **3 Shield Credits per quarter** to protect their score during legitimate life events (illness, family emergency, unexpected travel).

### Shield Activation Conditions

```javascript
/**
 * Determine if user can activate a shield
 * @returns {Object} { canActivate: boolean, reason: string }
 */
async function canActivateShield(userId) {
  const user = await getUser(userId);
  const quarter = getCurrentQuarter();
  
  // Check credit balance
  const usedCredits = await supabase
    .from('shield_activations')
    .select('*')
    .eq('user_id', userId)
    .eq('quarter', quarter);
  
  if (usedCredits.data.length >= 3) {
    return { canActivate: false, reason: 'No credits remaining this quarter' };
  }
  
  // Abuse prevention: Check baseline
  const isChronicLowEffort = await detectChronicLowEffort(userId);
  if (isChronicLowEffort) {
    return { canActivate: false, reason: 'Pattern indicates chronic low effort' };
  }
  
  return { canActivate: true, reason: null };
}
```

### Abuse Prevention Algorithm

```javascript
/**
 * Detect chronic low effort patterns
 * Compares current period against 3-month baseline
 */
async function detectChronicLowEffort(userId) {
  // Get last 12 weeks of scores
  const history = await supabase
    .from('weekly_scores')
    .select('score')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(12);
  
  const scores = history.data.map(h => h.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const recentAverage = scores.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  
  // If recent 4 weeks are significantly below baseline, flag as chronic
  if (recentAverage < average * 0.6 && average < 60) {
    return true; // Chronic low effort detected
  }
  
  return false;
}
```

### AI Life Event Detection

```javascript
/**
 * AI-powered pattern anomaly detection
 * Triggers shield suggestion when genuine life event detected
 */
async function detectLifeEvent(userId) {
  const recentActivity = await getUserActivity(userId, { days: 7 });
  
  const prompt = `
    Analyze this user's activity pattern:
    - Usual daily completions: ${recentActivity.baseline}
    - This week's completions: ${recentActivity.current}
    - Score trend: ${recentActivity.trend}
    - Login frequency: ${recentActivity.logins}
    
    Is this likely a genuine life event (illness, emergency, travel) 
    or chronic disengagement?
    
    Respond with JSON: { "isLifeEvent": boolean, "confidence": 0-100, "reason": string }
  `;
  
  const analysis = await gemini.generateContent({ prompt });
  return JSON.parse(analysis);
}
```

### Shield Activation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  SHIELD ACTIVATION MODAL                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🛡️ Activate Shield Credit?                                         │
│                                                                     │
│  Your score is at 42% this week. We detected unusual patterns       │
│  that suggest a life event may be affecting your execution.         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Shield Credits Remaining: 2 of 3                            │   │
│  │  Quarter: Q1 2025                                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  If activated:                                                      │
│  • This week's score will be marked as "Shielded"                   │
│  • Your quarterly trajectory remains "Active"                       │
│  • AI Coach will send recovery-focused guidance                     │
│                                                                     │
│  [Cancel]                        [Activate Shield 🛡️]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Shield Database Schema

```sql
-- Shield activations table
CREATE TABLE shield_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_id UUID REFERENCES weeks(id),
  quarter VARCHAR(7) NOT NULL, -- e.g., '2025-Q1'
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  ai_detected BOOLEAN DEFAULT false,
  
  -- Prevent duplicate shields per week
  CONSTRAINT unique_shield_per_week UNIQUE (user_id, week_id)
);

-- Index for credit checking
CREATE INDEX idx_shield_user_quarter ON shield_activations(user_id, quarter);
```

---

## Phase 4: Momentum UI (Adaptive States)

### State Machine

```
                          ┌─────────────────┐
                          │     NEUTRAL     │
                          │   (Default UI)  │
                          └────────┬────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
              ▼                                         ▼
    ┌─────────────────┐                      ┌─────────────────┐
    │  FLOW VELOCITY  │                      │ RESET SANCTUARY │
    │  (7+ day streak)│                      │ (3+ day losing) │
    └─────────────────┘                      └─────────────────┘
              │                                         │
              │        Score recovers                   │
              └──────────────► ◄────────────────────────┘
                          │
                          ▼
                   ┌─────────────────┐
                   │     NEUTRAL     │
                   └─────────────────┘
```

### State Definitions

```typescript
type MomentumState = 'NEUTRAL' | 'FLOW_VELOCITY' | 'RESET_SANCTUARY';

interface StateConfig {
  state: MomentumState;
  theme: {
    primary: string;
    background: string;
    accent: string;
  };
  animation: {
    transitionSpeed: number; // multiplier
    effects: string[];
  };
  voiceTone: 'neutral' | 'celebratory' | 'calming';
  maxVisibleTasks: number;
}

const STATE_CONFIGS: Record<MomentumState, StateConfig> = {
  NEUTRAL: {
    state: 'NEUTRAL',
    theme: {
      primary: '#FAFAFA',
      background: '#0A0A0A',
      accent: '#CCFF00'
    },
    animation: {
      transitionSpeed: 1.0,
      effects: []
    },
    voiceTone: 'neutral',
    maxVisibleTasks: 3
  },
  
  FLOW_VELOCITY: {
    state: 'FLOW_VELOCITY',
    theme: {
      primary: '#FAFAFA',
      background: '#0A0A0A',
      accent: '#CCFF00' // Golden Glow
    },
    animation: {
      transitionSpeed: 0.8, // 20% faster
      effects: ['confetti-on-complete', 'turbo-scroll-2x', 'glow-pulse']
    },
    voiceTone: 'celebratory',
    maxVisibleTasks: 3
  },
  
  RESET_SANCTUARY: {
    state: 'RESET_SANCTUARY',
    theme: {
      primary: '#94A3B8',
      background: '#1E293B', // Calming Slate
      accent: '#3B82F6'
    },
    animation: {
      transitionSpeed: 1.5, // Slower, gentler
      effects: ['breathing-pulse', 'gentle-fade']
    },
    voiceTone: 'calming',
    maxVisibleTasks: 1 // Only anchor task
  }
};
```

### State Transition Logic

```javascript
/**
 * Calculate current momentum state based on streak
 */
function calculateMomentumState(user) {
  const { winningStreak, losingStreak } = user.streaks;
  
  if (winningStreak >= 7) {
    return 'FLOW_VELOCITY';
  }
  
  if (losingStreak >= 3) {
    return 'RESET_SANCTUARY';
  }
  
  return 'NEUTRAL';
}

/**
 * Streak calculation
 * Winning: Consecutive days with score >= 85%
 * Losing: Consecutive days with score < 50%
 */
async function calculateStreaks(userId) {
  const dailyScores = await supabase
    .from('daily_scores')
    .select('score, date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);
  
  let winningStreak = 0;
  let losingStreak = 0;
  
  for (const day of dailyScores.data) {
    if (day.score >= 85) {
      if (losingStreak === 0) winningStreak++;
      else break;
    } else if (day.score < 50) {
      if (winningStreak === 0) losingStreak++;
      else break;
    } else {
      break; // Neutral day breaks both streaks
    }
  }
  
  return { winningStreak, losingStreak };
}
```

### Flow Velocity UI (7+ Day Winning Streak)

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔥 FLOW VELOCITY MODE — 12 Day Streak                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Background: #0A0A0A with subtle golden particle animation          │
│  Accent: #CCFF00 (Cyber Lime) with glow effect                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ✨ Complete sales deck              [TAP] → 🎉 CONFETTI       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Animations:                                                        │
│  • 20% faster transitions (0.8x duration)                           │
│  • Confetti burst on task completion                                │
│  • 2x turbo-scroll enabled                                          │
│  • Subtle glow pulse on score display                               │
│                                                                     │
│  AI Voice: High-energy, celebratory                                 │
│  "You're in the zone! 12 days of elite execution."                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Reset Sanctuary UI (3+ Day Losing Streak)

```
┌─────────────────────────────────────────────────────────────────────┐
│  🧘 RESET SANCTUARY — Recovery Mode                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Background: #1E293B (Calming Slate)                                │
│  Accent: #3B82F6 (Soft Blue)                                        │
│                                                                     │
│  Complexity Hidden. Only 1 Anchor Task Visible:                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │   YOUR ANCHOR TASK                                           │   │
│  │   ─────────────────                                          │   │
│  │   Complete sales deck for Acme Corp                          │   │
│  │                                                              │   │
│  │   Just this one. Nothing else matters today.                 │   │
│  │                                                              │   │
│  │   [Mark Complete]                                            │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Animations:                                                        │
│  • Slow, gentle fades (1.5x duration)                               │
│  • Subtle breathing pulse effect                                    │
│  • Reduced visual complexity                                        │
│                                                                     │
│  AI Voice: Calm, supportive                                         │
│  "One step. That's all we need today."                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### CSS Custom Properties for States

```css
/* State-driven CSS variables */
:root {
  /* Default: Neutral */
  --bg-primary: #0A0A0A;
  --text-primary: #FAFAFA;
  --accent: #CCFF00;
  --transition-speed: 300ms;
}

[data-momentum-state="FLOW_VELOCITY"] {
  --accent: #CCFF00;
  --transition-speed: 240ms; /* 20% faster */
  --glow-intensity: 1;
}

[data-momentum-state="RESET_SANCTUARY"] {
  --bg-primary: #1E293B;
  --text-primary: #94A3B8;
  --accent: #3B82F6;
  --transition-speed: 450ms; /* 50% slower */
  --glow-intensity: 0;
}
```

---

## Phase 5: 13th Week Snapshot (Database Performance)

### Strategy: Zero Data Movement

> **Never move data.** Use status flags for cycle transitions.

### Cycle Status ENUM

```sql
-- Add cycle status enum
CREATE TYPE cycle_status AS ENUM ('active', 'closed');

-- Cycles table with status
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status cycle_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- Ensure only one active cycle per user
  CONSTRAINT one_active_cycle UNIQUE (user_id, status) 
    WHERE status = 'active'
);
```

### Composite Index for Performance

```sql
-- Composite index for ultra-fast historical queries
CREATE INDEX CONCURRENTLY idx_cycles_user_status 
ON cycles(user_id, status);

-- Query plan should show "Index Scan" with <10ms execution
EXPLAIN ANALYZE
SELECT * FROM cycles 
WHERE user_id = 'uuid' AND status = 'active';
```

### 13th Week Transition Procedure

```sql
-- Stored procedure for cycle closure
CREATE OR REPLACE FUNCTION close_cycle(cycle_id UUID)
RETURNS void AS $$
BEGIN
  -- Update cycle status
  UPDATE cycles 
  SET status = 'closed', closed_at = NOW()
  WHERE id = cycle_id;
  
  -- Calculate final metrics
  INSERT INTO cycle_summaries (cycle_id, final_score, total_tasks, completed_tasks)
  SELECT 
    cycle_id,
    AVG(score) as final_score,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
  FROM weekly_scores ws
  JOIN weeks w ON ws.week_id = w.id
  WHERE w.cycle_id = cycle_id;
  
  -- Trigger AI summary generation
  PERFORM pg_notify('cycle_closed', cycle_id::text);
END;
$$ LANGUAGE plpgsql;
```

---

## Database Triggers

### Trigger 1: Auto-Calculate Daily Score

```sql
CREATE OR REPLACE FUNCTION calculate_daily_score()
RETURNS TRIGGER AS $$
DECLARE
  completed_count INTEGER;
  daily_score INTEGER;
BEGIN
  -- Count completed tasks for today
  SELECT COUNT(*) INTO completed_count
  FROM tasks
  WHERE user_id = NEW.user_id
    AND DATE(completed_at) = CURRENT_DATE
    AND status = 'completed';
  
  -- Calculate score (Monk Mode: always out of 3)
  daily_score := ROUND((completed_count::FLOAT / 3) * 100);
  
  -- Upsert daily score
  INSERT INTO daily_scores (user_id, date, score, tasks_completed)
  VALUES (NEW.user_id, CURRENT_DATE, daily_score, completed_count)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET score = EXCLUDED.score, tasks_completed = EXCLUDED.tasks_completed;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_daily_score
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION calculate_daily_score();
```

### Trigger 2: Auto-Update Weekly Score

```sql
CREATE OR REPLACE FUNCTION update_weekly_score()
RETURNS TRIGGER AS $$
DECLARE
  week_start DATE;
  avg_score FLOAT;
BEGIN
  -- Get start of current week (Monday)
  week_start := DATE_TRUNC('week', NEW.date)::DATE;
  
  -- Calculate weekly average
  SELECT AVG(score) INTO avg_score
  FROM daily_scores
  WHERE user_id = NEW.user_id
    AND date >= week_start
    AND date < week_start + INTERVAL '7 days';
  
  -- Upsert weekly score
  INSERT INTO weekly_scores (user_id, week_start, score)
  VALUES (NEW.user_id, week_start, ROUND(avg_score))
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_weekly_score
AFTER INSERT OR UPDATE ON daily_scores
FOR EACH ROW
EXECUTE FUNCTION update_weekly_score();
```

### Trigger 3: Streak Calculation

```sql
CREATE OR REPLACE FUNCTION update_streaks()
RETURNS TRIGGER AS $$
DECLARE
  win_streak INTEGER := 0;
  lose_streak INTEGER := 0;
  prev_score INTEGER;
  score_row RECORD;
BEGIN
  -- Calculate streaks from recent daily scores
  FOR score_row IN 
    SELECT score FROM daily_scores 
    WHERE user_id = NEW.user_id 
    ORDER BY date DESC LIMIT 30
  LOOP
    IF score_row.score >= 85 THEN
      IF lose_streak = 0 THEN win_streak := win_streak + 1;
      ELSE EXIT;
      END IF;
    ELSIF score_row.score < 50 THEN
      IF win_streak = 0 THEN lose_streak := lose_streak + 1;
      ELSE EXIT;
      END IF;
    ELSE
      EXIT; -- Neutral score breaks streak
    END IF;
  END LOOP;
  
  -- Update user streaks
  UPDATE users
  SET winning_streak = win_streak, losing_streak = lose_streak
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_streaks
AFTER INSERT OR UPDATE ON daily_scores
FOR EACH ROW
EXECUTE FUNCTION update_streaks();
```

---

## State Management (React)

### Global State with Zustand

```typescript
// stores/momentum-store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

type MomentumState = 'NEUTRAL' | 'FLOW_VELOCITY' | 'RESET_SANCTUARY';

interface MomentumStore {
  state: MomentumState;
  winningStreak: number;
  losingStreak: number;
  dailyScore: number;
  weeklyScore: number;
  shieldCredits: number;
  
  // Actions
  completeTask: (taskId: string) => void;
  activateShield: () => void;
  refreshState: () => Promise<void>;
}

export const useMomentumStore = create<MomentumStore>()(
  subscribeWithSelector((set, get) => ({
    state: 'NEUTRAL',
    winningStreak: 0,
    losingStreak: 0,
    dailyScore: 0,
    weeklyScore: 0,
    shieldCredits: 3,
    
    completeTask: async (taskId) => {
      // Optimistic update
      set((state) => ({
        dailyScore: Math.min(100, state.dailyScore + 33)
      }));
      
      // Sync with backend
      await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date() })
        .eq('id', taskId);
      
      // Refresh state
      get().refreshState();
    },
    
    activateShield: async () => {
      const { shieldCredits } = get();
      if (shieldCredits <= 0) return;
      
      set({ shieldCredits: shieldCredits - 1 });
      
      await supabase
        .from('shield_activations')
        .insert({ user_id: userId, week_id: currentWeekId });
    },
    
    refreshState: async () => {
      const { data } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const newState = calculateMomentumState(data);
      
      set({
        state: newState,
        winningStreak: data.winning_streak,
        losingStreak: data.losing_streak,
        dailyScore: data.daily_score,
        weeklyScore: data.weekly_score
      });
    }
  }))
);
```

### State Transition Hook

```typescript
// hooks/use-momentum-transition.ts
import { useEffect } from 'react';
import { useMomentumStore } from '@/stores/momentum-store';

export function useMomentumTransition() {
  const state = useMomentumStore((s) => s.state);
  
  useEffect(() => {
    // Apply theme transition
    document.documentElement.setAttribute('data-momentum-state', state);
    
    // Announce state change (accessibility)
    if (state === 'FLOW_VELOCITY') {
      announceToScreenReader('Flow Velocity mode activated. You\'re on a winning streak!');
    } else if (state === 'RESET_SANCTUARY') {
      announceToScreenReader('Reset Sanctuary mode. Take it easy today.');
    }
  }, [state]);
  
  return state;
}
```

---

## Performance KPIs

### Zero-Friction Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Task Completion** | < 200ms | Time from tap to visual confirmation |
| **Voice Command** | < 3s | Time from utterance end to task marked |
| **Page Load (Dashboard)** | < 2s | Lighthouse FCP |
| **AI Response Start** | < 1s | Time to first streaming token |
| **WhatsApp Input** | < 5s | Webhook receive to DB update |

### API Route Performance

| Endpoint | Target Latency | Caching Strategy |
|----------|----------------|------------------|
| `GET /api/dashboard` | < 100ms | SWR with 30s stale-while-revalidate |
| `POST /api/tasks/complete` | < 50ms | Optimistic UI, background sync |
| `GET /api/scores/weekly` | < 50ms | Edge-cached, 5min TTL |
| `POST /api/ai/coach` | < 2s (streaming) | No cache, real-time generation |
| `GET /api/cycles/history` | < 10ms | Composite index on (user_id, status) |

### Monitoring Alerts

```javascript
// Datadog/Vercel Analytics thresholds
const PERFORMANCE_THRESHOLDS = {
  p50_latency: 100,  // 50th percentile: 100ms
  p95_latency: 500,  // 95th percentile: 500ms
  p99_latency: 1000, // 99th percentile: 1s
  error_rate: 0.01,  // 1% max error rate
};
```

---

## Summary

| Phase | Core Logic | Performance Target |
|-------|------------|-------------------|
| **Sunday Planning** | AI suggests 3 tasks, 15s approve flow | Modal load < 500ms |
| **Daily Execution** | Max 3 tasks, one-tap/voice complete | Input < 3s |
| **Momentum Credit** | 3 shields/quarter, abuse prevention | Shield activation < 200ms |
| **Adaptive UI** | Flow Velocity / Reset Sanctuary states | Transition < 300ms |
| **13th Week** | ENUM status, composite index | Query < 10ms |

---

*This document defines the system architecture for AETERNA 2026. All implementations must adhere to these specifications.*
