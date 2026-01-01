# AETERNA 2026 — Supabase Final Schema

> **Version**: 1.1 (Senior Architect Validated)  
> **Last Updated**: January 1, 2026  
> **Status**: Production Ready

---

## Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AETERNA 2026 DATABASE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  auth.users ─┐                                                      │
│              │                                                      │
│              ▼                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   profiles   │───▶│    cycles    │───▶│    goals     │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         │                   │                   ▼                   │
│         │                   │            ┌──────────────┐          │
│         │                   │            │   tactics    │◀─ VERSION│
│         │                   │            └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ momentum_    │    │daily_actions │    │weekly_scores │          │
│  │ credits      │    │(AUTO-GEN 84) │    │     _mv      │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tables

### 1. `profiles`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | - | References `auth.users(id)` |
| `full_name` | TEXT | - | User's display name |
| `avatar_url` | TEXT | NULL | Profile image URL |
| `vision_statement` | TEXT | NULL | 10-year legacy vision |
| `shield_credits` | INTEGER | 3 | Remaining credits (0-3) |
| `timezone` | TEXT | 'UTC' | User timezone |
| `nudge_enabled` | BOOLEAN | TRUE | WhatsApp/Push notifications |
| `winning_streak` | INTEGER | 0 | Consecutive winning days |
| `losing_streak` | INTEGER | 0 | Consecutive losing days |
| `created_at` | TIMESTAMPTZ | NOW() | - |
| `updated_at` | TIMESTAMPTZ | NOW() | - |

---

### 2. `cycles`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | gen_random_uuid() | - |
| `user_id` | UUID (FK) | - | References `profiles(id)` |
| `name` | TEXT | 'Q1 2026' | Cycle display name |
| `start_date` | DATE | - | **REQUIRED**: Triggers auto-generation |
| `end_date` | DATE | - | Must be start_date + 83 days |
| `cycle_status` | ENUM | 'active' | 'active' \| 'closed' |
| `final_score` | NUMERIC(5,2) | NULL | Set on cycle close |
| `created_at` | TIMESTAMPTZ | NOW() | - |
| `closed_at` | TIMESTAMPTZ | NULL | Set when status → 'closed' |

> ⚠️ **TRIGGER**: On INSERT, `generate_daily_actions()` creates 84 rows in `daily_actions`

> ⚠️ **CONSTRAINT**: Only ONE active cycle per user (partial unique index)

---

### 3. `goals`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | gen_random_uuid() | - |
| `cycle_id` | UUID (FK) | - | References `cycles(id)` |
| `user_id` | UUID (FK) | - | References `profiles(id)` |
| `title` | TEXT | - | Goal title |
| `description` | TEXT | NULL | Goal details |
| `target_metric` | TEXT | NULL | KPI name |
| `target_value` | NUMERIC | NULL | Target number |
| `current_value` | NUMERIC | 0 | Current progress |
| `priority` | INTEGER | 1 | 1 (highest) to 3 (lowest) |

---

### 4. `tactics` (WITH VERSIONING)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | gen_random_uuid() | - |
| `goal_id` | UUID (FK) | - | References `goals(id)` |
| `user_id` | UUID (FK) | - | References `profiles(id)` |
| `title` | TEXT | - | Tactic title |
| `description` | TEXT | NULL | Details |
| `weight` | INTEGER | 1 | Impact weight (1-10) |
| `is_active` | BOOLEAN | TRUE | Current version flag |
| `version` | INTEGER | 1 | Version number |
| `previous_version_id` | UUID | NULL | Link to previous version |
| `created_at` | TIMESTAMPTZ | NOW() | - |
| `updated_at` | TIMESTAMPTZ | NOW() | - |

> ⚠️ **VERSIONING LOGIC**: When updating a tactic, the `version_tactic()` trigger:
> 1. Sets `is_active = FALSE` on current record
> 2. Creates NEW record with incremented `version`
> 3. Links new record to old via `previous_version_id`
> 
> **Frontend Impact**: After UPDATE, fetch the NEW tactic ID from response

---

### 5. `daily_actions`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | gen_random_uuid() | - |
| `tactic_id` | UUID (FK) | NULL | References `tactics(id)` |
| `user_id` | UUID (FK) | - | References `profiles(id)` |
| `cycle_id` | UUID (FK) | - | References `cycles(id)` |
| `title` | TEXT | - | Action title |
| `action_date` | DATE | - | Scheduled date |
| `is_completed` | BOOLEAN | FALSE | Completion status |
| `completed_at` | TIMESTAMPTZ | NULL | When marked done |
| `energy_level` | INTEGER | NULL | 1-5 energy scale |
| `notes` | TEXT | NULL | User notes |
| `search_vector` | TSVECTOR | - | AI semantic search |

> ⚠️ **AUTO-GENERATED**: 84 rows created when parent `cycle` is inserted

> ⚠️ **TRIGGER**: On UPDATE of `is_completed`, triggers `update_weekly_scores()`

---

