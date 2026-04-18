import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });
      return !!existing;
    },
    async jwt({ token, user }) {
      if (token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email as string),
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.userId = dbUser.id;
          token.name = dbUser.name;
          token.city = dbUser.city;
          token.avatarUrl = dbUser.avatarUrl;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      session.user.id = token.userId as string;
      session.user.city = token.city as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
