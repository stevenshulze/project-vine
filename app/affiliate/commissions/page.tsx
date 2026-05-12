import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard-header'

const STATUS_STYLES: Record<string, string> = {
  pending:              'bg-gray-100 text-gray-600',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  approved:             'bg-blue-100 text-blue-700',
  paid:                 'bg-vine-100 text-vine-700',
  disputed:             'bg-red-100 text-red-600',
}

const APP_STATUS_STYLES: Record<string, string> = {
  applied:    'bg-blue-50 text-blue-600',
  reviewing:  'bg-yellow-50 text-yellow-600',
  hired:      'bg-vine-50 text-vine-600',
  rejected:   'bg-red-50 text-red-500',
}

const NAV = [
  { href: '/affiliate', label: 'Jobs' },
  { href: '/affiliate/commissions', label: 'Commissions' },
  { href: '/affiliate/profile', label: 'Profile' },
]

export default async function AffiliateCommissionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: commissions } = profile
    ? await admin
        .from('commissions')
        .select(`
          id, amount, status, commission_type, created_at,
          applications(
            candidate_name, candidate_email, status, applied_at,
            jobs(title, commission_amount)
          )
        `)
        .eq('affiliate_id', profile.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Also fetch referral links without commissions (clicked but no application yet)
  const { data: links } = profile
    ? await admin
        .from('referral_links')
        .select('id, token, job_id, created_at, click_events(id), jobs(title)')
        .eq('affiliate_id', profile.id)
    : { data: [] }

  const linkedJobIds = new Set((commissions ?? []).map((c: any) => c.applications?.jobs?.title))

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const totalPending  = (commissions ?? []).filter((c: any) => ['pending','pending_verification'].includes(c.status))
    .reduce((s: number, c: any) => s + Number(c.amount), 0)
  const totalApproved = (commissions ?? []).filter((c: any) => ['approved','paid'].includes(c.status))
    .reduce((s: number, c: any) => s + Number(c.amount), 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={NAV} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-400">Pending: <span className="font-semibold text-yellow-600">{fmt(totalPending)}</span></span>
            <span className="text-gray-400">Earned: <span className="font-semibold text-vine-600">{fmt(totalApproved)}</span></span>
          </div>
        </div>

        {/* Commission pipeline */}
        {!(commissions ?? []).length ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-2">No commissions yet.</p>
            <p className="text-sm text-gray-400">Generate referral links and share them to start earning.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Job</th>
                  <th className="text-left px-4 py-3 font-medium">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium">Application</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                {(commissions as any[]).map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${APP_STATUS_STYLES[c.applications?.status] ?? ''}`}>
                        {c.applications?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {fmt(Number(c.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status] ?? ''}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Active links with no application yet */}
        {(links ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Active links <span className="text-gray-400 font-normal text-sm">({(links ?? []).length})</span>
            </h2>
            <div className="space-y-2">
              {(links as any[]).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-700">{l.jobs?.title ?? l.job_id}</span>
                  <span className="text-gray-400">{l.click_events?.length ?? 0} clicks</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
