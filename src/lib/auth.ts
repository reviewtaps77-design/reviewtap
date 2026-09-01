import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from './db';
import { sanitizeEmail, sanitizePassword } from './security';

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAIL || 'reviewtaps77@gmail.com,admin@reviewtap.in')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isPlatformAdminEmail(email?: string | null) {
  if (!email) return false;
  return PLATFORM_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = sanitizeEmail((credentials?.email as string | undefined) ?? undefined);
        const password = sanitizePassword((credentials?.password as string | undefined) ?? undefined, 8, 128);

        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
          include: { business: true },
        });

        if (!user) return null;

        if (user.role === 'admin' && !isPlatformAdminEmail(user.email)) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.businessId,
          businessSlug: user.business?.slug || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.businessId = (user as any).businessId;
        token.businessSlug = (user as any).businessSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).businessId = token.businessId;
        (session.user as any).businessSlug = token.businessSlug;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8,
  },
  secret: process.env.NEXTAUTH_SECRET,
});
