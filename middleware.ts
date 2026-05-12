import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/auth/callback']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Always allow public paths and referral redirect handler
  if (
    PUBLIC_PATHS.includes(path) ||
    path.startsWith('/r/') ||
    path === '/jobs' ||
    path.startsWith('/jobs/')
  ) {
    return response
  }

  // Unauthenticated — root goes to public job board, everything else to login
  if (!user) {
    if (path === '/') return NextResponse.redirect(new URL('/jobs', request.url))
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch role from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Root redirect → role dashboard
  if (path === '/') {
    const dest = role === 'employer' ? '/employer'
               : role === 'admin'    ? '/admin'
               : '/affiliate'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Guard role-scoped sections
  if (path.startsWith('/employer') && role !== 'employer' && role !== 'admin') {
    return NextResponse.redirect(new URL('/affiliate', request.url))
  }
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
