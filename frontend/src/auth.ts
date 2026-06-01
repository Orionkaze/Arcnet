import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { setAuthCookies } from "@/lib/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

        if (!dbUser) {
          const gProfile = profile as { given_name?: string; family_name?: string } | undefined;
          const givenName = gProfile?.given_name || user.name?.split(" ")[0] || "User";
          const familyName = gProfile?.family_name || user.name?.split(" ").slice(1).join(" ") || "";
          
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              firstName: givenName,
              lastName: familyName,
              isVerified: true,
              isOnboarded: false,
              avatar: user.image,
            },
          });
        }

        // Set our own custom JWT cookies
        await setAuthCookies(dbUser.id);

        return true;
      }
      return false;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
  },
});
