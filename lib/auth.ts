import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;
        // Povolit přihlášení pro ACTIVE a ONBOARDING (makléři v onboarding procesu)
        if (user.status !== "ACTIVE" && user.status !== "ONBOARDING") return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.status,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar ?? null,
          accountType: user.accountType ?? null,
          onboardingStep: user.onboardingStep,
          onboardingCompleted: user.onboardingCompleted,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.avatar = user.avatar;
        token.accountType = user.accountType;
        token.onboardingStep = user.onboardingStep;
        token.onboardingCompleted = user.onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "";
        session.user.status = (token.status as string) ?? "";
        session.user.firstName = (token.firstName as string) ?? "";
        session.user.lastName = (token.lastName as string) ?? "";
        session.user.avatar = (token.avatar as string | null) ?? null;
        session.user.accountType = (token.accountType as string | null) ?? null;
        session.user.onboardingStep = (token.onboardingStep as number) ?? 1;
        session.user.onboardingCompleted = (token.onboardingCompleted as boolean) ?? false;
      }
      return session;
    },
  },
};
