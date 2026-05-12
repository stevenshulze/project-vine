'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

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

export default function JobBoard({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('fee_desc')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const result = jobs.filter((j) =>
      j.title.toLowerCase().includes(q) ||
      (j.organizations?.name ?? '').toLowerCase().includes(q) ||
      (j.location ?? '').toLowerCase().includes(q)
    )
    switch (sort) {
      case 'fee_desc':   return [...result].sort((a, b) => b.commission_amount - a.commission_amount)
      case 'fee_asc':    return [...result].sort((a, b) => a.commission_amount - b.commission_amount)
      case 'newest':     return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'company_az': return [...result].sort((a, b) => (a.organizations?.name ?? '').localeCompare(b.organizations?.name ?? ''))
    }
  }, [jobs, search, sort])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-4">
      {/* Search + sort */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search jobs, companies, or locations…"
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
        <p className="text-sm text-gray-400 text-center py-12">No jobs match your search.</p>
      )}

      {filtered.map((job) => (
        <Link
          key={job.id}
          href={`/jobs/${job.id}`}
          className="block bg-white rounded-xl border border-gray-200 px-6 py-5 hover:border-vine-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-semibold text-gray-900">{job.title}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-semibold text-vine-700">{fmt(job.commission_amount)}</div>
              <div className="text-xs text-gray-400">referral fee</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-400 line-clamp-2">{job.description}</p>
          <div className="mt-3 text-xs text-vine-600">View & apply →</div>
        </Link>
      ))}
    </div>
  )
}
