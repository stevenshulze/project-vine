'use server'

import { createActionClient, createAdminClient } from '@/lib/supabase/server'
import { sendCommissionApprovedAlert } from '@/lib/email'

export type ActionResult = { success: true } | { success: false; error: string }

export async function approveCommission(commissionId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('commissions')
    .update({ status: 'approved' })
    .eq('id', commissionId)
  if (error) return { success: false, error: error.message }

  // Fire-and-forget email to affiliate
  admin
    .from('commissions')
    .select(`
      amount,
      affiliate_profiles(payout_email, users(email)),
      applications(jobs(title))
    `)
    .eq('id', commissionId)
    .single()
    .then(({ data }) => {
      const profile = (data as any)?.affiliate_profiles
      const to = profile?.users?.email ?? profile?.payout_email
      const jobTitle = (data as any)?.applications?.jobs?.title ?? 'a role'
      const amount = Number((data as any)?.amount ?? 0)
      if (to) {
        sendCommissionApprovedAlert({
          to,
          affiliateName: to.split('@')[0],
          jobTitle,
          amount,
        }).catch(() => {})
      }
    })

  return { success: true }
}

export async function disputeCommission(
  commissionId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = createActionClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error: disputeErr } = await admin.from('disputes').insert({
    commission_id: commissionId,
    raised_by: user.id,
    reason: reason || 'Disputed by admin',
    status: 'open',
  })
  if (disputeErr) return { success: false, error: disputeErr.message }

  const { error: commErr } = await admin
    .from('commissions')
    .update({ status: 'disputed' })
    .eq('id', commissionId)
  if (commErr) return { success: false, error: commErr.message }

  return { success: true }
}

export async function markCommissionPaid(commissionId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('commissions')
    .update({ status: 'paid' })
    .eq('id', commissionId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function resolveDispute(
  commissionId: string,
  resolution: 'approve' | 'reject'
): Promise<ActionResult> {
  const admin = createAdminClient()

  // Close the open dispute record
  await admin
    .from('disputes')
    .update({ status: 'resolved' })
    .eq('commission_id', commissionId)
    .eq('status', 'open')

  // Move commission to approved (approve) or back to pending_verification (reject for re-review)
  const newStatus = resolution === 'approve' ? 'approved' : 'pending_verification'
  const { error } = await admin
    .from('commissions')
    .update({ status: newStatus })
    .eq('id', commissionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
