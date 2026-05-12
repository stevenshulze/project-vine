'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export type ActionResult = { success: true } | { success: false; error: string }

export async function approveCommission(commissionId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('commissions')
    .update({ status: 'approved' })
    .eq('id', commissionId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function disputeCommission(
  commissionId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = createClient()
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
