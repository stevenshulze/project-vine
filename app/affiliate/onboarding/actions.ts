'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export type OnboardingResult =
  | { success: true; username: string }
  | { success: false; error: string }

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

async function uniqueUsername(base: string, admin: ReturnType<typeof createAdminClient>): Promise<string> {
  let candidate = base || 'user'
  let i = 2
  while (true) {
    const { data } = await admin
      .from('affiliate_profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${base.slice(0, 26)}-${i}`
    i++
  }
}

export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const displayName  = (formData.get('display_name') as string).trim()
  const payoutEmail  = (formData.get('payout_email') as string).trim() || user.email!
  const nicheTags    = formData.getAll('niche_tags') as string[]

  if (!displayName) return { success: false, error: 'Display name is required' }
  if (!nicheTags.length) return { success: false, error: 'Select at least one niche' }

  const username = await uniqueUsername(toSlug(displayName), admin)

  const { data: existing } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('affiliate_profiles')
      .update({ username, display_name: displayName, payout_email: payoutEmail, niche_tags: nicheTags })
      .eq('id', existing.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await admin
      .from('affiliate_profiles')
      .insert({ user_id: user.id, username, display_name: displayName, payout_email: payoutEmail, niche_tags: nicheTags })
    if (error) return { success: false, error: error.message }
  }

  return { success: true, username }
}
