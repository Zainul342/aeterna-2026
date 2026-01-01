# 04 — Tech Stack

> **Status**: Complete  
> **Approach**: Modern, AI-friendly, performance-first

---

## Stack Overview

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS (Dark Mode First) |
| **Animation** | Framer Motion (Spring physics) |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **AI** | Vercel AI SDK + Gemini 1.5 Flash |
| **Icons** | Lucide React (1.5px stroke) |
| **Charts** | Recharts (minimalist) |
| **State** | TanStack Query v5 + Zustand |

---

## Key Configurations

### TypeScript
```json
{
  "strict": true,
  "paths": { "@/*": ["./src/*"] }
}
```

### Supabase Realtime
> ⚠️ Use **Broadcast**, NOT Postgres Changes for <100ms latency

### Framer Motion
```typescript
springConfig = { stiffness: 400, damping: 17 }
antigravityHover = { y: -8, scale: 1.02 }
```

---

## Design Tokens

| Property | Value |
|----------|-------|
| Background | `#0A0A0A` |
| Surface | `#141414` |
| Accent (Success) | `#CCFF00` |
| Accent (Warning) | `#F59E0B` |
| Accent (Critical) | `#EF4444` |
| Border Radius | 24px (Bento) |

---

## Code Patterns

- **Always**: Functional components, arrow functions
- **Server Components**: For data fetching
- **Client Components**: Only for interactivity
- **Imports**: Use `@/` alias

---

*Full details: See [TECH_STACK.md](../TECH_STACK.md)*

*Next: [05-database.md](./05-database.md)*
