import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { content } = await request.json()

  const { data: existing } = await supabase.from('templates').select('id').limit(1).single()

  if (existing) {
    await supabase
      .from('templates')
      .update({ content, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', existing.id)
  } else {
    await supabase.from('templates').insert({ content, updated_by: user.id })
  }

  return NextResponse.json({ success: true })
}
