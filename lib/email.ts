import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Vine <notifications@vine.app>'

export async function sendCandidateConfirmation({
  to,
  candidateName,
  jobTitle,
  companyName,
}: {
  to: string
  candidateName: string
  jobTitle: string
  companyName: string
}) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your application to ${jobTitle} at ${companyName}`,
    html: `
      <p>Hi ${candidateName},</p>
      <p>We've received your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>The hiring team will be in touch if your profile is a match. Good luck!</p>
      <p style="color:#888;font-size:12px;margin-top:32px">Vine · Performance-based recruitment</p>
    `,
  })
}

export async function sendNewApplicationAlert({
  to,
  candidateName,
  jobTitle,
  referred,
}: {
  to: string
  candidateName: string
  jobTitle: string
  referred: boolean
}) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `New application for ${jobTitle}`,
    html: `
      <p>A new application has come in for <strong>${jobTitle}</strong>.</p>
      <p><strong>Candidate:</strong> ${candidateName}${referred ? ' <span style="color:#16a34a">(referred)</span>' : ''}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/employer">Review in Vine →</a></p>
      <p style="color:#888;font-size:12px;margin-top:32px">Vine · Performance-based recruitment</p>
    `,
  })
}

export async function sendCommissionApprovedAlert({
  to,
  affiliateName,
  jobTitle,
  amount,
}: {
  to: string
  affiliateName: string
  jobTitle: string
  amount: number
}) {
  if (!process.env.RESEND_API_KEY) return
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your commission for ${jobTitle} has been approved`,
    html: `
      <p>Hi ${affiliateName},</p>
      <p>Great news — your <strong>${fmt}</strong> referral commission for <strong>${jobTitle}</strong> has been approved and is being processed for payment.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate/commissions">View your commissions →</a></p>
      <p style="color:#888;font-size:12px;margin-top:32px">Vine · Performance-based recruitment</p>
    `,
  })
}
