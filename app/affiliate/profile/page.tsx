import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard-header'

export default async function AffiliateProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('*, referral_links(id, click_events(id))')
    .eq('user_id', user.id)
    .single()

  const { data: commissions } = profile
    ? await admin
        .from('commissions')
        .select('amount, status')
        .eq('affiliate_id', profile.id)
    : { data: [] }

  const totalLinks    = (profile as any)?.referral_links?.length ?? 0
  const totalClicks   = (profile as any)?.referral_links?.reduce(
    (sum: number, l: any) => sum + (l.click_events?.length ?? 0), 0
  ) ?? 0
  const pendingEarnings  = (commissions ?? [])
    .filter((c: any) => ['pending', 'pending_verification'].includes(c.status))
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0)
  const approvedEarnings = (commissions ?? [])
    .filter((c: any) => ['approved', 'paid'].includes(c.status))
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0)

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={user.email!}
        nav={[{ href: '/affiliate', label: 'Jobs' }, { href: '/affiliate/profile', label: 'Profile' }]}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Active links',    value: totalLinks },
            { label: 'Total clicks',    value: totalClicks },
            { label: 'Pending earnings', value: fmt(pendingEarnings) },
            { label: 'Paid earnings',   value: fmt(approvedEarnings) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Account</h2>
          <div>
            <div className="text-xs text-gray-400 mb-1">Email</div>
            <div className="text-sm text-gray-700">{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Payout email</div>
            <div className="text-sm text-gray-700">{(profile as any)?.payout_email ?? user.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Stripe account</div>
            <div className="text-sm text-gray-400">
              {(profile as any)?.stripe_account_id ?? 'Not connected — coming soon'}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
