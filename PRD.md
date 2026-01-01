# AETERNA 2026 — Product Requirements Document

> **Version**: 1.0  
> **Last Updated**: December 31, 2024  
> **Status**: Draft — Langkah 3 (Hasil Rancangan)

---

## Executive Summary

**AETERNA 2026** is a high-performance 12-week execution web app designed to kill the yearly planning illusion and force radical accountability through time compression, opinionated workflows, and identity-level AI coaching.

### Core Vision

> **"Kill the Year, Own the Week."**

We transform the 12-month planning trap into a 12-week execution sprint. Every week becomes a month. Every day becomes a week. No escape. No excuses.

### Target Market

| Segment | Profile |
|---------|---------|
| **Primary** | High-ticket solopreneurs ($50k–$500k MRR) |
| **Pain Point** | Notion fatigue, productivity theater, existential drift |
| **Value Proposition** | Time > Money. They pay for results, not features |

---

## Functional Modules

### 1. Velocity Dashboard

The command center for 12-week execution. Designed for scarcity-based urgency.

#### 1.1 Scarcity-Based UI

| Element | Specification |
|---------|---------------|
| **84-Day Countdown** | Prominent timer showing days remaining in current 12-week cycle |
| **Week Indicator** | "Week 7 of 12" with visual progress arc |
| **Urgency Gradient** | UI shifts from Cyber Lime → Amber → Red as deadline approaches |

#### 1.2 Monk Mode (Focus Protocol)

```
┌─────────────────────────────────────────────┐
│  MAX 3 LEAD INDICATORS PER WEEK             │
│  ─────────────────────────────────────────  │
│  "If everything is important,               │
│   nothing is important."                    │
│                                             │
│  System BLOCKS adding 4th indicator         │
│  until current cycle completes.             │
└─────────────────────────────────────────────┘
```

- **Opinionated Constraint**: Users cannot track more than 3 lead indicators
- **Rationale**: Eliminates decision fatigue and forces needle-moving focus
- **Override**: None. This is non-negotiable.

#### 1.3 Execution Scoring (0-100%)

Real-time score calculated from completed vs. committed actions.

| Score Range | Status | UI Treatment |
|-------------|--------|--------------|
| 85-100% | **Execution Elite** | Cyber Lime glow, celebration micro-animation |
| 70-84% | **On Track** | Neutral state |
| 50-69% | **Warning Zone** | Amber indicator, AI nudge triggered |
| 0-49% | **Critical / Rebuild Mode** | Red state, intervention protocol |

---

### 2. The 85% Rule & Momentum Credits

#### 2.1 The 85% Execution Threshold

The system enforces an absolute standard: **85% is the minimum for sustainable high performance.**

```
EXECUTION SCORE = (Completed Actions / Committed Actions) × 100

If Score < 85%:
  → Trigger "Rebuild Mode"
  → AI Coach provides recovery protocol
  → Weekly planning is reduced to 2 lead indicators (forced simplification)
```

#### 2.2 Momentum Credits (The Shield System)

> **"Life happens. Your momentum shouldn't die."**

| Feature | Specification |
|---------|---------------|
| **Credits per Quarter** | 3 Shield Credits |
| **Trigger** | User-activated during emergency weeks |
| **Effect** | Score freezes at last good state instead of dropping to red |
| **UI Badge** | Yellow "🛡️ Shielded" instead of Red "⚠️ Critical" |
| **Rollover** | Unused credits do NOT roll over (use it or lose it) |

#### 2.3 Shield Activation Flow

```
┌─────────────────────────────────────────────────────────┐
│  USER clicks "Activate Shield"                          │
│  ↓                                                      │
│  Modal: "This will protect your week from scoring.      │
│          You have [X] shields remaining this quarter."  │
│  ↓                                                      │
│  [Cancel] [Confirm Shield]                              │
│  ↓                                                      │
│  Week status → "Shielded" (Yellow Badge)                │
│  Score → Frozen at previous week's value                │
│  AI Coach → Sends recovery-focused message              │
└─────────────────────────────────────────────────────────┘
```

