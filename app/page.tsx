import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-vine-50 to-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-vine-100">
        <span className="text-2xl font-bold text-vine-700">Vine</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-vine-700 hover:text-vine-800"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-vine-600 rounded-lg hover:bg-vine-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-24">
        <h1 className="text-5xl font-bold text-vine-800 mb-4 tracking-tight">
          Hire on performance.
          <br />
          Pay only when it works.
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-10">
          Employers post jobs with referral fees. Affiliates share tracked links
          and earn commissions — but only when a hire is made.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/register?role=employer"
            className="px-6 py-3 bg-vine-600 text-white rounded-lg font-medium hover:bg-vine-700 transition-colors"
          >
            Post a job
          </Link>
          <Link
            href="/register?role=affiliate"
            className="px-6 py-3 border border-vine-200 text-vine-700 rounded-lg font-medium hover:bg-vine-50 transition-colors"
          >
            Become an affiliate
          </Link>
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Vine. All rights reserved.
      </footer>
    </main>
  )
}
