import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import DashboardHeader from '@/components/dashboard-header'
import { AFFILIATE_NAV } from '../nav'
import ProfileForm from './profile-form'

export default async function AffiliateProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('username, display_name, bio, payout_email, niche_tags, vineyard_public')
    .eq('user_id', user.id)
    .single()

  if (!profile?.username) redirect('/affiliate/onboarding')

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const vineyardUrl = `${proto}://${host}/vineyard/${profile.username}`

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />

      <div className="max-w-lg mx-auto px-4 py-8 space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        <ProfileForm
          profile={{
            username:       profile.username,
            displayName:    profile.display_name ?? null,
            bio:            profile.bio ?? null,
            payoutEmail:    profile.payout_email ?? user.email!,
            nicheTags:      (profile.niche_tags as string[]) ?? [],
            vineyardPublic: profile.vineyard_public ?? true,
            vineyardUrl,
          }}
        />
      </div>
    </main>
  )
}
