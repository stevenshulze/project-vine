import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export default async function VineyardPage({ params }: { params: { username: string } }) {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('affiliate_profiles')
    .select('id, username, display_name, bio, niche_tags, vineyard_public')
    .eq('username', params.username)
    .single()

  if (!profile || !profile.vineyard_public) notFound()

  // Fetch active vineyard listings with job + referral link data
  const { data: listings } = await admin
    .from('vineyard_listings')
    .select('id, sort_order, job_id, jobs(id, title, commission_amount, location, salary_range, location_type, organizations(name))')
    .eq('affiliate_id', profile.id)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  // Get referral tokens for each listed job
  const jobIds = (listings ?? []).map((l: any) => l.job_id)
  const { data: links } = jobIds.length
    ? await admin
        .from('referral_links')
        .select('job_id, token')
        .eq('affiliate_id', profile.id)
        .in('job_id', jobIds)
    : { data: [] }

  const tokenMap: Record<string, string> = {}
  for (const l of (links ?? []) as any[]) tokenMap[l.job_id] = l.token

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const tags: string[] = (profile as any).niche_tags ?? []

  return (
    <main className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <Link href="/jobs" className="text-sm font-semibold text-vine-700">Vine</Link>
      </div>

      <div className="max-w-xl mx-auto px-5 py-10 space-y-8">

        {/* Profile section */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-vine-100 text-vine-700 text-xl font-bold flex items-center justify-center mx-auto">
            {((profile as any).display_name ?? params.username).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {(profile as any).display_name ?? params.username}
            </h1>
            {(profile as any).bio && (
              <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
                {(profile as any).bio}
              </p>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-vine-50 text-vine-700 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Jobs */}
        {!(listings ?? []).length ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No open roles right now. Check back soon.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 text-center font-medium uppercase tracking-wide">
              Open roles
            </p>
            {(listings as any[]).map((listing) => {
              const job = listing.jobs
              if (!job) return null
              const token = tokenMap[listing.job_id]
              const applyHref = token ? `/r/${token}` : `/jobs/${job.id}`

              return (
                <div key={listing.id}
                  className="rounded-2xl border border-gray-200 p-5 hover:border-vine-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-base">{job.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-sm text-gray-400">
                        {job.organizations?.name && (
                          <span className="text-gray-600">{job.organizations.name}</span>
                        )}
                        {job.location && (
                          <><span>·</span><span>{job.location}</span></>
                        )}
                        {job.salary_range && (
                          <><span>·</span><span>{job.salary_range}</span></>
                        )}
                      </div>
                    </div>
                    <Link
                      href={applyHref}
                      className="flex-shrink-0 px-4 py-2 bg-vine-600 text-white text-sm font-medium rounded-xl hover:bg-vine-700 transition-colors"
                    >
                      Apply
                    </Link>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-vine-600 font-medium">
                      {fmt(Number(job.commission_amount))} referral fee
                    </span>
                    {job.location_type && (
                      <span className="text-xs text-gray-400 capitalize">{job.location_type}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Know someone perfect for one of these roles?{' '}
            <Link href="/register" className="text-vine-600 hover:underline">
              Earn a referral fee →
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}
