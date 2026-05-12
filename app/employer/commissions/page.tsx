import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard-header'

const STATUS_STYLES: Record<string, string> = {
  pending:              'bg-gray-100 text-gray-500',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  approved:             'bg-blue-100 text-blue-700',
  paid:                 'bg-green-100 text-green-700',
  disputed:             'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  pending:              'Pending hire',
  pending_verification: 'Awaiting approval',
  approved:             'Approved — payment due',
  paid:                 'Paid',
  disputed:             'Disputed',
}

export default async function EmployerCommissionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: org } = await admin
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  let commissions: any[] = []

  if (org) {
    const { data: jobs } = await admin
      .from('jobs')
      .select('id, title')
      .eq('org_id', org.id)

    const jobIds = jobs?.map((j: any) => j.id) ?? []

    if (jobIds.length > 0) {
      const { data: apps } = await admin
        .from('applications')
        .select('id')
        .in('job_id', jobIds)

      const appIds = apps?.map((a: any) => a.id) ?? []

      if (appIds.length > 0) {
        const { data } = await admin
          .from('commissions')
          .select(`
            id, amount, status, created_at,
            applications(candidate_name, candidate_email, status, jobs(title)),
            affiliate_profiles(payout_email)
          `)
          .in('application_id', appIds)
          .order('created_at', { ascending: false })

        commissions = data ?? []
      }
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const totalOwed = commissions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  const totalPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  const totalPending = commissions
    .filter((c) => ['pending', 'pending_verification'].includes(c.status))
    .reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={user.email!}
        nav={[
          { href: '/employer', label: 'Jobs' },
          { href: '/employer/commissions', label: 'Commissions' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Payment due',    value: fmt(totalOwed),    note: 'Approved, not yet paid' },
            { label: 'In pipeline',    value: fmt(totalPending), note: 'Pending hire or approval' },
            { label: 'Total paid out', value: fmt(totalPaid),    note: 'All time' },
          ].map(({ label, value, note }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-400 mt-1">{note}</div>
            </div>
          ))}
        </div>

        {/* Commission table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">All commissions</h2>

          {commissions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No commissions yet. They appear here when affiliates refer candidates to your jobs.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 pr-4 font-medium">Job</th>
                  <th className="text-left pb-2 pr-4 font-medium">Candidate</th>
                  <th className="text-left pb-2 pr-4 font-medium">Affiliate</th>
                  <th className="text-left pb-2 pr-4 font-medium">Amount</th>
                  <th className="text-left pb-2 pr-4 font-medium">App status</th>
                  <th className="text-left pb-2 font-medium">Commission status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissions.map((c: any) => (
                  <tr key={c.id} className="text-sm">
                    <td className="py-3 pr-4 text-gray-700 font-medium">
                      {(c.applications as any)?.jobs?.title ?? '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-gray-800">{(c.applications as any)?.candidate_name}</div>
                      <div className="text-xs text-gray-400">{(c.applications as any)?.candidate_email}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {(c.affiliate_profiles as any)?.payout_email ?? '—'}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-900">
                      {fmt(Number(c.amount))}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs capitalize text-gray-500">
                        {(c.applications as any)?.status?.replace('_', ' ') ?? '—'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status] ?? ''}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
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
