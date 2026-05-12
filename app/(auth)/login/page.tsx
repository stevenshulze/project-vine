'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const redirectTo = searchParams.get('redirectTo') ?? '/'
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-vine-700">Vine</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {searchParams.get('registered') === 'true' && (
          <div className="bg-vine-50 text-vine-700 text-sm p-3 rounded-lg">
            Account created! Check your email to confirm, then sign in.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-vine-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
