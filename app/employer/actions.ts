'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export type ActionResult = { success: true } | { success: false; error: string }

export async function createJob(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const title             = formData.get('title') as string
  const description       = formData.get('description') as string
  const commissionAmount  = parseFloat(formData.get('commission_amount') as string)
  const status            = formData.get('status') as string
  const orgName           = (formData.get('org_name') as string)?.trim() || 'My Company'

  // Get or create org
  let { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) {
    const { data: newOrg, error: orgError } = await admin
      .from('organizations')
      .insert({ name: orgName, owner_id: user.id })
      .select('id')
      .single()
    if (orgError) return { success: false, error: orgError.message }
    org = newOrg
  }

  const { error } = await admin.from('jobs').insert({
    org_id: org.id,
    title,
    description,
    commission_amount: commissionAmount,
    status,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateJobStatus(jobId: string, status: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { error } = await admin.from('jobs').update({ status }).eq('id', jobId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<ActionResult> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) return { success: false, error: error.message }

  // Hired → move pending commission to pending_verification
  if (status === 'hired') {
    await admin
      .from('commissions')
      .update({ status: 'pending_verification' })
      .eq('application_id', applicationId)
      .eq('status', 'pending')
  }

  return { success: true }
}
