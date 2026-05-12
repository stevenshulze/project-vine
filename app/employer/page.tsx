import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/dashboard-header'

const STATUS_STYLES: Record<string, string> = {
  draft:  'bg-gray-100 text-gray-600',
  active: 'bg-vine-100 text-vine-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-600',
}

export default async function EmployerDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: org } = await admin
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  const { data: jobs } = org
    ? await admin
        .from('jobs')
        .select('*, applications(id)')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={user.email!}
        nav={[{ href: '/employer', label: 'Jobs' }]}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            {org && <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>}
          </div>
          <Link
            href="/employer/new-job"
            className="px-4 py-2 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors"
          >
            + New job
          </Link>
        </div>

        {!jobs?.length ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400 mb-4">No jobs yet.</p>
            <Link
              href="/employer/new-job"
              className="px-4 py-2 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors"
            >
              Post your first job
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/employer/jobs/${job.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-vine-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{job.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[job.status] ?? ''}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>${Number(job.commission_amount).toLocaleString()} fee</span>
                  <span>{job.applications?.length ?? 0} applicants</span>
                  <span className="text-gray-300">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
