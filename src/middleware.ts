import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // This will refresh the session cookie if it's expired.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Define public routes
  const publicRoutes = ['/', '/login', '/signup', '/auth/confirm']
  const courseDetailRoutePattern = /^\/courses(\/.*)?$/;

  const isPublicRoute = publicRoutes.includes(pathname) || courseDetailRoutePattern.test(pathname)

  // Define authenticated routes prefix
  const isAuthenticatedRoute = pathname.startsWith('/u/')

  // If user is logged in and tries to access login or signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/u/dashboard', request.url))
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!user && isAuthenticatedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user is not logged in and is on a page that is now inside /u (e.g. /dashboard), redirect to login
  if (!user && (pathname === '/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
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
