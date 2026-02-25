import { auth } from './auth';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let Next.js auth callbacks pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Detect locale segment at the start of the path
  const locale = routing.locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  // No locale prefix yet → let intl middleware redirect to add it (e.g. / → /en/)
  // Auth will be checked on the next request once the locale is in the URL
  if (!locale) {
    return intlMiddleware(request);
  }

  // Strip locale prefix to get the clean path for auth checks
  const cleanPath = pathname.slice(locale.length + 1) || '/';

  const isPublicPath =
    cleanPath === '/' ||
    cleanPath.startsWith('/terms') ||
    cleanPath.startsWith('/privacy') ||
    cleanPath.startsWith('/app/login');

  if (!isPublicPath) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/${locale}/app/login`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
