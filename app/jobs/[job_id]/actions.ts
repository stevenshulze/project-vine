'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export type ApplyResult =
  | { success: true; applicationId: string }
  | { success: false; error: string }

export async function applyToJob(formData: FormData): Promise<ApplyResult> {
  const cookieStore = cookies()
  const supabase = createAdminClient()

  const jobId          = formData.get('job_id') as string
  const candidateName  = formData.get('candidate_name') as string
  const candidateEmail = formData.get('candidate_email') as string
  const resumeFile     = formData.get('resume') as File | null
  const vineRef        = cookieStore.get('vine_ref')?.value ?? null

  // --- Resume upload ---
  let resumeUrl: string | null = null
  if (resumeFile && resumeFile.size > 0) {
    const ext = resumeFile.name.split('.').pop()
    const path = `${jobId}/${Date.now()}.${ext}`
    const { data: upload, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(path, resumeFile, { contentType: resumeFile.type })
    if (uploadError) return { success: false, error: uploadError.message }
    resumeUrl = upload.path
  }

  // --- Referral link lookup ---
  let referralLinkId: string | null = null
  let affiliateId: string | null = null
  let isSelfReferral = false

  if (vineRef) {
    const { data: link } = await supabase
      .from('referral_links')
      .select('*')
      .eq('token', vineRef)
      .single()

    if (link) {
      referralLinkId = link.id
      affiliateId    = link.affiliate_id

      // Self-referral: candidate email matches affiliate's account email
      const { data: affiliateProfile } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('id', affiliateId)
        .single()

      if (affiliateProfile) {
        const { data: affiliateUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', affiliateProfile.user_id)
          .single()

        isSelfReferral =
          affiliateUser?.email?.toLowerCase() === candidateEmail.toLowerCase()
      }
    }
  }

  // --- Create application ---
  const { data: application, error: appError } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      referral_link_id: referralLinkId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      resume_url: resumeUrl,
      is_self_referral: isSelfReferral,
      status: 'applied',
    })
    .select('*')
    .single()

  if (appError) return { success: false, error: appError.message }

  // --- Create pending commission if a referral link is present ---
  if (affiliateId && referralLinkId) {
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    await supabase.from('commissions').insert({
      application_id:  application.id,
      affiliate_id:    affiliateId,
      amount:          job?.commission_amount ?? 0,
      commission_type: isSelfReferral ? 'self_referral' : 'referral',
      status:          'pending',
    })
  }

  return { success: true, applicationId: application.id }
}