---

### 3. AI Legacy Coach

#### 3.1 Core Philosophy

The AI acts as a **Legacy Partner**, not a task manager. It connects daily micro-actions to the user's 10-year vision, providing identity-affirming feedback that builds momentum.

#### 3.2 Technical Specifications

| Parameter | Specification |
|-----------|---------------|
| **Provider** | Google Gemini 1.5 Flash |
| **Max Response** | 100 words per session (strict limit) |
| **Tone** | Authoritative yet empowering |
| **Focus** | Actionable nudges, NOT lectures |
| **Context Window** | Last 7 days of user activity + 10-year vision statement |

#### 3.3 Prompt Engineering Blueprint

```
SYSTEM PROMPT:
You are the user's Legacy Partner for AETERNA 2026.

CONSTRAINTS:
- Maximum 100 words per response
- Never shame or guilt-trip
- Always connect today's action to 10-year legacy
- Provide ONE actionable next step
- Tone: Direct, confident, empowering

CONTEXT INJECTION:
- User's Vision Statement: {vision}
- Current 12-Week Goal: {goal}
- This Week's Lead Indicators: {indicators}
- Execution Score: {score}%
- Streak: {streak} days

RESPONSE FORMAT:
[Observation] → [Identity Affirmation] → [Single Action]
```

#### 3.4 Sample AI Responses

**High Score (92%):**
> "You're executing like the person you're becoming. 92% this week puts you in the top 1% of doers. Tomorrow: lock in that client call before 10am. Your future self thanks you."

**Low Score (58%) with Shield:**
> "Shielded week activated. Life demanded your attention—that's wisdom, not weakness. When you return, start with ONE indicator. Momentum rebuilds from micro-wins."

---

### 4. Predictive Parallel Self (2030 Feature)

> **Future Roadmap Feature** — Phase 4 Implementation

#### 4.1 Concept

A simulation engine that projects "Alternate Timelines" based on today's micro-decisions, showing users the compounding impact of their choices.

#### 4.2 Simulation Logic

```
IF user skips committed action:
  → Calculate legacy impact percentage
  → Display: "If you skip this, legacy trajectory slips by X%"

IF user completes above target:
  → Calculate acceleration
  → Display: "This compounds to Y% closer to your 2030 vision"
```

#### 4.3 UI Concept

```
┌─────────────────────────────────────────────────────────┐
│  PARALLEL SELF PROJECTION                               │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [TIMELINE A: Skip Today]        [TIMELINE B: Execute]  │
│  Legacy: 67% →→→                 Legacy: 79% →→→→→      │
│  2030 Gap: +18 months            2030 Gap: -3 months    │
│                                                         │
│  "Small hinges swing big doors."                        │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack & Architecture

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | App Router, RSC, Server Actions |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Framer Motion** | 11.x | Micro-animations, page transitions |
| **Lucide React** | Latest | Iconography (1.5px stroke weight) |

### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, Auth, Realtime subscriptions |
| **Row Level Security** | Multi-tenant data isolation |
| **Edge Functions** | Serverless compute for AI orchestration |

### AI Integration

| Technology | Purpose |
|------------|---------|
| **Vercel AI SDK** | Streaming responses, token management |
| **Gemini 1.5 Flash** | Primary LLM for AI Legacy Coach |
| **Structured Outputs** | JSON schema enforcement for predictable responses |

### External Integrations

| Service | Purpose |
|---------|---------|
| **WhatsApp Cloud API** | Zero-friction input gateway |
| **Telegram Bot API** | Alternative messaging input |
| **Notion API** | Migration engine (one-click import) |

---

## Design Language

### Premium Modern Aesthetic

| Property | Value |
|----------|-------|
| **Theme** | Dark Mode Primary |
| **Background** | `#0A0A0A` (True Black) |
| **Surface** | `#141414` (Elevated) |
| **Border** | `#262626` (Subtle) |
| **Text Primary** | `#FAFAFA` |
| **Text Secondary** | `#A1A1AA` |

