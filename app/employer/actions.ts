'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendCommissionPendingAlert } from '@/lib/email'

export type ActionResult = { success: true; id?: string } | { success: false; error: string }

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

  const industry      = (formData.get('industry') as string) || null
  const roleFunction  = (formData.get('role_function') as string) || null
  const locationType  = (formData.get('location_type') as string) || null

  const { data: newJob, error } = await admin.from('jobs').insert({
    org_id: org.id,
    title,
    description,
    commission_amount: commissionAmount,
    status,
    industry,
    role_function: roleFunction,
    location_type: locationType,
  }).select('id').single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: newJob.id }
}

export async function updateJob(jobId: string, formData: FormData): Promise<ActionResult> {
  const admin = createAdminClient()
  const { error } = await admin.from('jobs').update({
    title:             formData.get('title') as string,
    description:       formData.get('description') as string,
    commission_amount: parseFloat(formData.get('commission_amount') as string),
    status:            formData.get('status') as string,
    location:          (formData.get('location') as string) || null,
    salary_range:      (formData.get('salary_range') as string) || null,
    industry:          (formData.get('industry') as string) || null,
    role_function:     (formData.get('role_function') as string) || null,
    location_type:     (formData.get('location_type') as string) || null,
  }).eq('id', jobId)
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

  // Hired → move pending commission to pending_verification and notify affiliate
  if (status === 'hired') {
    const { data: commissions } = await admin
      .from('commissions')
      .update({ status: 'pending_verification' })
      .eq('application_id', applicationId)
      .eq('status', 'pending')
      .select('affiliate_id, amount, jobs(title)')

    const commission = commissions?.[0] as any
    if (commission?.affiliate_id) {
      admin
        .from('affiliate_profiles')
        .select('payout_email, display_name')
        .eq('id', commission.affiliate_id)
        .single()
        .then(({ data: aff }) => {
          if (aff?.payout_email) {
            sendCommissionPendingAlert({
              to: aff.payout_email,
              affiliateName: aff.display_name ?? 'there',
              jobTitle: commission.jobs?.title ?? 'the role',
              amount: commission.amount,
            }).catch(() => {})
          }
        })
    }
  }

  return { success: true }
}
