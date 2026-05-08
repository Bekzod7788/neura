import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/about',
  '/profile(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Role-based access control
  const { userId, sessionClaims } = await auth()
  if (userId) {
    const role = (sessionClaims?.publicMetadata as any)?.role || 'patient'
    const url = new URL(req.url)
    const path = url.pathname

    // Faqat admin, shifokor va bemor uchun ruxsatlar
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    if (path.startsWith('/doctor') && role !== 'doctor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    if (path.startsWith('/patient') && role !== 'patient' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