### Accent Colors

| State | Color | Hex |
|-------|-------|-----|
| **Success / Execution Elite** | Cyber Lime | `#CCFF00` |
| **Warning** | Amber | `#F59E0B` |
| **Critical** | Red | `#EF4444` |
| **Shielded** | Yellow | `#FACC15` |
| **Info / Links** | Cyan | `#22D3EE` |

### Component Specifications

| Component | Specification |
|-----------|---------------|
| **Border Radius** | 24px (Bento Grid corners) |
| **Card Padding** | 24px |
| **Grid Gap** | 16px |
| **Icon Stroke** | 1.5px (Lucide default) |
| **Font Family** | Inter (Primary), JetBrains Mono (Monospace) |

### Motion Principles

```css
/* Standard Transitions */
--transition-fast: 150ms ease-out;
--transition-normal: 300ms ease-out;
--transition-slow: 500ms ease-out;

/* Micro-interactions */
- Hover: Scale 1.02, subtle glow
- Click: Scale 0.98, haptic feedback
- Success: Confetti burst, score counter animation
```

---

## Migration Engine (Notion Importer)

### One-Click Import Flow

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Connect Notion                                 │
│  → OAuth flow → User grants read access                 │
│                                                         │
│  STEP 2: Select Databases                               │
│  → System auto-detects Goals, Tasks, Projects           │
│  → User confirms mapping                                │
│                                                         │
│  STEP 3: Batch Processing                               │
│  → Paginated API calls (100 items/batch)                │
│  → Progress bar with ETA                                │
│                                                         │
│  STEP 4: Checksum Validation                            │
│  → SHA-256 hash comparison                              │
│  → "100% Data Integrity Verified" badge                 │
│                                                         │
│  STEP 5: Transformation                                 │
│  → Notion blocks → AETERNA structure                    │
│  → Orphaned items → Inbox for triage                    │
└─────────────────────────────────────────────────────────┘
```

### Data Integrity Specifications

| Requirement | Implementation |
|-------------|----------------|
| **Batching** | 100 records per API call |
| **Rate Limiting** | Respect Notion's 3 req/sec limit |
| **Checksums** | SHA-256 hash per record |
| **Verification** | Post-import count + hash validation |
| **Rollback** | Full undo within 24 hours |

---

## Business Logic

### Execution Score Formula

```javascript
/**
 * Calculate weekly execution score
 * @param {number} completed - Number of completed actions
 * @param {number} committed - Number of committed actions
 * @returns {number} Score between 0-100
 */
function calculateExecutionScore(completed, committed) {
  if (committed === 0) return 100; // No commitments = perfect score
  
  const rawScore = (completed / committed) * 100;
  return Math.round(Math.min(100, Math.max(0, rawScore)));
}

/**
 * Determine execution status based on score
 * @param {number} score - Execution score (0-100)
 * @param {boolean} isShielded - Whether week is shielded
 * @returns {string} Status label
 */
function getExecutionStatus(score, isShielded) {
  if (isShielded) return 'SHIELDED';
  if (score >= 85) return 'EXECUTION_ELITE';
  if (score >= 70) return 'ON_TRACK';
  if (score >= 50) return 'WARNING';
  return 'CRITICAL';
}
```

### Momentum Credit Logic

```javascript
/**
 * Shield credit management
 */
const CREDITS_PER_QUARTER = 3;

function canActivateShield(usedCredits, currentQuarter) {
  return usedCredits < CREDITS_PER_QUARTER;
}

