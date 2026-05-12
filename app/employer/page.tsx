import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EmployerDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-vine-700">Vine</span>
        <span className="text-sm text-gray-500">{user.email}</span>
      </header>
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employer Dashboard</h1>
        <p className="text-gray-400">Coming soon — post jobs, review applications, and manage commissions.</p>
      </div>
    </main>
  )
}
