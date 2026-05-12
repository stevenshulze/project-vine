import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  const supabase = createClient()

  const { data: referralLink } = await supabase
    .from('referral_links')
    .select('id, job_id')
    .eq('token', token)
    .single()

  if (!referralLink) {
    // Unknown token — drop to home
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Collect click metadata
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const userAgent = request.headers.get('user-agent') ?? ''
  const fingerprint = createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .slice(0, 16)

  await supabase.from('click_events').insert({
    referral_link_id: referralLink.id,
    ip_address: ip,
    user_agent: userAgent,
    fingerprint,
  })

  const response = NextResponse.redirect(
    new URL(`/jobs/${referralLink.job_id}`, request.url)
  )

  // vine_ref cookie — 30 day expiry, HttpOnly so JS can't read it
  response.cookies.set('vine_ref', token, {
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return response
}
