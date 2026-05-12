'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NICHES } from '@/lib/niches'
import { completeOnboarding } from './actions'
import { useEffect } from 'react'

export default function OnboardingPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await completeOnboarding(formData)
      if (result.success) {
        router.push(`/vineyard/${result.username}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-vine-700 mb-2">Vine</div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your profile</h1>
          <p className="text-gray-500 mt-1 text-sm">
            This takes 30 seconds. Your Career Vineyard is ready right after.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
            )}

            {/* Display name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your name <span className="text-red-400">*</span>
              </label>
              <input
                name="display_name"
                type="text"
                required
                placeholder="e.g. Alex Chen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">This is shown publicly on your Career Vineyard.</p>
            </div>

            {/* Payout email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payout email <span className="text-red-400">*</span>
              </label>
              <input
                name="payout_email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Where your commissions will be sent when payouts go live.</p>
            </div>

            {/* Niche tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your niches <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Pick the industries you know best. Affiliates with a focused niche earn more.
              </p>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((niche) => (
                  <NicheCheckbox key={niche} niche={niche} />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-vine-600 text-white font-medium rounded-xl hover:bg-vine-700 transition-colors disabled:opacity-50 text-sm"
            >
              {isPending ? 'Creating your Vineyard…' : 'Create my Career Vineyard →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function NicheCheckbox({ niche }: { niche: string }) {
  const [checked, setChecked] = useState(false)
  return (
    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors select-none ${
      checked
        ? 'bg-vine-600 border-vine-600 text-white'
        : 'border-gray-200 text-gray-600 hover:border-vine-300 hover:text-vine-700'
    }`}>
      <input
        type="checkbox"
        name="niche_tags"
        value={niche}
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="sr-only"
      />
      {niche}
    </label>
  )
}
