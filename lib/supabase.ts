// Hybrid client/server exports
// Client: import { supabase, getSessionSafe, getAccessToken } from '@/lib/supabase-client'
// Server: import { supabaseServer as supabaseAdmin, createServerSupabaseClient } from '@/lib/supabase-server'

export { supabaseClient as supabase, getSessionSafe, getAccessToken } from '@/lib/supabase-client'
// Server imports only - do not import supabaseAdmin/supabase-server in client components
// import { supabaseServer as supabaseAdmin } from '@/lib/supabase-server' // Server-only
// export type { Database } from '@/types/supabase' // Disabled - file not valid module

