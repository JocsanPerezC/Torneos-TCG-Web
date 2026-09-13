import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
/** The UI uses local demo persistence until these public environment variables are configured. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null
