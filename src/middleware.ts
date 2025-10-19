import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public and authenticated routes
  const publicRoutes = ['/', '/login', '/signup', '/courses', '/courses/.*']; // Landing page, auth pages, and course info are public
  const authRoutes = ['/dashboard', '/profile', '/notes', '/settings', '/leaderboard'];

  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('/.*')) {
      return new RegExp(`^${route.replace('.*', '(/.*)?')}$`).test(request.nextUrl.pathname);
    }
    return request.nextUrl.pathname === route;
  });
  
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname);

  // if user is signed in and the current path is login or signup, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // if user is not signed in and the current path is an authenticated route, redirect to login
  if (!user && isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Refresh session
  await supabase.auth.getSession();
  
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
