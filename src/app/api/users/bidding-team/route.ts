import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Maps job_title values to bidding team dropdown slots
const SLOT_MAP: Record<string, string> = {
  'VP of Sales': 'vp',
  'CDO':         'vp',
  'Sales':       'sales',
  'Presales':    'presales',
  'Chief Architect': 'presales',
  'DM':          'dm',
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  )

  const { data, error } = await adminClient
    .from('profiles')
    .select('id, full_name, alias, email, job_title')
    .not('job_title', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Row = { id: string; full_name: string | null; alias: string | null; email: string | null; job_title: string | null }
  const profiles = (data ?? []) as Row[]

  function displayName(p: Row) {
    return p.full_name ?? p.alias ?? p.email ?? p.id
  }

  const result: Record<string, { id: string; name: string }[]> = { vp: [], sales: [], presales: [], dm: [] }

  for (const p of profiles) {
    const slot = p.job_title ? SLOT_MAP[p.job_title] : undefined
    if (slot && result[slot]) {
      result[slot].push({ id: p.id, name: displayName(p) })
    }
  }

  return NextResponse.json(result)
}
