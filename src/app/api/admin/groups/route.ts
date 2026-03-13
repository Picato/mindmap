import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null, user: null }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null, user: null }
  }

  return { error: null, supabase, user }
}

// GET /api/admin/groups — list all groups with members
export async function GET() {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return error!

  const { data, error: fetchError } = await supabase
    .from('user_groups')
    .select('*, group_members(user_id)')
    .order('created_at', { ascending: true })

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/groups — create group
export async function POST(request: Request) {
  const { error, supabase, user } = await requireAdmin()
  if (error || !supabase || !user) return error!

  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Group name is required' }, { status: 400 })

  const { data, error: insertError } = await supabase
    .from('user_groups')
    .insert({ name: name.trim(), created_by: user.id })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/groups — delete group
export async function DELETE(request: Request) {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return error!

  const { groupId } = await request.json()
  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })

  const { error: deleteError } = await supabase
    .from('user_groups')
    .delete()
    .eq('id', groupId)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
