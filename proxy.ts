import { auth } from './auth';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/trails')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  const response = intlMiddleware(request);

  const segments = pathname.split('/').filter(Boolean);
  const locale = routing.locales.find((l) => l === segments[0]);

  if (!locale) return response;

  const cleanPath = `/${segments.slice(1).join('/')}`;

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

      loginUrl.searchParams.set('callbackUrl', cleanPath + request.nextUrl.search);

      return NextResponse.redirect(loginUrl);
    }
  }

  if (isLoginPath) {
    const session = await auth();
    if (session?.user) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

      const destination = callbackUrl?.startsWith('/')
        ? `/${locale}${callbackUrl}`
        : `/${locale}/app/setup`;

      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|.*\\.[^/]+$).*)'],
};
