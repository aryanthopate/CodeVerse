import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public and authenticated routes
  const publicRoutes = ['/', '/login', '/signup', '/courses'];
  const authRoutes = ['/dashboard', '/profile', '/notes', '/settings', '/leaderboard'];
  const courseDetailRoutePattern = /^\/courses\/[^/]+(\/[^/]+)?$/;

  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isCourseDetailRoute = courseDetailRoutePattern.test(pathname);

  // Refresh session if expired - important for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  if (session) {
    await supabase.auth.refreshSession();
  }

  // if user is signed in and the current path is login or signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // if user is not signed in and the current path is an authenticated route, redirect to login
  if (!user && isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
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
