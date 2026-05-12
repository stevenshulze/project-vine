import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import DashboardHeader from '@/components/dashboard-header'
import JobList from './job-list'
import { AFFILIATE_NAV } from './nav'

export default async function AffiliateDiscoverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = `${proto}://${host}`

  const { data: allJobs } = await admin
    .from('jobs')
    .select('*, organizations(name)')
    .eq('status', 'active')
    .order('commission_amount', { ascending: false })

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: links } = profile
    ? await admin
        .from('referral_links')
        .select('job_id')
        .eq('affiliate_id', profile.id)
    : { data: [] }

  const linkedJobIds = new Set((links ?? []).map((l: any) => l.job_id))

  // Only show jobs the affiliate isn't already promoting
  const discoverJobs = (allJobs ?? []).filter((j: any) => !linkedJobIds.has(j.id))
  const pipelineCount = linkedJobIds.size

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover Jobs</h1>
            <p className="text-sm text-gray-400 mt-1">
              {discoverJobs.length} available to promote
              {pipelineCount > 0 && (
                <> · <Link href="/affiliate/pipeline" className="text-vine-600 hover:underline">{pipelineCount} in your pipeline →</Link></>
              )}
            </p>
          </div>
        </div>

        {discoverJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-500 font-medium mb-2">You're promoting all available jobs.</p>
            <p className="text-sm text-gray-400 mb-4">Check back soon for new openings.</p>
            <Link href="/affiliate/pipeline"
              className="text-sm text-vine-600 hover:underline">
              View your pipeline →
            </Link>
          </div>
        ) : (
          <JobList jobs={discoverJobs as any} appUrl={appUrl} />
        )}
      </div>
    </main>
  )
}
