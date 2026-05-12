'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ApplicationRow from './application-row'
import { updateJobStatus } from '../../actions'
import LogoutButton from '@/components/logout-button'

const STATUS_STYLES: Record<string, string> = {
  draft:  'bg-gray-100 text-gray-600',
  active: 'bg-vine-100 text-vine-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-600',
}

export default function JobDetailPage({ params }: { params: { job_id: string } }) {
  const [job, setJob] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const load = async () => {
    const [{ data: j }, { data: apps }] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', params.job_id).single(),
      supabase.from('applications').select('*').eq('job_id', params.job_id)
        .order('applied_at', { ascending: false }),
    ])
    setJob(j)
    setApplications(apps ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await updateJobStatus(params.job_id, newStatus)
      load()
    })
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading…</p>
    </main>
  )

  if (!job) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Job not found.</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-vine-700">Vine</span>
          <Link href="/employer" className="text-sm text-gray-500 hover:text-gray-700">← Jobs</Link>
        </div>
        <LogoutButton />
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Job header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-sm text-gray-400 mt-1">
                ${Number(job.commission_amount).toLocaleString()} referral fee
                {job.location && <span className="ml-2">· {job.location}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/employer/jobs/${params.job_id}/edit`}
                className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                Edit
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[job.status] ?? ''}`}>
                {job.status}
              </span>
              <select
                value={job.status}
                disabled={isPending}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-vine-500 disabled:opacity-50"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Applications */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Applications <span className="text-gray-400 font-normal">({applications.length})</span>
          </h2>

          {applications.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No applications yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 pr-4 font-medium">Candidate</th>
                  <th className="text-left pb-2 pr-4 font-medium">Source</th>
                  <th className="text-left pb-2 pr-4 font-medium">Resume</th>
                  <th className="text-left pb-2 pr-4 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app: any) => (
                  <ApplicationRow key={app.id} application={app} onUpdate={load} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
