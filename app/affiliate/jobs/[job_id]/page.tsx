import { createAdminClient, createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/dashboard-header'
import LinkButton from '../../link-button'

export default async function AffiliateJobDetailPage({ params }: { params: { job_id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: job } = await admin
    .from('jobs')
    .select('*, organizations(name)')
    .eq('id', params.job_id)
    .eq('status', 'active')
    .single()

  if (!job) notFound()

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = `${proto}://${host}`

  // Get existing referral link if any
  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: link } = profile
    ? await admin
        .from('referral_links')
        .select('token, click_events(id)')
        .eq('affiliate_id', profile.id)
        .eq('job_id', params.job_id)
        .single()
    : { data: null }

  const clickCount = (link as any)?.click_events?.length ?? 0

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={user.email!}
        nav={[
          { href: '/affiliate', label: 'Jobs' },
          { href: '/affiliate/commissions', label: 'Commissions' },
          { href: '/affiliate/profile', label: 'Profile' },
        ]}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <Link href="/affiliate" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to jobs
        </Link>

        {/* Job header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-7">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-base text-gray-500 mt-1">{(job as any).organizations?.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-vine-700">
                ${Number(job.commission_amount).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">referral fee</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {(job as any).location && (
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <div className="text-xs text-gray-400 mb-0.5">Location</div>
                <div className="text-sm font-medium text-gray-700">{(job as any).location}</div>
              </div>
            )}
            {(job as any).salary_range && (
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <div className="text-xs text-gray-400 mb-0.5">Salary</div>
                <div className="text-sm font-medium text-gray-700">{(job as any).salary_range}</div>
              </div>
            )}
          </div>

          <div className="prose prose-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </div>

        {/* Referral link card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-7">
          <h2 className="font-semibold text-gray-900 mb-1">Your referral link</h2>
          <p className="text-sm text-gray-400 mb-4">
            Share this link. You earn ${Number(job.commission_amount).toLocaleString()} when someone you refer gets hired.
          </p>
          <LinkButton
            jobId={job.id}
            existingToken={(link as any)?.token ?? null}
            clickCount={clickCount}
            appUrl={appUrl}
          />
        </div>

        {/* Candidate apply link */}
        <div className="bg-vine-50 rounded-2xl border border-vine-100 p-5 flex items-center justify-between">
          <p className="text-sm text-vine-700">Want to preview the candidate application page?</p>
          <Link
            href={`/jobs/${job.id}`}
            target="_blank"
            className="text-sm font-medium text-vine-700 hover:underline"
          >
            View job page →
          </Link>
        </div>
      </div>
    </main>
  )
}
