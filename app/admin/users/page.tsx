'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardHeader from '@/components/dashboard-header'

const ROLE_STYLES: Record<string, string> = {
  employer:  'bg-blue-100 text-blue-700',
  affiliate: 'bg-vine-100 text-vine-700',
  admin:     'bg-purple-100 text-purple-700',
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [{ data: { user } }, { data }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
      ])
      setCurrentUser(user)
      setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        email={currentUser?.email ?? ''}
        nav={[
          { href: '/admin', label: 'Commissions' },
          { href: '/admin/jobs', label: 'Jobs' },
          { href: '/admin/users', label: 'Users' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <span className="text-sm text-gray-400">{users.length} total</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u: any) => (
                  <tr key={u.id} className="text-sm hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-800">{u.email}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLES[u.role] ?? 'bg-gray-100 text-gray-500'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs">{fmt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
