import { createClient } from '@supabase/supabase-js'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

function isServiceRoleKey(key: string): boolean {
  const payload = key.split('.')[1]
  if (!payload) return false

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    return JSON.parse(decoded).role === 'service_role'
  } catch {
    return false
  }
}

if (!url || !anonKey) {
  throw new Error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and the public anon/publishable key.')
}

if (isServiceRoleKey(anonKey)) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY must be a public anon/publishable key, never a service_role key.')
}

export const supabase = createClient(url, anonKey)
