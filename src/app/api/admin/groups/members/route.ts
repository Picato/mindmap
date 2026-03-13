import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null }
  }

  return { error: null, supabase }
}

// POST /api/admin/groups/members — add user to group
export async function POST(request: Request) {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return error!

  const { groupId, userId } = await request.json()
  if (!groupId || !userId) return NextResponse.json({ error: 'groupId and userId required' }, { status: 400 })

  const { error: insertError } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/groups/members — remove user from group
export async function DELETE(request: Request) {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return error!

  const { groupId, userId } = await request.json()
  if (!groupId || !userId) return NextResponse.json({ error: 'groupId and userId required' }, { status: 400 })

  const { error: deleteError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
