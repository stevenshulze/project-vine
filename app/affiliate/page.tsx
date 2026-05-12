import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LinkButton from './link-button'

export default async function AffiliateDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Fetch active jobs with org name
  const { data: jobs } = await admin
    .from('jobs')
    .select('*, organizations(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Get affiliate profile if it exists
  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Get existing referral links + click counts for this affiliate
  const { data: links } = profile
    ? await admin
        .from('referral_links')
        .select('job_id, token, click_events(id)')
        .eq('affiliate_id', profile.id)
    : { data: [] }

  const linkMap = new Map(
    (links ?? []).map((l: any) => [l.job_id, { token: l.token, clicks: l.click_events?.length ?? 0 }])
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-vine-700">Vine</span>
        <span className="text-sm text-gray-500">{user.email}</span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Available Jobs</h1>

        {!jobs?.length ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400">No active jobs right now. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => {
              const linkInfo = linkMap.get(job.id) ?? null
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-semibold text-gray-900">{job.title}</span>
                      <span className="text-sm text-gray-400 ml-2">
                        {job.organizations?.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-vine-700 whitespace-nowrap">
                      ${Number(job.commission_amount).toLocaleString()} fee
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 mb-3 line-clamp-2">{job.description}</p>
                  <LinkButton
                    jobId={job.id}
                    existingToken={linkInfo?.token ?? null}
                    clickCount={linkInfo?.clicks ?? 0}
                    appUrl={appUrl}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
