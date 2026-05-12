'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardHeader from '@/components/dashboard-header'
import CommissionRow from './commission-row'

const STATUS_TABS = ['pending_verification', 'approved', 'paid', 'disputed', 'pending'] as const
type StatusTab = (typeof STATUS_TABS)[number]

const TAB_LABELS: Record<StatusTab, string> = {
  pending_verification: 'Needs approval',
  approved:             'Approved',
  paid:                 'Paid',
  disputed:             'Disputed',
  pending:              'Pending',
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ jobs: 0, applications: 0, pendingVerification: 0, totalPaid: 0 })
  const [commissions, setCommissions] = useState<any[]>([])
  const [tab, setTab] = useState<StatusTab>('pending_verification')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const [
      { count: jobs },
      { count: applications },
      { count: pendingVerification },
      { data: paidRows },
      { data: comms },
    ] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('commissions').select('id', { count: 'exact', head: true }).eq('status', 'pending_verification'),
      supabase.from('commissions').select('amount').eq('status', 'paid'),
      supabase.from('commissions').select(`
        id, amount, status, commission_type, created_at,
        applications(candidate_name, candidate_email, status, jobs(title)),
        affiliate_profiles(payout_email, users(email))
      `).eq('status', tab).order('created_at', { ascending: false }),
    ])

    const totalPaid = (paidRows ?? []).reduce((sum: number, r: any) => sum + Number(r.amount), 0)
    setStats({ jobs: jobs ?? 0, applications: applications ?? 0, pendingVerification: pendingVerification ?? 0, totalPaid })
    setCommissions(comms ?? [])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={user?.email ?? ''}
        nav={[{ href: '/admin', label: 'Dashboard' }]}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active jobs',       value: stats.jobs },
            { label: 'Applications',      value: stats.applications },
            { label: 'Needs approval',    value: stats.pendingVerification, highlight: stats.pendingVerification > 0 },
            { label: 'Total paid out',    value: fmt(stats.totalPaid) },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`bg-white rounded-xl border px-5 py-4 ${highlight ? 'border-yellow-300' : 'border-gray-200'}`}>
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${highlight ? 'text-yellow-600' : 'text-gray-900'}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Commission queue */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-1 px-6 pt-5 border-b border-gray-100">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === s
                    ? 'text-vine-700 border-b-2 border-vine-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {TAB_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
            ) : commissions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No commissions in this state.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 pr-4 font-medium">Job</th>
                    <th className="text-left pb-2 pr-4 font-medium">Candidate</th>
                    <th className="text-left pb-2 pr-4 font-medium">Affiliate</th>
                    <th className="text-left pb-2 pr-4 font-medium">Amount</th>
                    <th className="text-left pb-2 pr-4 font-medium">Status</th>
                    <th className="text-left pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c: any) => (
                    <CommissionRow key={c.id} commission={c} onUpdate={load} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