function activateShield(weekId, userId) {
  // 1. Deduct credit
  // 2. Mark week as shielded
  // 3. Freeze score at previous week's value
  // 4. Trigger AI recovery message
  // 5. Log for analytics
}
```

### Legacy Impact Calculation (Predictive Self)

```javascript
/**
 * Calculate legacy trajectory impact
 * @param {number} currentScore - Current execution score
 * @param {number} targetScore - Required score for legacy goal
 * @param {number} weeksRemaining - Weeks left in 12-week cycle
 */
function calculateLegacyImpact(currentScore, targetScore, weeksRemaining) {
  const gap = targetScore - currentScore;
  const weeklyImpact = gap / weeksRemaining;
  
  return {
    trajectoryShift: weeklyImpact.toFixed(1),
    riskLevel: weeklyImpact > 5 ? 'HIGH' : weeklyImpact > 2 ? 'MEDIUM' : 'LOW',
    message: generateImpactMessage(weeklyImpact)
  };
}
```

---

## Technical Constraints

### Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial Load** | < 2 seconds | Lighthouse FCP |
| **Time to Interactive** | < 3 seconds | Lighthouse TTI |
| **Input Friction** | < 3 seconds | Time from intent to logged action |
| **AI Response** | < 2 seconds | Streaming first token |

### Reliability Requirements

| Metric | Target |
|--------|--------|
| **Uptime** | 99.9% |
| **Data Durability** | 99.999999999% (11 nines via Supabase) |
| **Backup Frequency** | Daily automated, 30-day retention |

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Authentication** | Supabase Auth (Email, OAuth) |
| **Authorization** | Row Level Security (RLS) |
| **Data Encryption** | AES-256 at rest, TLS 1.3 in transit |
| **Session Management** | JWT with 7-day refresh tokens |

---

## Roadmap

### Phase 1: Foundation (Weeks 1-4)

| Deliverable | Description |
|-------------|-------------|
| ✅ PRD & Strategy | Complete documentation |
| 🔲 Database Schema | Supabase tables, RLS policies |
| 🔲 Auth System | Sign up, login, password reset |
| 🔲 Core UI Shell | Layout, navigation, dark theme |

### Phase 2: Core Execution (Weeks 5-8)

| Deliverable | Description |
|-------------|-------------|
| 🔲 Velocity Dashboard | Countdown, score display, Monk Mode |
| 🔲 Goal Hierarchy | Vision → Goals → Tactics → Actions |
| 🔲 Weekly Planning | Commit actions, set lead indicators |
| 🔲 Execution Tracking | Mark complete, calculate scores |

### Phase 3: Intelligence Layer (Weeks 9-12)

| Deliverable | Description |
|-------------|-------------|
| 🔲 AI Legacy Coach | Gemini integration, 100-word responses |
| 🔲 Momentum Credits | Shield system, recovery protocols |
| 🔲 Notion Importer | One-click migration with validation |
| 🔲 WhatsApp Gateway | Zero-friction input via messaging |

### Phase 4: Advanced Features (Post-Launch)

| Deliverable | Description |
|-------------|-------------|
| 🔲 Predictive Parallel Self | Simulation engine, timeline projections |
| 🔲 Team Mode | Shared accountability for small teams |
| 🔲 Analytics Dashboard | Historical trends, pattern recognition |
| 🔲 Mobile PWA | Offline-first, biometric auth |

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **Lead Indicator** | A proactive metric you control (e.g., "Make 5 sales calls") |
| **Lag Indicator** | A reactive metric that shows results (e.g., "Revenue generated") |
| **Execution Score** | Percentage of committed actions completed |
| **Shield Credit** | Protection mechanism for emergency weeks |
| **Legacy Partner** | AI coach focused on long-term identity building |

### B. References

- *The 12 Week Year* by Brian Moran & Michael Lennington
- *Atomic Habits* by James Clear (Identity-based behavior change)
- *Deep Work* by Cal Newport (Monk Mode inspiration)

---

*This PRD is a living document. Updates will be versioned and tracked.*
