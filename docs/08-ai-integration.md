# 08 — AI Integration

> **Status**: 🔲 Pending  
> **Phase**: Langkah 5

---

## Overview

This document will cover:

- Gemini 1.5 Flash configuration
- Vercel AI SDK setup
- AI Legacy Coach prompt engineering
- Streaming response handling
- Life event detection algorithm

---

## AI Coach Specifications

| Parameter | Value |
|-----------|-------|
| Provider | Gemini 1.5 Flash |
| Max Response | 100 words |
| Tone | Authoritative, empowering |
| Format | `[Observation] → [Affirmation] → [Action]` |

---

## System Prompt

```
You are the user's Legacy Partner for AETERNA 2026.

CONSTRAINTS:
- Maximum 100 words per response
- Never shame or guilt-trip
- Always connect today's action to 10-year legacy
- Provide ONE actionable next step
- Tone: Direct, confident, empowering
```

---

## Context Injection

```typescript
{
  vision: user.visionStatement,
  goal: currentGoal.title,
  score: weeklyScore,
  streak: user.winningStreak
}
```

---

## Life Event Detection

AI analyzes patterns to detect genuine life events:
- Login frequency drop
- Completion rate anomaly
- Historical baseline comparison

---

*Implementation pending. Will be updated in Langkah 5.*

*Next: [09-deployment.md](./09-deployment.md)*
