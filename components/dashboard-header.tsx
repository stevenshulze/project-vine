import Link from 'next/link'
import LogoutButton from './logout-button'

interface NavLink {
  href: string
  label: string
}

interface Props {
  email: string
  nav?: NavLink[]
}

export default function DashboardHeader({ email, nav = [] }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-xl font-bold text-vine-700">Vine</span>
        {nav.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{email}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
