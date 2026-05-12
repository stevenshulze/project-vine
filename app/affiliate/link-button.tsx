'use client'

import { useState, useTransition } from 'react'
import { generateReferralLink } from './actions'

interface Props {
  jobId: string
  existingToken: string | null
  clickCount: number
  appUrl: string
}

export default function LinkButton({ jobId, existingToken, clickCount, appUrl }: Props) {
  const [token, setToken] = useState<string | null>(existingToken)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const referralUrl = token ? `${appUrl}/r/${token}` : null

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateReferralLink(jobId)
      if (result.success) {
        setToken(result.token)
      } else {
        setError(result.error)
      }
    })
  }

  const handleCopy = async () => {
    if (!referralUrl) return
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!token) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="text-xs px-3 py-1.5 bg-vine-600 text-white rounded-lg hover:bg-vine-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Generating…' : 'Get link'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400">{clickCount} click{clickCount !== 1 ? 's' : ''}</span>
      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 max-w-xs">
        <span className="text-xs text-gray-500 truncate">{referralUrl}</span>
      </div>
      <button
        onClick={handleCopy}
        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}
