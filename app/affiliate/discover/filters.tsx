'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { NICHES } from '@/lib/niches'

const LOCATION_TYPES = ['remote', 'hybrid', 'on-site'] as const
const SORT_OPTIONS = [
  { value: 'fee_desc',   label: 'Highest fee' },
  { value: 'newest',     label: 'Newest first' },
  { value: 'clicks',     label: 'Most popular' },
]

export default function DiscoverFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const update = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [pathname, router, searchParams])

  const q           = searchParams.get('q') ?? ''
  const industry    = searchParams.get('industry') ?? ''
  const locType     = searchParams.get('location_type') ?? ''
  const sort        = searchParams.get('sort') ?? 'fee_desc'
  const minFee      = searchParams.get('min_fee') ?? ''
  const maxFee      = searchParams.get('max_fee') ?? ''

  const hasFilters = q || industry || locType || minFee || maxFee || sort !== 'fee_desc'

  return (
    <div className="space-y-4">
      {/* Search + sort row */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search jobs, skills, companies…"
          defaultValue={q}
          onChange={(e) => {
            const val = e.target.value
            clearTimeout((window as any).__searchTimer)
            ;(window as any).__searchTimer = setTimeout(() => update('q', val || null), 350)
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
        />
        <select
          value={sort}
          onChange={(e) => update('sort', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filter pills row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Industry */}
        <select
          value={industry}
          onChange={(e) => update('industry', e.target.value || null)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-vine-500"
        >
          <option value="">All industries</option>
          {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        {/* Location type */}
        <select
          value={locType}
          onChange={(e) => update('location_type', e.target.value || null)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-vine-500"
        >
          <option value="">Any location</option>
          {LOCATION_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">{t}</option>
          ))}
        </select>

        {/* Fee range */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Fee</span>
          <input
            type="number"
            placeholder="Min"
            defaultValue={minFee}
            min={0}
            step={500}
            onChange={(e) => {
              clearTimeout((window as any).__minFeeTimer)
              ;(window as any).__minFeeTimer = setTimeout(() => update('min_fee', e.target.value || null), 500)
            }}
            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-vine-500"
          />
          <span className="text-xs text-gray-300">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxFee}
            min={0}
            step={500}
            onChange={(e) => {
              clearTimeout((window as any).__maxFeeTimer)
              ;(window as any).__maxFeeTimer = setTimeout(() => update('max_fee', e.target.value || null), 500)
            }}
            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-vine-500"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
