'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createJob } from '../actions'

export default function NewJobPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createJob(formData)
      if (result.success) {
        router.push('/employer')
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <span className="text-xl font-bold text-vine-700">Vine</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/employer" className="hover:text-gray-700">Jobs</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New job</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                required
                rows={6}
                placeholder="Describe the role, requirements, and what you're looking for…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral fee (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  name="commission_amount"
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="5000"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Paid to the affiliate when a hire is confirmed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                defaultValue="draft"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
              >
                <option value="draft">Draft — not visible to affiliates</option>
                <option value="active">Active — visible to affiliates now</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company name <span className="text-gray-400 font-normal">(first job only)</span>
              </label>
              <input
                name="org_name"
                type="text"
                placeholder="Acme Corp"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2 px-4 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Creating…' : 'Create job'}
              </button>
              <Link
                href="/employer"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
