import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

async function getAdminOrUnauthorized() {
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

  return { error: null, supabase, user }
}

const ALLOWED_DOMAIN = 'fpt.com'

export async function POST(request: Request) {
  const { error, supabase, user } = await getAdminOrUnauthorized()
  if (error || !supabase || !user) return error!

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const domain = (email as string).split('@')[1]
  if (domain !== ALLOWED_DOMAIN) {
    return NextResponse.json({ error: `Only @${ALLOWED_DOMAIN} email addresses are allowed.` }, { status: 400 })
  }

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  )

  const origin = request.headers.get('origin') ?? ''
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/set-password`,
  })

  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { error, supabase, user } = await getAdminOrUnauthorized()
  if (error || !supabase || !user) return error!

  const { userId } = await request.json()
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  )

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const { error, supabase } = await getAdminOrUnauthorized()
  if (error || !supabase) return error!

  const { userId, alias } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ alias: alias ?? null })
    .eq('id', userId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
