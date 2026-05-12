'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types/database'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as UserRole) ?? 'affiliate'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'employer' | 'affiliate'>(
    initialRole === 'employer' ? 'employer' : 'affiliate'
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/login?registered=true')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-vine-700">Vine</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}

          {/* Role selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              {(['employer', 'affiliate'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors capitalize ${
                    role === r
                      ? 'border-vine-600 bg-vine-50 text-vine-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {role === 'employer'
                ? 'Post jobs and pay commissions when candidates are hired.'
                : 'Share referral links and earn commissions on successful hires.'}
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400">At least 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-vine-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
