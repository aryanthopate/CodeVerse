import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/courses', '/auth/confirm'];
  const courseDetailRoutePattern = /^\/courses\/[^/]+(\/[^/]+)?$/;

  // Authenticated routes start with /u/
  const isAuthRoute = pathname.startsWith('/u/');
  
  const isPublicRoute = publicRoutes.includes(pathname) || courseDetailRoutePattern.test(pathname);
  
  // if user is signed in and the current path is login or signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/u/dashboard', request.url))
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
