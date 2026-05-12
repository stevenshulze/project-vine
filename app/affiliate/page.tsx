import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import DashboardHeader from '@/components/dashboard-header'
import JobList from './job-list'

export default async function AffiliateDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Derive app URL from request headers so it works on any deployment
  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = `${proto}://${host}`

  const { data: jobs } = await admin
    .from('jobs')
    .select('*, organizations(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: links } = profile
    ? await admin
        .from('referral_links')
        .select('job_id, token, click_events(id)')
        .eq('affiliate_id', profile.id)
    : { data: [] }

  const linkMap: Record<string, { token: string; clicks: number }> = {}
  for (const l of (links ?? []) as any[]) {
    linkMap[l.job_id] = { token: l.token, clicks: l.click_events?.length ?? 0 }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={user.email!}
        nav={[
          { href: '/affiliate', label: 'Jobs' },
          { href: '/affiliate/commissions', label: 'Commissions' },
          { href: '/affiliate/profile', label: 'Profile' },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Available Jobs
          <span className="text-base font-normal text-gray-400 ml-2">({jobs?.length ?? 0})</span>
        </h1>
        <JobList jobs={(jobs ?? []) as any} linkMap={linkMap} appUrl={appUrl} />
      </div>
    </main>
  )
}
