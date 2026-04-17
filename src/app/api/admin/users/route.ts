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

function makeAdminSDK() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
  )
}

const ALLOWED_DOMAIN = 'fpt.com'

export async function POST(request: Request) {
  const { error, user } = await getAdminOrUnauthorized()
  if (error || !user) return error!

  const { email, name, role, jobTitle } = await request.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  if (role !== undefined && role !== 'user' && role !== 'admin') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const domain = (email as string).split('@')[1]
  if (domain !== ALLOWED_DOMAIN) {
    return NextResponse.json({ error: `Only @${ALLOWED_DOMAIN} email addresses are allowed.` }, { status: 400 })
  }

  const adminSDK = makeAdminSDK()
  const origin = request.headers.get('origin') ?? ''
  const { data: inviteData, error: inviteError } = await adminSDK.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/set-password`,
  })

  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 })

  // Update profile with name and job_title if provided
  if (inviteData?.user) {
    const updates: Record<string, unknown> = {}
    if (name) updates.full_name = name
    if (role) updates.role = role
    if (jobTitle) updates.job_title = jobTitle
    if (Object.keys(updates).length > 0) {
      await adminSDK.from('profiles').update(updates).eq('id', inviteData.user.id)
    }
  }

  // Return the created profile so the client can add it to the list
  let profile = null
  if (inviteData?.user) {
    const { data } = await adminSDK.from('profiles').select('*').eq('id', inviteData.user.id).single()
    profile = data
  }

  return NextResponse.json({ success: true, user: profile })
}

export async function DELETE(request: Request) {
  const { error, supabase, user } = await getAdminOrUnauthorized()
  if (error || !supabase || !user) return error!

  const { userId } = await request.json()
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  const adminSDK = makeAdminSDK()
  const { error: deleteError } = await adminSDK.auth.admin.deleteUser(userId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const { error, user } = await getAdminOrUnauthorized()
  if (error || !user) return error!

  const { userId, alias, salesRoles, fullName, role, jobTitle } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (role !== undefined && role !== 'user' && role !== 'admin') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (userId === user.id && role === 'user') {
    return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (alias !== undefined) updates.alias = alias ?? null
  if (salesRoles !== undefined) updates.sales_roles = salesRoles ?? []
  if (fullName !== undefined) updates.full_name = fullName || null
  if (role !== undefined) updates.role = role
  if (jobTitle !== undefined) updates.job_title = jobTitle || null

  const adminSDK = makeAdminSDK()
  const { data: updatedUser, error: updateError } = await adminSDK
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, user: updatedUser })
}
