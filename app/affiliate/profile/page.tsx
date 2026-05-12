import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard-header'
import { AFFILIATE_NAV } from '../nav'

export default async function AffiliateProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('payout_email, stripe_account_id')
    .eq('user_id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Account</h2>

          <div>
            <div className="text-xs text-gray-400 mb-1">Login email</div>
            <div className="text-sm text-gray-700">{user.email}</div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">Payout email</div>
            <div className="text-sm text-gray-700">
              {(profile as any)?.payout_email ?? user.email}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Commissions will be sent to this address once payouts are live.
            </p>
          </div>

          <div className="pt-1 border-t border-gray-100">
            <div className="text-xs text-gray-400 mb-1">Stripe account</div>
            <div className="text-sm text-gray-400">
              {(profile as any)?.stripe_account_id
                ? (profile as any).stripe_account_id
                : 'Not connected — coming soon'}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
