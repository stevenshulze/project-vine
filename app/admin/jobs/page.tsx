'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DashboardHeader from '@/components/dashboard-header'

const STATUS_STYLES: Record<string, string> = {
  draft:  'bg-gray-100 text-gray-600',
  active: 'bg-vine-100 text-vine-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-600',
}

export default function AdminJobsPage() {
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const load = async () => {
    const [{ data: { user } }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('jobs')
        .select('*, organizations(name), applications(id)')
        .order('created_at', { ascending: false }),
    ])
    setUser(user)
    setJobs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = (jobId: string, newStatus: string) => {
    startTransition(async () => {
      await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)
      load()
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={user?.email ?? ''}
        nav={[
          { href: '/admin', label: 'Commissions' },
          { href: '/admin/jobs', label: 'Jobs' },
          { href: '/admin/users', label: 'Users' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
          <span className="text-sm text-gray-400">{jobs.length} total</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400">No jobs yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium">Job</th>
                  <th className="text-left px-4 py-3 font-medium">Company</th>
                  <th className="text-left px-4 py-3 font-medium">Fee</th>
                  <th className="text-left px-4 py-3 font-medium">Applicants</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Change status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job: any) => (
                  <tr key={job.id} className="text-sm hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{job.title}</td>
                    <td className="px-4 py-4 text-gray-500">{job.organizations?.name ?? '—'}</td>
                    <td className="px-4 py-4 text-gray-700">
                      ${Number(job.commission_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {job.applications?.length ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[job.status] ?? ''}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={job.status}
                        disabled={isPending}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-vine-500 disabled:opacity-50"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/jobs/${job.id}`}
                        target="_blank"
                        className="text-xs text-vine-600 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
