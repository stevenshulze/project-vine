import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import DashboardHeader from '@/components/dashboard-header'
import CopyButton from '../copy-button'
import { AFFILIATE_NAV } from '../nav'

const COMM_STYLES: Record<string, string> = {
  pending:              'bg-gray-100 text-gray-500',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  approved:             'bg-blue-100 text-blue-700',
  paid:                 'bg-green-100 text-green-700',
  disputed:             'bg-red-100 text-red-600',
}

export default async function MyPipelinePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const appUrl = `${proto}://${host}`

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: links } = profile
    ? await admin
        .from('referral_links')
        .select(`
          id, token, created_at,
          click_events(id),
          jobs(id, title, commission_amount, location, salary_range, organizations(name))
        `)
        .eq('affiliate_id', profile.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Commissions keyed by referral link ID
  const { data: commissions } = profile
    ? await admin
        .from('commissions')
        .select(`
          id, amount, status,
          applications(candidate_name, candidate_email, status, referral_link_id)
        `)
        .eq('affiliate_id', profile.id)
    : { data: [] }

  const commsByLink: Record<string, any[]> = {}
  for (const c of (commissions ?? []) as any[]) {
    const lid = c.applications?.referral_link_id
    if (lid) {
      commsByLink[lid] = commsByLink[lid] ?? []
      commsByLink[lid].push(c)
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const totalClicks = (links ?? []).reduce((sum: number, l: any) => sum + (l.click_events?.length ?? 0), 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} nav={AFFILIATE_NAV} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Pipeline</h1>
            <p className="text-sm text-gray-400 mt-1">
              {(links ?? []).length} active {(links ?? []).length === 1 ? 'link' : 'links'} · {totalClicks} total clicks
            </p>
          </div>
          <Link href="/affiliate"
            className="text-sm text-vine-600 hover:underline self-center">
            + Discover more jobs
          </Link>
        </div>

        {!(links ?? []).length ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-gray-500 font-medium mb-2">No jobs in your pipeline yet.</p>
            <p className="text-sm text-gray-400 mb-4">Browse available jobs and generate your first referral link.</p>
            <Link href="/affiliate"
              className="px-4 py-2 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors">
              Discover jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(links as any[]).map((link) => {
              const job = link.jobs
              const clicks = link.click_events?.length ?? 0
              const refUrl = `${appUrl}/r/${link.token}`
              const linkComms: any[] = commsByLink[link.id] ?? []

              return (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                  {/* Job header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/affiliate/jobs/${job?.id}`}
                        className="font-semibold text-gray-900 hover:text-vine-700 transition-colors"
                      >
                        {job?.title ?? '—'}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-400">
                        <span>{job?.organizations?.name}</span>
                        {job?.location && <><span>·</span><span>{job.location}</span></>}
                        {job?.salary_range && <><span>·</span><span>{job.salary_range}</span></>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-vine-700">
                        {fmt(Number(job?.commission_amount ?? 0))}
                      </div>
                      <div className="text-xs text-gray-400">referral fee</div>
                    </div>
                  </div>

                  {/* Link + stats row */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <span className="text-xs text-gray-500 font-mono truncate flex-1">{refUrl}</span>
                    <CopyButton url={refUrl} />
                    <span className="text-xs text-gray-400 whitespace-nowrap">{clicks} {clicks === 1 ? 'click' : 'clicks'}</span>
                  </div>

                  {/* Commissions from this link */}
                  {linkComms.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Applications from your link</div>
                      {linkComms.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-gray-800">{c.applications?.candidate_name}</span>
                            <span className="text-gray-400 text-xs ml-2">{c.applications?.candidate_email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 capitalize">
                              {c.applications?.status?.replace('_', ' ')}
                            </span>
                            <span className="font-medium text-gray-900">{fmt(Number(c.amount))}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMM_STYLES[c.status] ?? ''}`}>
                              {c.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {linkComms.length === 0 && (
                    <p className="text-xs text-gray-400">No applications from your link yet. Share it to start earning.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
