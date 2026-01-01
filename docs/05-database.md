# 05 — Database Schema

> **Status**: Complete  
> **Platform**: Supabase (PostgreSQL)

---

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User data, vision, shield credits |
| `cycles` | 12-week execution cycles |
| `goals` | High-level goals per cycle |
| `tactics` | Weekly tactics linked to goals |
| `daily_actions` | Daily tasks (Monk Mode max 3) |
| `momentum_credits` | Shield activations (immutable) |
| `weekly_scores` | Aggregated weekly scores |

---

## Key Constraints

### Profiles
- `shield_credits` DEFAULT 3, CHECK 0-3

### Cycles
- Only ONE active cycle per user (partial unique index)
- Exactly 84 days (12 weeks)

### Momentum Credits
- **IMMUTABLE**: Users can INSERT only, no UPDATE/DELETE
- One shield per week per user

---

## Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `idx_daily_actions_user_cycle_date` | Composite | Fast user queries |
| `idx_daily_actions_brin` | BRIN | Time-series optimization |
| `idx_daily_actions_search` | GIN | AI semantic search |
| `idx_cycles_user_status` | B-tree | Cycle lookup |

---

## Triggers

1. **Auto-generate 84 days** on cycle INSERT
2. **Update search vector** on action change
3. **Calculate weekly scores** on completion
4. **Update streaks** on score change

---

## RLS Policies

All tables have Row Level Security enabled:
- Users can only access their own data
- `momentum_credits`: INSERT only (no UPDATE/DELETE)

---

## Materialized View

`weekly_scores_mv` — Pre-aggregated for dashboard performance

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_scores_mv;
```

---

*Full SQL: See [DATABASE_SCHEMA.sql](../supabase/migrations/DATABASE_SCHEMA.sql)*

*Next: [06-frontend.md](./06-frontend.md)*
