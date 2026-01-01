# 02 — Product Requirements Document

> **Version**: 1.0  
> **Status**: Complete

---

## Executive Summary

**AETERNA 2026** is a high-performance 12-week execution web app designed to kill the yearly planning illusion and force radical accountability through time compression, opinionated workflows, and identity-level AI coaching.

---

## Functional Modules

### 1. Velocity Dashboard

| Element | Specification |
|---------|---------------|
| **84-Day Countdown** | Prominent timer showing days remaining |
| **Week Indicator** | "Week 7 of 12" with visual progress arc |
| **Urgency Gradient** | Cyber Lime → Amber → Red as deadline approaches |

### 2. Monk Mode (Focus Protocol)

- **Constraint**: MAX 3 lead indicators per week
- **Rationale**: Eliminates decision fatigue
- **Override**: None. Non-negotiable.

### 3. Execution Scoring

| Score | Status | UI Treatment |
|-------|--------|--------------|
| 85-100% | Execution Elite | Cyber Lime glow |
| 70-84% | On Track | Neutral |
| 50-69% | Warning | Amber, AI nudge |
| 0-49% | Critical | Red, intervention |

---

## The 85% Rule & Momentum Credits

### Shield System

| Feature | Spec |
|---------|------|
| Credits/Quarter | 3 |
| Effect | Score frozen at last good state |
| UI Badge | Yellow "🛡️ Shielded" |
| Rollover | None (use it or lose it) |

---

## AI Legacy Coach

| Parameter | Specification |
|-----------|---------------|
| Provider | Gemini 1.5 Flash |
| Max Response | 100 words |
| Tone | Authoritative, empowering |
| Focus | Actionable nudges |

### Prompt Format
```
[Observation] → [Identity Affirmation] → [Single Action]
```

---

## Technical Constraints

| Metric | Target |
|--------|--------|
| Initial Load | < 2s |
| Input Friction | < 3s |
| AI Response | < 2s (streaming) |
| Uptime | 99.9% |

---

## Roadmap Summary

| Phase | Weeks | Focus |
|-------|-------|-------|
| Foundation | 1-4 | Schema, Auth, UI Shell |
| Core Execution | 5-8 | Dashboard, Goals, Tracking |
| Intelligence | 9-12 | AI Coach, Shield, Importer |
| Advanced | Post-launch | Predictive Self, Team Mode |

---

*Full details: See original [PRD.md](../PRD.md)*

*Next: [03-system-flow.md](./03-system-flow.md)*
