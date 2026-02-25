import NextAuth, { type DefaultSession } from 'next-auth';
import Facebook from 'next-auth/providers/facebook';
import Twitter from 'next-auth/providers/twitter';
import Google from 'next-auth/providers/google';
import Strava from 'next-auth/providers/strava';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    provider?: string;
    user: {
      id: string;
    } & DefaultSession['user'];
  }
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
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        // Ensure id is always a string and prefer profile.id for Strava
        token.id = String(profile?.id || account.providerAccountId || user?.id || token.sub);
      }
      // Ensure token.id is present even if account is not (subsequent calls)
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
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
