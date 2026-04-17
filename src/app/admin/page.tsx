import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
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

  const adminSDK = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  )

  const [
    { data: mindmapTemplate },
    { data: bantcareTemplate },
    { data: users },
    { data: groups },
    { data: authUsersData },
  ] = await Promise.all([
    supabase.from('templates').select('*').eq('type', 'mindmap').maybeSingle(),
    supabase.from('templates').select('*').eq('type', 'bantcare').maybeSingle(),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('user_groups').select('*, group_members(user_id)').order('created_at', { ascending: true }),
    adminSDK.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // Build a map of userId → email_confirmed_at so AdminClient can show "Send Invite" for unconfirmed users
  const confirmedAt: Record<string, string | null> = {}
  for (const au of (authUsersData?.users ?? [])) {
    confirmedAt[au.id] = (au as { id: string; email_confirmed_at?: string }).email_confirmed_at ?? null
  }

  return (
    <AdminClient
      currentUserId={user.id}
      mindmapTemplate={mindmapTemplate}
      bantcareTemplate={bantcareTemplate}
      users={(users ?? []) as Profile[]}
      confirmedAt={confirmedAt}
      groups={(groups ?? []) as (UserGroup & { group_members: { user_id: string }[] })[]}
    />
  )
}
