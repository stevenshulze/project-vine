'use client'

import { useState, useTransition } from 'react'
import { approveCommission, disputeCommission, markCommissionPaid } from './actions'

const STATUS_STYLES: Record<string, string> = {
  pending:              'bg-gray-100 text-gray-600',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  approved:             'bg-blue-100 text-blue-700',
  paid:                 'bg-vine-100 text-vine-700',
  disputed:             'bg-red-100 text-red-600',
}

interface Commission {
  id: string
  amount: number
  status: string
  commission_type: string
  created_at: string
  applications: {
    candidate_name: string
    candidate_email: string
    status: string
    jobs: { title: string } | null
  } | null
  affiliate_profiles: {
    payout_email: string | null
    users: { email: string } | null
  } | null
}

interface Props {
  commission: Commission
  onUpdate: () => void
}

export default function CommissionRow({ commission: c, onUpdate }: Props) {
  const [disputing, setDisputing] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const approve = () => startTransition(async () => {
    await approveCommission(c.id)
    onUpdate()
  })

  const confirmDispute = () => startTransition(async () => {
    await disputeCommission(c.id, reason)
    setDisputing(false)
    setReason('')
    onUpdate()
  })

  const markPaid = () => startTransition(async () => {
    await markCommissionPaid(c.id)
    onUpdate()
  })

  const affiliateEmail = c.affiliate_profiles?.users?.email ?? c.affiliate_profiles?.payout_email ?? '—'
  const jobTitle       = c.applications?.jobs?.title ?? '—'
  const candidate      = c.applications?.candidate_name ?? '—'
  const appStatus      = c.applications?.status ?? '—'

  return (
    <>
      <tr className={`border-b border-gray-100 last:border-0 ${isPending ? 'opacity-50' : ''}`}>
        <td className="py-3 pr-4 text-sm text-gray-700">{jobTitle}</td>
        <td className="py-3 pr-4">
          <div className="text-sm text-gray-700">{candidate}</div>
          <div className="text-xs text-gray-400">{c.applications?.candidate_email}</div>
        </td>
        <td className="py-3 pr-4 text-sm text-gray-500">{affiliateEmail}</td>
        <td className="py-3 pr-4">
          <span className="text-sm font-medium text-gray-900">
            ${Number(c.amount).toLocaleString()}
          </span>
          {c.commission_type === 'self_referral' && (
            <span className="ml-1 text-xs text-orange-500">self</span>
          )}
        </td>
        <td className="py-3 pr-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[c.status] ?? ''}`}>
            {c.status.replace('_', ' ')}
          </span>
        </td>
        <td className="py-3">
          <div className="flex gap-2">
            {c.status === 'pending_verification' && (
              <>
                <button onClick={approve}
                  className="text-xs px-2 py-1 bg-vine-600 text-white rounded hover:bg-vine-700 transition-colors">
                  Approve
                </button>
                <button onClick={() => setDisputing(true)}
                  className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors">
                  Dispute
                </button>
              </>
            )}
            {c.status === 'approved' && (
              <button onClick={markPaid}
                className="text-xs px-2 py-1 border border-vine-300 text-vine-700 rounded hover:bg-vine-50 transition-colors">
                Mark paid
              </button>
            )}
          </div>
        </td>
      </tr>

      {disputing && (
        <tr className="border-b border-gray-100 bg-red-50">
          <td colSpan={6} className="py-3 px-4">
            <div className="flex items-center gap-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for dispute…"
                rows={2}
                className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
              <div className="flex flex-col gap-2">
                <button onClick={confirmDispute}
                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                  Confirm dispute
                </button>
                <button onClick={() => { setDisputing(false); setReason('') }}
                  className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