### 6. `momentum_credits` (IMMUTABLE)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | gen_random_uuid() | - |
| `user_id` | UUID (FK) | - | References `profiles(id)` |
| `cycle_id` | UUID (FK) | - | References `cycles(id)` |
| `week_number` | INTEGER | - | Week 1-12 |
| `applied_at` | TIMESTAMPTZ | NOW() | When activated |
| `reason` | TEXT | - | User explanation |
| `biometrics_verified` | BOOLEAN | FALSE | Health data verified |
| `ai_detected` | BOOLEAN | FALSE | AI suggested shield |
| `revoked` | BOOLEAN | FALSE | **Only service_role can set** |
| `revoked_at` | TIMESTAMPTZ | NULL | When revoked |
| `revoked_by` | UUID | NULL | Admin who revoked |

> ⚠️ **IMMUTABLE**: Users can INSERT only. No UPDATE or DELETE allowed.

> ⚠️ **CONSTRAINT**: One shield per week per user per cycle

---

### 7. `weekly_scores`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | gen_random_uuid() | - |
| `user_id` | UUID (FK) | - | References `profiles(id)` |
| `cycle_id` | UUID (FK) | - | References `cycles(id)` |
| `week_number` | INTEGER | - | Week 1-12 |
| `week_start` | DATE | - | Monday of week |
| `score` | NUMERIC(5,2) | 0 | Calculated score |
| `tasks_completed` | INTEGER | 0 | Count completed |
| `tasks_total` | INTEGER | 0 | Count total |
| `is_shielded` | BOOLEAN | FALSE | Shield applied |

> ⚠️ **AUTO-UPDATED**: Recalculated on every `daily_actions` completion

---

## Materialized View: `weekly_scores_mv`

Pre-aggregated weekly scores for dashboard performance.

```sql
SELECT 
    user_id,
    cycle_id,
    week_number,
    week_start,
    tasks_completed,
    tasks_total,
    raw_score,
    is_shielded,
    display_score  -- NULL if shielded (use previous week)
FROM weekly_scores_mv
WHERE user_id = $1 AND cycle_id = $2;
```

> ⚠️ **REFRESH**: Call `refresh_weekly_scores_mv()` after batch updates

---

## Tactic Versioning Logic

### Why Versioning?

When a user updates a tactic mid-cycle, we need to:
1. Preserve historical data for analytics
2. Maintain referential integrity with existing `daily_actions`
3. Track evolution of strategy over time

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│  BEFORE UPDATE                                                      │
│  ────────────────────────────────────────────────────────────────   │
│  Tactic A (v1) ──────────────────┐                                  │
│  is_active: TRUE                 │ linked to                        │
│  version: 1                      ▼                                  │
│                           daily_actions (week 1-3)                  │
└─────────────────────────────────────────────────────────────────────┘

                              ▼ USER UPDATES ▼

┌─────────────────────────────────────────────────────────────────────┐
│  AFTER UPDATE                                                       │
│  ────────────────────────────────────────────────────────────────   │
│  Tactic A (v1)          Tactic A' (v2) ◀── NEW ID                   │
│  is_active: FALSE       is_active: TRUE                             │
│  version: 1             version: 2                                  │
│       │                 previous_version_id: [v1.id]                │
│       ▼                       │                                     │
│  daily_actions          NEW daily_actions                           │
│  (week 1-3)             (week 4-12)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Frontend Handling

```typescript
// ⚠️ IMPORTANT: Tactic UPDATE returns a NEW record
const updateTactic = async (tacticId: string, data: TacticUpdate) => {
  const { data: newTactic, error } = await supabase
    .from('tactics')
    .update(data)
    .eq('id', tacticId)
    .select()
    .single();

  // The returned `newTactic` has a DIFFERENT ID than `tacticId`
  // The original record is now is_active: FALSE
  
  return newTactic; // Use this new ID going forward
};
```

---

## Database Triggers Summary

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `trg_generate_cycle_actions` | cycles | INSERT | Creates 84 daily_actions |
| `trg_update_action_search` | daily_actions | INSERT/UPDATE | Updates search_vector |
| `trg_update_weekly_scores` | daily_actions | UPDATE (is_completed) | Recalculates week score |
| `trg_update_streaks` | weekly_scores | INSERT/UPDATE | Updates user streaks |
| `trg_version_tactic` | tactics | UPDATE | Creates new version |
| `on_auth_user_created` | auth.users | INSERT | Creates profile |

---

## Indexes

| Index | Table | Type | Columns |
|-------|-------|------|---------|
| `idx_daily_actions_user_cycle_date` | daily_actions | B-tree | (user_id, cycle_id, action_date DESC) |
| `idx_daily_actions_brin` | daily_actions | BRIN | (action_date) |
| `idx_daily_actions_search` | daily_actions | GIN | (search_vector) |
| `idx_cycles_user_status` | cycles | B-tree | (user_id, cycle_status) |
| `idx_momentum_credits_user_cycle` | momentum_credits | B-tree | (user_id, cycle_id) WHERE revoked = FALSE |
| `idx_weekly_scores_mv_unique` | weekly_scores_mv | B-tree | (user_id, cycle_id, week_number) |

---

## RLS Policies Summary

All tables have Row Level Security enabled. Users can only access their own data.

**Special Case: `momentum_credits`**
- SELECT: Yes
- INSERT: Yes
- UPDATE: **NO** (immutable)
- DELETE: **NO** (immutable)

Only `service_role` can revoke shields for abuse prevention.

---

*This document reflects the production Supabase schema as of January 1, 2026.*
