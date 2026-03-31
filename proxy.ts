import { auth } from './auth';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let Next.js auth callbacks and public API routes pass through
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/trails')) {
    return NextResponse.next();
  }

  // Protect all other API routes — require an active session
  if (pathname.startsWith('/api/')) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Detect locale segment at the start of the path
  const locale = routing.locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);

  // No locale prefix yet → let intl middleware redirect to add it (e.g. / → /en/)
  // Auth will be checked on the next request once the locale is in the URL
  if (!locale) {
    return intlMiddleware(request);
  }

  // Strip locale prefix to get the clean path for auth checks
  const cleanPath = pathname.slice(locale.length + 1) || '/';

  const isLoginPath = cleanPath.startsWith('/app/login');

  const isPublicPath =
    cleanPath === '/' ||
    cleanPath.startsWith('/terms') ||
    cleanPath.startsWith('/privacy') ||
    cleanPath.startsWith('/trail') ||
    isLoginPath;

  if (!isPublicPath) {
    const session = await auth();
    if (!session?.user) {
      const loginUrl = new URL(`/${locale}/app/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Already logged in → skip the login page, honour callbackUrl if present
  if (isLoginPath) {
    const session = await auth();
    if (session?.user) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      const destination =
        callbackUrl?.startsWith('/') ? callbackUrl : `/${locale}/app/setup`;
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude: Next.js internals and any path with a file extension
  // (e.g. /og.png, /favicon.ico, /robots.txt, /sitemap.xml, ...)
  matcher: ['/((?!_next|.*\\.[^/]+$).*)'],
};
