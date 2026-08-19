import { createClient } from '@supabase/supabase-js'

// The publishable key is designed to ship in the browser — every table is
// protected by row level security. Override either value with an env var in
// Vercel (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) to point at a different
// project without touching this file.
const URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://nwwkiljmxbtzoxafsesq.supabase.co'
const KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FUZwE9jkUe_H7PNUuGkivQ_Fnp8KCbe'

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
