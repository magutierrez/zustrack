import NextAuth, { type DefaultSession } from 'next-auth';
import Facebook from 'next-auth/providers/facebook';
import Twitter from 'next-auth/providers/twitter';
import Google from 'next-auth/providers/google';
import Strava from 'next-auth/providers/strava';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    provider?: string;
    error?: 'RefreshTokenError';
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

async function refreshStravaToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH_STRAVA_ID,
      client_secret: process.env.AUTH_STRAVA_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }>;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Facebook,
    Twitter,
    Google,
    Strava({
      authorization: {
        params: {
          scope: 'read,read_all,activity:read_all',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // ── Initial sign-in: persist all OAuth fields ──
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // expires_at from NextAuth is a Unix timestamp in seconds
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
        token.id = String(profile?.id ?? account.providerAccountId ?? user?.id ?? token.sub ?? '');
        token.error = undefined;
        return token;
      }

      if (!token.id && token.sub) token.id = token.sub;

      // ── Subsequent calls: refresh Strava token when needed ──
      if (token.provider !== 'strava' || !token.expiresAt || !token.refreshToken) {
        return token;
      }

      // Refresh if expired or expiring within the next hour (per Strava docs)
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (nowSeconds < (token.expiresAt as number) - 3600) {
        // Token still valid for > 1 hour — no refresh needed
        return token;
      }

      try {
        const refreshed = await refreshStravaToken(token.refreshToken as string);
        token.accessToken = refreshed.access_token;
        // Strava may issue a new refresh token — always persist the latest one
        token.refreshToken = refreshed.refresh_token;
        token.expiresAt = refreshed.expires_at;
        token.error = undefined;
      } catch (err) {
        console.error('[auth] Strava token refresh error:', err);
        // Keep the stale token but signal the error to the session/client
        token.error = 'RefreshTokenError' as const;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      session.error = token.error as 'RefreshTokenError' | undefined;
      if (session.user) {
        session.user.id = String(token.id || token.sub || '');
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = ['/login', '/terms', '/privacy'].some((path) =>
        nextUrl.pathname.startsWith(path),
      );
      const isPublicApi = nextUrl.pathname.startsWith('/api/auth');

      if (isPublicPage || isPublicApi) {
        if (isLoggedIn && nextUrl.pathname === '/login') {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
});
