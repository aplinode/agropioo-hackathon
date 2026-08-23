import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`)
  }
  return value
}

export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Set them in .env.local.'
    )
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: false },
  })

  return client
}

/**
 * Service-role client for trusted server-side maintenance tasks only
 * (e.g. scripts/sync-translations.mts). Bypasses RLS — never expose the
 * key to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient

  adminClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  return adminClient
}
