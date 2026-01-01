# 06 — Frontend

> **Status**: 🔲 Pending  
> **Phase**: Langkah 5

---

## Overview

This document will cover:

- UI component library setup (Shadcn)
- Bento Grid layout patterns
- Framer Motion animations
- Momentum state transitions (Flow Velocity / Reset Sanctuary)
- Dashboard implementation

---

## Planned Components

```
src/components/
├── ui/                 # Shadcn primitives
│   ├── button.tsx
│   ├── card.tsx
│   └── bento-card.tsx  # Animated wrapper
├── dashboard/
│   ├── velocity-header.tsx
│   ├── countdown-timer.tsx
│   ├── task-list.tsx
│   └── score-display.tsx
├── charts/
│   └── score-chart.tsx
└── providers/
    ├── query-provider.tsx
    └── theme-provider.tsx
```

---

## Design Tokens

| Token | Value |
|-------|-------|
| Background | `#0A0A0A` |
| Surface | `#141414` |
| Accent | `#CCFF00` |
| Border Radius | 24px |
| Font | Inter, JetBrains Mono |

---

## Animation Config

```typescript
springConfig = { stiffness: 400, damping: 17 }
antigravityHover = { y: -8, scale: 1.02 }
```

---

*Implementation pending. Will be updated in Langkah 5.*

*Next: [07-backend.md](./07-backend.md)*
