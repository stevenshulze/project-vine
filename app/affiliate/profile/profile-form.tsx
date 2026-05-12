'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateAffiliateProfile } from '../actions'
import { NICHES } from '@/lib/niches'

interface Profile {
  username: string
  displayName: string | null
  bio: string | null
  payoutEmail: string
  nicheTags: string[]
  vineyardPublic: boolean
  vineyardUrl: string
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [nicheTags, setNicheTags] = useState<string[]>(profile.nicheTags)
  const [vineyardPublic, setVineyardPublic] = useState(profile.vineyardPublic)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const toggleNiche = (n: string) =>
    setNicheTags((prev) => prev.includes(n) ? prev.filter((t) => t !== n) : [...prev, n])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaved(false)
    setError(null)
    const formData = new FormData(e.currentTarget)
    // Replace niche_tags with controlled state
    formData.delete('niche_tags')
    nicheTags.forEach((t) => formData.append('niche_tags', t))
    formData.set('vineyard_public', String(vineyardPublic))

    startTransition(async () => {
      const result = await updateAffiliateProfile(formData)
      if (result.success) setSaved(true)
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">Profile saved.</div>
      )}

      {/* Public profile */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Public profile</h2>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            @{profile.username}
          </div>
        </div>

        <div>
          <label htmlFor="display_name" className="block text-xs font-medium text-gray-500 mb-1">Display name</label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            defaultValue={profile.displayName ?? ''}
            placeholder="Your name or handle"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ''}
            placeholder="Tell candidates and employers who you are…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Niches</label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleNiche(n)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  nicheTags.includes(n)
                    ? 'bg-vine-600 text-white border-vine-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-vine-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vineyard */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Career Vineyard</h2>
          <Link href={profile.vineyardUrl} target="_blank" className="text-xs text-vine-600 hover:underline">
            Preview →
          </Link>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-sm text-vine-700 font-mono truncate flex-1">{profile.vineyardUrl}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">Public page</div>
            <div className="text-xs text-gray-400">When off, your Vineyard URL shows a "Coming soon" page.</div>
          </div>
          <button
            type="button"
            onClick={() => setVineyardPublic((v) => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              vineyardPublic ? 'bg-vine-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              vineyardPublic ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <Link href="/affiliate/vineyard" className="block text-xs text-vine-600 hover:underline">
          Manage jobs on your Vineyard →
        </Link>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Account</h2>

        <div>
          <label htmlFor="payout_email" className="block text-xs font-medium text-gray-500 mb-1">Payout email</label>
          <input
            id="payout_email"
            name="payout_email"
            type="email"
            defaultValue={profile.payoutEmail}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Commission payouts will be sent here once payouts are live.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
