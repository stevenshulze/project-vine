import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import ApplyForm from './apply-form'
import ShareButtons from '@/components/share-buttons'
import JobAuthSection from './auth-section'

interface Props {
  params: { job_id: string }
}

export default async function JobPage({ params }: Props) {
  const admin = createAdminClient()

  const { data: job } = await admin
    .from('jobs')
    .select('id, title, description, commission_amount, location, salary_range, status, organizations(name)')
    .eq('id', params.job_id)
    .eq('status', 'active')
    .single()

  if (!job) notFound()

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const jobUrl = `${proto}://${host}/jobs/${job.id}`

  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
  const feeFormatted = fmt.format(job.commission_amount)
  const org = (job as any).organizations?.name

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/jobs" className="text-xl font-bold text-vine-700">Vine</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">Log in</Link>
          <Link href="/register" className="text-sm px-3 py-1.5 bg-vine-600 text-white rounded-lg hover:bg-vine-700 transition-colors">
            Sign up
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">

        {/* Job details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-vine-50 text-vine-700 text-sm font-medium whitespace-nowrap">
              {feeFormatted} fee
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-sm text-gray-400 mb-6">
            {org && <span className="text-gray-600 font-medium">{org}</span>}
            {(job as any).location && (
              <><span>·</span><span>{(job as any).location}</span></>
            )}
            {(job as any).salary_range && (
              <><span>·</span><span>{(job as any).salary_range}</span></>
            )}
          </div>

          <div className="prose prose-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </div>

        {/* Apply */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Apply for this role</h2>
          <ApplyForm jobId={job.id} />
        </div>

        {/* Share */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Share this role</h2>
            <p className="text-sm text-gray-400 mt-0.5">Know someone who'd be a great fit?</p>
          </div>

          <ShareButtons url={jobUrl} title={job.title} company={org ?? 'this company'} />

          <div className="border-t border-gray-100 pt-4">
            <JobAuthSection jobId={job.id} feeFormatted={feeFormatted} jobPath={`/jobs/${job.id}`} />
          </div>
        </div>

      </div>
    </main>
  )
}
