import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { AFFILIATE_NAV } from '../nav'
import DiscoverFilters from './filters'

interface SearchParams {
  q?: string
  industry?: string
  location_type?: string
  sort?: string
  min_fee?: string
  max_fee?: string
}

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const q          = searchParams.q?.trim() ?? ''
  const industry   = searchParams.industry ?? ''
  const locType    = searchParams.location_type ?? ''
  const sort       = searchParams.sort ?? 'fee_desc'
  const minFee     = parseFloat(searchParams.min_fee ?? '0') || 0
  const maxFee     = parseFloat(searchParams.max_fee ?? '9999999') || 9999999

  // Jobs already in affiliate's pipeline
  const { data: linked } = profile
    ? await admin.from('referral_links').select('job_id').eq('affiliate_id', profile.id)
    : { data: [] }
  const linkedIds = new Set((linked ?? []).map((l: any) => l.job_id))

  // Build query — full-text search uses search_vector column
  let jobQuery = admin
    .from('jobs')
    .select('id, title, description, commission_amount, location, location_type, industry, role_function, created_at, organizations(name)')
    .eq('status', 'active')
    .gte('commission_amount', minFee)
    .lte('commission_amount', maxFee)

  if (industry) jobQuery = jobQuery.eq('industry', industry)
  if (locType)  jobQuery = jobQuery.eq('location_type', locType)

  // Full-text search: query search_vector; also search org names separately
  let jobIds: string[] | null = null
  if (q) {
    const tsQuery = q.trim().split(/\s+/).filter(Boolean).join(' & ')

    const [{ data: textMatches }, { data: orgMatches }] = await Promise.all([
      admin.from('jobs').select('id').textSearch('search_vector', tsQuery, { config: 'english' }).eq('status', 'active'),
      admin.from('organizations').select('id').ilike('name', `%${q}%`).then(async ({ data: orgs }) => {
        if (!orgs?.length) return { data: [] as { id: string }[] }
        return admin.from('jobs').select('id').in('org_id', orgs.map((o: any) => o.id)).eq('status', 'active')
      }),
    ])

    jobIds = Array.from(new Set([
      ...(textMatches ?? []).map((j: any) => j.id),
      ...(orgMatches ?? []).map((j: any) => j.id),
    ]))

    if (jobIds.length === 0) {
      // No matches — return early with empty state
      return (
        <main className="min-h-screen bg-gray-50">
          <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
            <Suspense><DiscoverFilters /></Suspense>
            <p className="text-sm text-gray-400 text-center py-16">No jobs match your search.</p>
          </div>
        </main>
      )
    }

    jobQuery = jobQuery.in('id', jobIds)
  }

  // Sort
  if (sort === 'newest') {
    jobQuery = jobQuery.order('created_at', { ascending: false })
  } else {
    jobQuery = jobQuery.order('commission_amount', { ascending: false })
  }

  const { data: allJobs } = await jobQuery

  // For "most popular" sort, we'd need click counts — approximate with commission desc for now
  // Filter to unlinked jobs for the main list
  const newJobs = (allJobs ?? []).filter((j: any) => !linkedIds.has(j.id))
  const pipelineCount = linkedIds.size

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover Jobs</h1>
            <p className="text-sm text-gray-400 mt-1">
              {newJobs.length} available to promote
              {pipelineCount > 0 && (
                <> · <Link href="/affiliate/pipeline" className="text-vine-600 hover:underline">{pipelineCount} in your pipeline →</Link></>
              )}
            </p>
          </div>
        </div>

        <Suspense>
          <DiscoverFilters />
        </Suspense>

        {newJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-500 font-medium mb-2">
              {pipelineCount > 0 ? "You're promoting all matching jobs." : "No jobs available right now."}
            </p>
            {pipelineCount > 0 && (
              <Link href="/affiliate/pipeline" className="text-sm text-vine-600 hover:underline">
                View your pipeline →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {newJobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/affiliate/jobs/${job.id}`}
                className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-vine-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{job.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-sm text-gray-400">
                      {job.organizations?.name && <span className="text-gray-600">{job.organizations.name}</span>}
                      {job.location && <><span>·</span><span>{job.location}</span></>}
                      {job.salary_range && <><span>·</span><span>{job.salary_range}</span></>}
                    </div>
                    {(job.industry || job.role_function) && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {job.industry && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{job.industry}</span>
                        )}
                        {job.role_function && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{job.role_function}</span>
                        )}
                        {job.location_type && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{job.location_type}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-vine-700">{fmt(job.commission_amount)}</div>
                    <div className="text-xs text-gray-400">referral fee</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400 line-clamp-2">{job.description}</p>
                <div className="mt-2 text-xs text-vine-600">Get your referral link →</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
