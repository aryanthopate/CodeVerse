
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // This will refresh the session cookie if it's expired.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  const pathname = request.nextUrl.pathname

  // Protect admin route
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // Not logged in, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      // Not an admin, show 404. We can rewrite to a custom 404 if we had one,
      // for now, Next.js default 404 will be triggered by this rewrite.
      const url = request.nextUrl.clone()
      url.pathname = '/404'
      return NextResponse.rewrite(url)
    }
  }

  // Define authenticated routes prefixes
  const authenticatedRoutes = ['/dashboard', '/chat'];

  // If user is logged in and tries to access login or signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!user && authenticatedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
