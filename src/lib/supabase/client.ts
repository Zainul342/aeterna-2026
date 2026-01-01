/**
 * AETERNA 2026 — Supabase Browser Client
 * 
 * Client-side Supabase client for browser components.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export const createClient = () => {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};
