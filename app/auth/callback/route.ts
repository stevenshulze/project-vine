import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      // Affiliates with no profile yet → always send to onboarding
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'affiliate') {
          const admin = createAdminClient()
          const { data: affiliateProfile } = await admin
            .from('affiliate_profiles')
            .select('id, username')
            .eq('user_id', user.id)
            .single()

          if (!affiliateProfile) {
            return NextResponse.redirect(`${origin}/affiliate/onboarding`)
          }
          // Profile exists but no username → also send to onboarding
          if (!affiliateProfile.username) {
            return NextResponse.redirect(`${origin}/affiliate/onboarding`)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
