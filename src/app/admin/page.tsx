import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import type { Profile } from '@/types/database'

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

  const [{ data: template }, { data: users }] = await Promise.all([
    supabase.from('templates').select('*').limit(1).single(),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
  ])

  return <AdminClient currentUserId={user.id} template={template} users={users ?? []} />
}
