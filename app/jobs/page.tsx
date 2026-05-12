import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JobBoard from './job-board'

export default async function PublicJobsPage() {
  const admin = createAdminClient()

  const { data: jobs } = await admin
    .from('jobs')
    .select('id, title, description, commission_amount, location, salary_range, created_at, organizations(name)')
    .eq('status', 'active')
    .order('commission_amount', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/jobs" className="text-xl font-bold text-vine-700">Vine</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm px-3 py-1.5 bg-vine-600 text-white rounded-lg hover:bg-vine-700 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-3xl font-bold text-gray-900">Open Roles</h1>
          <p className="text-gray-500">
            Apply directly, or{' '}
            <Link href="/register" className="text-vine-600 hover:underline">
              earn a referral fee
            </Link>{' '}
            by referring the right person.
          </p>
        </div>

        {!jobs?.length ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400">No open roles right now. Check back soon.</p>
          </div>
        ) : (
          <JobBoard jobs={jobs as any} />
        )}
      </div>
    </main>
  )
}
