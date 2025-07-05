import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) throw new Error("No user found");
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Log login activity when user signs in
      if (user && user.id) {
        try {
          const { createUserSession, logUserActivity } = await import('@/lib/analytics');
          
          // Create session with basic info (we'll get more details from client)
          const sessionId = await createUserSession(parseInt(user.id), {
            device: 'Unknown',
            browser: 'Unknown'
          });
          
          // Log login activity
          await logUserActivity(parseInt(user.id), sessionId, {
            activityType: 'LOGIN',
            description: 'User logged in',
            pageUrl: '/login'
          });
        } catch (error) {
          console.error('Error logging login activity:', error);
          // Don't fail login if logging fails
        }
      }
      return true;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
};