'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  feeFormatted: string
  jobPath: string
}

export default function JobAuthSection({ jobId, feeFormatted, jobPath }: Props) {
  const [state, setState] = useState<'loading' | 'anon' | 'has-link' | 'no-link'>('loading')
  const [referralLink, setReferralLink] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setState('anon'); return }

      const { data: profile } = await supabase
        .from('affiliate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) { setState('no-link'); return }

      const { data: link } = await supabase
        .from('referral_links')
        .select('token')
        .eq('affiliate_id', profile.id)
        .eq('job_id', jobId)
        .single()

      if (link) {
        setReferralLink(`${window.location.origin}/r/${link.token}`)
        setState('has-link')
      } else {
        setState('no-link')
      }
    })
  }, [jobId])

  if (state === 'loading') return null

  if (state === 'has-link' && referralLink) {
    return (
      <div className="bg-vine-50 rounded-xl p-4">
        <p className="text-sm font-medium text-vine-800 mb-2">
          Your referral link earns {feeFormatted} on a successful hire
        </p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-vine-700 bg-vine-100 px-2 py-1 rounded font-mono truncate flex-1">
            {referralLink}
          </code>
          <Link
            href={`/affiliate/jobs/${jobId}`}
            className="text-xs text-vine-700 font-medium hover:underline whitespace-nowrap"
          >
            Manage →
          </Link>
        </div>
      </div>
    )
  }

  if (state === 'no-link') {
    return (
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Earn {feeFormatted} for a successful referral on this role.
        </p>
        <Link
          href={`/affiliate/jobs/${jobId}`}
          className="text-sm text-vine-600 font-medium hover:underline whitespace-nowrap"
        >
          Get your link →
        </Link>
      </div>
    )
  }

  // anon
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-800">
          Earn {feeFormatted} for a successful referral
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Create a free account to get your tracked referral link.
        </p>
      </div>
      <Link
        href={`/register?redirectTo=/affiliate/jobs/${jobId}`}
        className="text-sm px-3 py-1.5 bg-vine-600 text-white rounded-lg hover:bg-vine-700 transition-colors whitespace-nowrap flex-shrink-0"
      >
        Start earning →
      </Link>
    </div>
  )
}
