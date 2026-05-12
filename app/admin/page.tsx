import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard-header'

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader email={user.email!} />
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Coming soon — manage all jobs, commissions, payouts, and disputes.</p>
      </div>
    </main>
  )
}
