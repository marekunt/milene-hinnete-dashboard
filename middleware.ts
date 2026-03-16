import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check for Supabase auth cookie (project ref: nulbcmixjewxklarvndp)
  const hasSession =
    request.cookies.has('sb-nulbcmixjewxklarvndp-auth-token') ||
    request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  if (!hasSession && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
