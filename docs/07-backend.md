# 07 — Backend & API

> **Status**: 🔲 Pending  
> **Phase**: Langkah 5

---

## Overview

This document will cover:

- Supabase client setup (browser + server)
- API route implementations
- Server Actions for mutations
- Real-time subscriptions (Broadcast)
- Edge Functions for AI orchestration

---

## Planned API Routes

```
src/app/api/
├── ai/
│   └── coach/
│       └── route.ts      # Gemini streaming
├── webhooks/
│   └── whatsapp/
│       └── route.ts      # WhatsApp input
└── cron/
    └── nudge/
        └── route.ts      # Scheduled notifications
```

---

## Server Actions

```typescript
// Planned actions
completeTask(taskId: string)
activateShield(weekId: string)
createCycle(data: CycleInput)
updateGoal(goalId: string, data: GoalUpdate)
```

---

## Real-time Subscriptions

```typescript
// Broadcast (NOT Postgres Changes)
supabase.channel(`scores:${userId}`)
  .on('broadcast', { event: 'score_update' }, callback)
  .subscribe();
```

---

*Implementation pending. Will be updated in Langkah 5.*

*Next: [08-ai-integration.md](./08-ai-integration.md)*
