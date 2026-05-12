'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

type Result = { success: true } | { success: false; error: string }

async function getProfile() {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  return data
}

export async function toggleVineyardListing(jobId: string, active: boolean): Promise<Result> {
  const admin = createAdminClient()
  const profile = await getProfile()
  if (!profile) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await admin
    .from('vineyard_listings')
    .select('id')
    .eq('affiliate_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('vineyard_listings')
      .update({ active })
      .eq('id', existing.id)
    if (error) return { success: false, error: error.message }
  } else if (active) {
    // Get next sort_order
    const { data: last } = await admin
      .from('vineyard_listings')
      .select('sort_order')
      .eq('affiliate_id', profile.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const { error } = await admin
      .from('vineyard_listings')
      .insert({ affiliate_id: profile.id, job_id: jobId, active: true, sort_order: (last?.sort_order ?? -1) + 1 })
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

export async function reorderVineyardListings(orderedJobIds: string[]): Promise<Result> {
  const admin = createAdminClient()
  const profile = await getProfile()
  if (!profile) return { success: false, error: 'Not authenticated' }

  const updates = orderedJobIds.map((jobId, index) =>
    admin
      .from('vineyard_listings')
      .update({ sort_order: index })
      .eq('affiliate_id', profile.id)
      .eq('job_id', jobId)
  )

  await Promise.all(updates)
  return { success: true }
}
