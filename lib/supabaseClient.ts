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
  throw new Error(
    'متغيرات البيئة الخاصة بـ Supabase مفقودة. يرجى ضبط NEXT_PUBLIC_SUPABASE_URL والمفتاح العام NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

if (isServiceRoleKey(anonKey)) {
  throw new Error(
    'المفتاح NEXT_PUBLIC_SUPABASE_ANON_KEY يجب أن يكون مفتاحاً عاماً (anon/publishable)، ولا يجوز مطلقاً استخدام مفتاح الخدمة (service_role) في الواجهة الأمامية.'
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})