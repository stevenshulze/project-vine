import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApplyForm from './apply-form'

interface Props {
  params: { job_id: string }
}

export default async function JobPage({ params }: Props) {
  const supabase = createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, description, commission_amount, status')
    .eq('id', params.job_id)
    .eq('status', 'active')
    .single()

  if (!job) notFound()

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(job.commission_amount)

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <span className="text-xl font-bold text-vine-700">Vine</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Job details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-vine-50 text-vine-700 text-sm font-medium whitespace-nowrap">
              {formatted} referral fee
            </span>
          </div>
          <div className="prose prose-sm text-gray-600 whitespace-pre-wrap">
            {job.description}
          </div>
        </div>

        {/* Application form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Apply for this role</h2>
          <ApplyForm jobId={job.id} />
        </div>
      </div>
    </main>
  )
}
