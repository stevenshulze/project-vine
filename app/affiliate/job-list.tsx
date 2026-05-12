'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import LinkButton from './link-button'

type SortKey = 'fee_desc' | 'fee_asc' | 'newest' | 'company_az'

interface Job {
  id: string
  title: string
  description: string
  commission_amount: number
  location: string | null
  salary_range: string | null
  created_at: string
  organizations: { name: string } | null
}

interface LinkInfo {
  token: string
  clicks: number
}

interface Props {
  jobs: Job[]
  linkMap: Record<string, LinkInfo>
  appUrl: string
}

export default function JobList({ jobs, linkMap, appUrl }: Props) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('fee_desc')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const result = jobs.filter((job) =>
      job.title.toLowerCase().includes(q) ||
      (job.organizations?.name ?? '').toLowerCase().includes(q) ||
      (job.location ?? '').toLowerCase().includes(q)
    )
    switch (sort) {
      case 'fee_desc':    return [...result].sort((a, b) => b.commission_amount - a.commission_amount)
      case 'fee_asc':     return [...result].sort((a, b) => a.commission_amount - b.commission_amount)
      case 'newest':      return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'company_az':  return [...result].sort((a, b) => (a.organizations?.name ?? '').localeCompare(b.organizations?.name ?? ''))
    }
  }, [jobs, search, sort])

  return (
    <div className="space-y-4">
      {/* Search + sort bar */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search jobs or companies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
        >
          <option value="fee_desc">Fee: High → Low</option>
          <option value="fee_asc">Fee: Low → High</option>
          <option value="newest">Newest first</option>
          <option value="company_az">Company A → Z</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">No jobs match your search.</p>
      )}

      {filtered.map((job) => {
        const linkInfo = linkMap[job.id] ?? null
        return (
          <div key={job.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/affiliate/jobs/${job.id}`}
                  className="font-semibold text-gray-900 hover:text-vine-700 transition-colors"
                >
                  {job.title}
                </Link>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm text-gray-500">{job.organizations?.name}</span>
                  {job.location && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-400">{job.location}</span>
                    </>
                  )}
                  {job.salary_range && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-400">{job.salary_range}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-vine-700 whitespace-nowrap">
                ${Number(job.commission_amount).toLocaleString()} fee
              </span>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2">{job.description}</p>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={`/affiliate/jobs/${job.id}`}
                className="text-xs text-vine-600 hover:underline"
              >
                View full details →
              </Link>
              <LinkButton
                jobId={job.id}
                existingToken={linkInfo?.token ?? null}
                clickCount={linkInfo?.clicks ?? 0}
                appUrl={appUrl}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
