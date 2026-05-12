import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import DashboardHeader from '@/components/dashboard-header'
import ShareButtons from '@/components/share-buttons'
import { AFFILIATE_NAV } from '../nav'
import VineyardManager from './vineyard-manager'

export default async function VineyardManagePage() {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id, username, display_name, vineyard_public')
    .eq('user_id', user.id)
    .single()

  if (!profile?.username) redirect('/affiliate/onboarding')

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const vineyardUrl = `${proto}://${host}/vineyard/${profile.username}`

  // All referral links (jobs they're promoting)
  const { data: links } = await admin
    .from('referral_links')
    .select('job_id, token, click_events(id), jobs(id, title, commission_amount, location, organizations(name))')
    .eq('affiliate_id', profile.id)
    .order('created_at', { ascending: true })

  // Vineyard listing state (active/inactive + sort_order)
  const { data: listings } = await admin
    .from('vineyard_listings')
    .select('job_id, active, sort_order')
    .eq('affiliate_id', profile.id)

  const listingMap: Record<string, { active: boolean; sort_order: number }> = {}
  for (const l of (listings ?? []) as any[]) {
    listingMap[l.job_id] = { active: l.active, sort_order: l.sort_order }
  }

  // Merge: for each link, attach listing state; sort active ones by sort_order
  const jobs = ((links ?? []) as any[]).map((l) => ({
    jobId:     l.job_id,
    token:     l.token,
    clicks:    l.click_events?.length ?? 0,
    title:     l.jobs?.title ?? '—',
    company:   l.jobs?.organizations?.name ?? '',
    location:  l.jobs?.location ?? null,
    fee:       Number(l.jobs?.commission_amount ?? 0),
    active:    listingMap[l.job_id]?.active ?? false,
    sortOrder: listingMap[l.job_id]?.sort_order ?? 999,
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Vineyard</h1>

        {/* Public URL card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Your public page</h2>
            <p className="text-xs text-gray-400 mt-0.5">Share this anywhere — bio links, emails, social media.</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
            <Link href={vineyardUrl} target="_blank" className="text-sm text-vine-700 font-mono truncate flex-1 hover:underline">
              {vineyardUrl}
            </Link>
          </div>
          <ShareButtons url={vineyardUrl} title="My Career Vineyard" company="Vine" />
        </div>

        {/* Job list manager */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-500 font-medium mb-2">No jobs in your pipeline yet.</p>
            <Link href="/affiliate/discover"
              className="text-sm text-vine-600 hover:underline">
              Find jobs to promote →
            </Link>
          </div>
        ) : (
          <VineyardManager jobs={jobs} />
        )}

        {/* Discover CTA */}
        {jobs.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-600">Want to feature more roles?</p>
            <Link href="/affiliate/discover"
              className="text-sm text-vine-600 font-medium hover:underline">
              Find more jobs →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
