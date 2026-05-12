'use client'

import { useTransition } from 'react'
import { updateApplicationStatus } from '../../actions'

const STATUS_STYLES: Record<string, string> = {
  applied:    'bg-blue-50 text-blue-700',
  reviewing:  'bg-yellow-50 text-yellow-700',
  hired:      'bg-vine-50 text-vine-700',
  rejected:   'bg-red-50 text-red-600',
}

interface Props {
  application: {
    id: string
    candidate_name: string
    candidate_email: string
    status: string
    is_self_referral: boolean
    referral_link_id: string | null
    resume_url: string | null
  }
  onUpdate: () => void
}

export default function ApplicationRow({ application: app, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition()

  const setStatus = (status: string) => {
    startTransition(async () => {
      await updateApplicationStatus(app.id, status)
      onUpdate()
    })
  }

  return (
    <tr className={`border-b border-gray-100 last:border-0 ${isPending ? 'opacity-50' : ''}`}>
      <td className="py-3 pr-4">
        <div className="font-medium text-gray-900 text-sm">{app.candidate_name}</div>
        <div className="text-xs text-gray-400">{app.candidate_email}</div>
      </td>
      <td className="py-3 pr-4">
        {app.referral_link_id ? (
          <span className="text-xs text-vine-600">
            {app.is_self_referral ? '⚠ self-referral' : '✓ referred'}
          </span>
        ) : (
          <span className="text-xs text-gray-400">direct</span>
        )}
      </td>
      <td className="py-3 pr-4">
        {app.resume_url ? (
          <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-vine-600 hover:underline">
            Resume
          </a>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[app.status] ?? ''}`}>
          {app.status}
        </span>
      </td>
      <td className="py-3">
        {app.status !== 'hired' && app.status !== 'rejected' && (
          <div className="flex gap-2">
            {app.status === 'applied' && (
              <button onClick={() => setStatus('reviewing')}
                className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Review
              </button>
            )}
            <button onClick={() => setStatus('hired')}
              className="text-xs px-2 py-1 rounded bg-vine-600 text-white hover:bg-vine-700 transition-colors">
              Hire
            </button>
            <button onClick={() => setStatus('rejected')}
              className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              Reject
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
