import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import type { Profile, UserGroup } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const profile = profileData as Profile | null
  if (profile?.role !== 'admin') redirect('/app')

  const [{ data: mindmapTemplate }, { data: bantcareTemplate }, { data: users }, { data: groups }] = await Promise.all([
    supabase.from('templates').select('*').eq('type', 'mindmap').maybeSingle(),
    supabase.from('templates').select('*').eq('type', 'bantcare').maybeSingle(),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase
      .from('user_groups')
      .select('*, group_members(user_id)')
      .order('created_at', { ascending: true }),
  ])

  return (
    <AdminClient
      currentUserId={user.id}
      mindmapTemplate={mindmapTemplate}
      bantcareTemplate={bantcareTemplate}
      users={(users ?? []) as Profile[]}
      groups={(groups ?? []) as (UserGroup & { group_members: { user_id: string }[] })[]}
    />
  )
}
