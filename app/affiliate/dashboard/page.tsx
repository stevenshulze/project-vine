import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard-header'
import { AFFILIATE_NAV } from '../nav'

const COMM_STYLES: Record<string, string> = {
  pending:              'bg-gray-100 text-gray-600',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  approved:             'bg-blue-100 text-blue-700',
  paid:                 'bg-green-100 text-green-700',
  disputed:             'bg-red-100 text-red-600',
}

const APP_STATUS_STYLES: Record<string, string> = {
  applied:   'bg-blue-50 text-blue-600',
  reviewing: 'bg-yellow-50 text-yellow-600',
  hired:     'bg-vine-50 text-vine-600',
  rejected:  'bg-red-50 text-red-500',
}

export default async function AffiliateDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id, referral_links(id, click_events(id))')
    .eq('user_id', user.id)
    .single()

  const { data: commissions } = profile
    ? await admin
        .from('commissions')
        .select(`
          id, amount, status, commission_type, created_at,
          applications(
            candidate_name, candidate_email, status,
            jobs(title)
          )
        `)
        .eq('affiliate_id', profile.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const activeLinks  = (profile as any)?.referral_links?.length ?? 0
  const totalClicks  = (profile as any)?.referral_links?.reduce(
    (sum: number, l: any) => sum + (l.click_events?.length ?? 0), 0
  ) ?? 0
  const pending  = (commissions ?? [])
    .filter((c: any) => ['pending', 'pending_verification'].includes(c.status))
    .reduce((s: number, c: any) => s + Number(c.amount), 0)
  const earned   = (commissions ?? [])
    .filter((c: any) => ['approved', 'paid'].includes(c.status))
    .reduce((s: number, c: any) => s + Number(c.amount), 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active links',     value: activeLinks },
            { label: 'Total clicks',     value: totalClicks },
            { label: 'Pending earnings', value: fmt(pending),  sub: 'Awaiting hire or approval' },
            { label: 'Total earned',     value: fmt(earned),   sub: 'Approved + paid' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
            </div>
          ))}
        </div>

        {/* Commission pipeline */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Commission pipeline</h2>
          </div>

          {!(commissions ?? []).length ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-1">No commissions yet.</p>
              <p className="text-sm text-gray-400">Share your referral links to start earning.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium">Job</th>
                  <th className="text-left px-4 py-3 font-medium">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium">Application</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(commissions as any[]).map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-800">
                      {c.applications?.jobs?.title ?? '—'}
                      {c.commission_type === 'self_referral' && (
                        <span className="ml-1 text-xs text-orange-400">self-referral</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{c.applications?.candidate_name}</div>
                      <div className="text-xs text-gray-400">{c.applications?.candidate_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${APP_STATUS_STYLES[c.applications?.status] ?? 'bg-gray-50 text-gray-400'}`}>
                        {c.applications?.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {fmt(Number(c.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMM_STYLES[c.status] ?? ''}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
