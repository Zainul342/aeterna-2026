# 09 — Deployment

> **Status**: 🔲 Pending  
> **Phase**: Langkah 6

---

## Overview

This document will cover:

- Vercel project configuration
- Supabase production setup
- Environment variables
- Domain and SSL
- CI/CD pipeline

---

## Vercel Configuration

```json
{
  "buildCommand": "next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

---

## Environment Variables

```bash
# Production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

---

## Supabase Production

- [ ] Create production project
- [ ] Run migrations
- [ ] Enable RLS on all tables
- [ ] Configure Auth providers
- [ ] Set up Edge Functions

---

## Domain Setup

- [ ] Configure custom domain
- [ ] SSL certificate (automatic via Vercel)
- [ ] Redirect www to apex

---

## Monitoring

- Vercel Analytics
- Supabase Dashboard
- Error tracking (optional: Sentry)

---

*Implementation pending. Will be updated in Langkah 6.*

*Back to: [README.md](./README.md)*
