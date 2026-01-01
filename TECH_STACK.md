# AETERNA 2026 — Technical Stack & Architecture

> **Version**: 1.0  
> **Last Updated**: January 1, 2026  
> **Status**: Implementation Ready

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AETERNA 2026 TECH STACK                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  Next.js 15 │  │ Supabase    │  │ Gemini 1.5  │  │ Vercel    │  │
│  │  React 19   │  │ PostgreSQL  │  │ Flash       │  │ Edge      │  │
│  │  TypeScript │  │ Realtime    │  │ AI SDK      │  │ Functions │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Tailwind    │  │ Shadcn UI   │  │ Framer      │  │ TanStack  │  │
│  │ CSS         │  │ Radix       │  │ Motion      │  │ Query v5  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Core Framework & Language

### Next.js 15 (App Router)

| Specification | Value |
|---------------|-------|
| **Version** | 15.x (latest stable) |
| **Router** | App Router (NOT Pages Router) |
| **React** | 19.x |
| **Rendering** | RSC-first (Server Components by default) |
| **Turbopack** | Enabled for development |

### TypeScript Configuration

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [{ "name": "next" }]
  }
}
```

### Import Aliases

```typescript
// Always use @/ alias for clean imports
import { Button } from '@/components/ui/button';
import { useMomentumStore } from '@/stores/momentum-store';
import { calculateScore } from '@/lib/scoring';
import type { Task, Cycle } from '@/types';
```

---

## 2. Styling (Dark Mode First)

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Dark mode via class
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // AETERNA Design System
        background: {
          DEFAULT: '#0A0A0A',  // True Black
          elevated: '#141414', // Card surfaces
          muted: '#1E1E1E',    // Subtle backgrounds
        },
        foreground: {
          DEFAULT: '#FAFAFA',  // Primary text
          muted: '#A1A1AA',    // Secondary text
          subtle: '#71717A',   // Tertiary text
        },
        border: {
          DEFAULT: '#262626',
          subtle: '#1F1F1F',
        },
        accent: {
          lime: '#CCFF00',     // Cyber Lime (Success)
          amber: '#F59E0B',    // Warning
          red: '#EF4444',      // Critical
          yellow: '#FACC15',   // Shielded
          cyan: '#22D3EE',     // Info/Links
          blue: '#3B82F6',     // Reset Sanctuary
          slate: '#1E293B',    // Calming background
        },
      },
      borderRadius: {
        'bento': '24px', // Bento Grid standard
        'bento-sm': '16px',
        'bento-lg': '32px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'breathing': 'breathing 4s ease-in-out infinite',
        'confetti': 'confetti 0.5s ease-out forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(204, 255, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(204, 255, 0, 0.6)' },
        },
        'breathing': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
```

### CSS Variables (globals.css)

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Default: Dark Mode */
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --card: 0 0% 8%;
    --card-foreground: 0 0% 98%;
    --border: 0 0% 15%;
    --ring: 68 100% 50%;
    
    /* Transition speeds (overridden by momentum state) */
    --transition-fast: 150ms;
    --transition-normal: 300ms;
    --transition-slow: 500ms;
  }

  /* Flow Velocity State */
  [data-momentum-state="FLOW_VELOCITY"] {
    --transition-fast: 120ms;
    --transition-normal: 240ms;
    --glow-intensity: 1;
  }

  /* Reset Sanctuary State */
  [data-momentum-state="RESET_SANCTUARY"] {
    --background: 222 47% 11%;
    --transition-fast: 225ms;
    --transition-normal: 450ms;
    --glow-intensity: 0;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

---

## 3. Backend & Realtime Logic

### Supabase Configuration

| Feature | Configuration |
|---------|---------------|
| **Authentication** | PKCE flow, Email/Password, Google OAuth |
| **Database** | PostgreSQL with RLS enabled by default |
| **Realtime** | Broadcast (NOT Postgres Changes) |
| **Storage** | For user avatars and file uploads |
| **Edge Functions** | Deno runtime for AI orchestration |

### Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
};
```

### Realtime Broadcast (NOT Postgres Changes)

> ⚠️ **CRITICAL**: Do NOT use Postgres Changes for frequent UI updates. Use Broadcast for <100ms latency.

```typescript
// src/lib/realtime/scoring-channel.ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Subscribe to score updates via Broadcast
export const subscribeToScoreUpdates = (
  userId: string,
  onUpdate: (score: number) => void
) => {
  const channel = supabase.channel(`scores:${userId}`);

  channel
    .on('broadcast', { event: 'score_update' }, (payload) => {
      onUpdate(payload.payload.score);
    })
    .subscribe();

  return () => channel.unsubscribe();
};

