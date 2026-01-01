# 03 — System Flow & Architecture

> **Status**: Complete  
> **Scope**: Execution engine logic

---

## Execution Loop

```
SUNDAY → MONDAY-SATURDAY → FRIDAY → SUNDAY
 PLAN  →     EXECUTE     → SCORE  → PLAN
```

---

## Phase 1: Sunday Planning (Lever Optimizer)

- **AI suggests exactly 3 tasks** based on 12-week goals
- **15-second approve/swap flow**
- **Monday 07:45 AM nudge** via WhatsApp/Push

---

## Phase 2: Daily Execution (Monk Mode)

- **MAX 3 tasks visible** in dashboard
- **One-tap or voice "Done"** with <3s latency
- **Scoring**: `Daily_Score = (Completed / 3) * 100`

---

## Phase 3: Momentum Credit (Shield Logic)

| Feature | Specification |
|---------|---------------|
| Credits | 3 per quarter |
| Trigger | Score <50% + AI detects life event |
| Abuse Prevention | Check 3-month baseline |
| UI | Yellow "Shield" badge |

---

## Phase 4: Adaptive UI States

### Flow Velocity (7+ Day Streak)
- Theme: Golden Glow (#CCFF00)
- Animation: 20% faster, confetti, 2x scroll
- Voice: High-energy

### Reset Sanctuary (3+ Day Losing)
- Theme: Calming Slate (#1E293B)
- Animation: Slow fades, breathing pulse
- Content: Only 1 anchor task visible

---

## Phase 5: 13th Week Snapshot

- **Strategy**: No data movement
- **Method**: ENUM `cycle_status ('active' | 'closed')`
- **Index**: Composite on `(user_id, cycle_status)` for <10ms

---

## Database Triggers

1. `trg_generate_cycle_actions` — Auto-create 84 days
2. `trg_update_weekly_scores` — Recalculate on completion
3. `trg_update_streaks` — Update win/lose streaks

---

## Performance KPIs

| Endpoint | Target |
|----------|--------|
| Dashboard GET | <100ms |
| Task Complete | <50ms |
| AI Coach | <2s streaming |
| History Query | <10ms |

---

*Full details: See [SYSTEM_FLOW.md](../SYSTEM_FLOW.md)*

*Next: [04-tech-stack.md](./04-tech-stack.md)*