// Publish score update (called from API routes)
export const publishScoreUpdate = async (userId: string, score: number) => {
  const channel = supabase.channel(`scores:${userId}`);
  
  await channel.send({
    type: 'broadcast',
    event: 'score_update',
    payload: { score, timestamp: Date.now() },
  });
};
```

### Row Level Security (RLS) Pattern

```sql
-- All tables MUST have RLS enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);
```

---

## 4. UI & Animation (Antigravity Vibe)

### Shadcn UI Setup

```bash
# Initialize Shadcn UI
npx shadcn@latest init

# Install required components
npx shadcn@latest add button card dialog input label
npx shadcn@latest add dropdown-menu popover progress
npx shadcn@latest add sheet tabs toast tooltip
```

### Framer Motion Configuration

```typescript
// src/lib/motion/config.ts
export const springConfig = {
  stiffness: 400,
  damping: 17,
  mass: 1,
};

export const antigravityHover = {
  rest: { y: 0, scale: 1 },
  hover: { 
    y: -8, 
    scale: 1.02,
    transition: { type: 'spring', ...springConfig }
  },
};

export const cardTransition = {
  type: 'spring',
  ...springConfig,
};
```

### Animated Bento Card Component

```tsx
// src/components/ui/bento-card.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springConfig, antigravityHover } from '@/lib/motion/config';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const BentoCard = ({ 
  children, 
  className, 
  interactive = true 
}: BentoCardProps) => {
  return (
    <motion.div
      initial="rest"
      whileHover={interactive ? "hover" : undefined}
      variants={antigravityHover}
      transition={{ type: 'spring', ...springConfig }}
      className={cn(
        // Base styles
        'relative overflow-hidden',
        'bg-background-elevated border border-border',
        'rounded-bento p-6',
        // GPU-accelerated transforms
        'will-change-transform',
        'transform-gpu',
        // Glow effect on hover
        'hover:border-accent-lime/30',
        'hover:shadow-[0_0_30px_rgba(204,255,0,0.1)]',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
```

### Lucide React Icons

```typescript
// src/components/icons/index.ts
import {
  Target,
  Flame,
  Shield,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Zap,
  Calendar,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Plus,
  Mic,
} from 'lucide-react';

// Re-export with consistent stroke width (1.5px)
export {
  Target,
  Flame,
  Shield,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Zap,
  Calendar,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Plus,
  Mic,
};

// Default icon props
export const iconProps = {
  strokeWidth: 1.5,
  className: 'w-5 h-5',
};
```

---

## 5. Data Visualization

### Recharts Configuration

```tsx
// src/components/charts/score-chart.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ScoreChartProps {
  data: { week: string; score: number }[];
}

export const ScoreChart = ({ data }: ScoreChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis 
          dataKey="week" 
          stroke="#71717A"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          domain={[0, 100]}
          stroke="#71717A"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#141414',
            border: '1px solid #262626',
            borderRadius: '12px',
          }}
          labelStyle={{ color: '#FAFAFA' }}
        />
        {/* 85% Threshold Line */}
        <ReferenceLine 
          y={85} 
          stroke="#CCFF00" 
          strokeDasharray="3 3"
          label={{ value: '85%', fill: '#CCFF00', fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#CCFF00"
          strokeWidth={2}
          dot={{ fill: '#CCFF00', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: '#CCFF00' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### Chart Style Guide

| Property | Value |
|----------|-------|
| **Line Color** | `#CCFF00` (Cyber Lime) |
| **Axis Color** | `#71717A` (Subtle) |
| **Background** | Transparent |
| **Grid** | Hidden (minimalist) |
| **Dots** | Filled, 4px radius |
| **Tooltip** | Dark card style |

---

## 6. Global State & Data Fetching

### TanStack Query Setup

```typescript
// src/lib/query/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Query Provider

```tsx
// src/components/providers/query-provider.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query/client';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
```

### Example Query Hook

```typescript
// src/hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/types';

const supabase = createClient();

export const useTasks = (cycleId: string) => {
  return useQuery({
    queryKey: ['tasks', cycleId],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    },
    onMutate: async (taskId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
        old?.map((t) =>
          t.id === taskId ? { ...t, status: 'completed' } : t
        )
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
```

---

## 7. AI Integration

### Vercel AI SDK Setup

```typescript
// src/lib/ai/gemini.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export const legacyCoachModel = gemini('gemini-1.5-flash', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  ],
});
```

### AI Coach API Route

```typescript
// src/app/api/ai/coach/route.ts
import { streamText } from 'ai';
import { legacyCoachModel } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { context } = await req.json();

  const result = streamText({
    model: legacyCoachModel,
    system: `You are the user's Legacy Partner for AETERNA 2026.

CONSTRAINTS:
- Maximum 100 words per response
- Never shame or guilt-trip
- Always connect today's action to 10-year legacy
- Provide ONE actionable next step
- Tone: Direct, confident, empowering

RESPONSE FORMAT:
[Observation] → [Identity Affirmation] → [Single Action]`,
    prompt: `Context:
- Vision: ${context.vision}
- Current Goal: ${context.goal}
- Execution Score: ${context.score}%
- Streak: ${context.streak} days

Provide your coaching nudge:`,
    maxTokens: 150,
  });

  return result.toDataStreamResponse();
}
```

---

## 8. Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard shell
│   │   ├── page.tsx            # Velocity Dashboard
│   │   ├── goals/
│   │   │   └── page.tsx
│   │   ├── planning/
│   │   │   └── page.tsx        # Sunday Planning
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── ai/
│   │   │   └── coach/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── whatsapp/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── bento-card.tsx
│   ├── dashboard/
│   │   ├── velocity-header.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── task-list.tsx
│   │   └── score-display.tsx
│   ├── charts/
│   │   └── score-chart.tsx
│   └── providers/
│       ├── query-provider.tsx
│       └── theme-provider.tsx
├── hooks/
│   ├── use-tasks.ts
│   ├── use-scores.ts
│   └── use-momentum-state.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── ai/
│   │   └── gemini.ts
│   ├── motion/
│   │   └── config.ts
│   ├── query/
│   │   └── client.ts
│   └── utils.ts
├── stores/
│   └── momentum-store.ts       # Zustand store
└── types/
    └── index.ts                # Type definitions
```

---

## 9. Code Generation Rules

### Component Patterns

```typescript
// ✅ CORRECT: Functional component with arrow function
export const TaskCard = ({ task }: { task: Task }) => {
  return <div>{task.title}</div>;
};

// ❌ WRONG: Named function declaration
export function TaskCard({ task }: { task: Task }) {
  return <div>{task.title}</div>;
}
```

### Server vs Client Components

```typescript
// ✅ Server Component (default) - for data fetching
// src/app/(dashboard)/page.tsx
import { createClient } from '@/lib/supabase/server';
import { TaskList } from '@/components/dashboard/task-list';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase.from('tasks').select('*');

  return <TaskList initialTasks={tasks} />;
}

// ✅ Client Component - only for interactivity
// src/components/dashboard/task-list.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export const TaskList = ({ initialTasks }: { initialTasks: Task[] }) => {
  const [tasks, setTasks] = useState(initialTasks);
  
  return (
    <motion.div>
      {/* Interactive list */}
    </motion.div>
  );
};
```

### Bento Grid Layout

```tsx
// ✅ CORRECT: 24px border radius, consistent spacing
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <BentoCard className="col-span-2">
    {/* Wide card content */}
  </BentoCard>
  <BentoCard>
    {/* Regular card content */}
  </BentoCard>
</div>
```

---

## 10. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# WhatsApp (Optional)
WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. Package Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.40.0",
    "@ai-sdk/google": "^0.0.50",
    "ai": "^3.3.0",
    "framer-motion": "^11.3.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.400.0",
    "zustand": "^4.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@tanstack/react-query-devtools": "^5.40.0"
  }
}
```

---

## Summary

| Layer | Technology | Key Config |
|-------|------------|------------|
| **Framework** | Next.js 15 + React 19 | App Router, RSC-first |
| **Language** | TypeScript | Strict mode, @/ aliases |
| **Styling** | Tailwind CSS | Dark mode first, Bento 24px |
| **Backend** | Supabase | RLS enabled, Broadcast realtime |
| **UI** | Shadcn + Framer Motion | Spring physics, antigravity hover |
| **Charts** | Recharts | Minimalist, Cyber Lime accent |
| **State** | TanStack Query + Zustand | 30s stale time, optimistic updates |
| **AI** | Vercel AI SDK + Gemini | 100 word limit, streaming |

---

*This document serves as the technical blueprint for AETERNA 2026. All implementations must adhere to these specifications.*
