// src/pages/api/auth/[...nextAuth].ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { GoogleAuthObj } from "@/server/api/middleware";
import { prisma } from "@/db";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const { email, name } = profile as GoogleAuthObj;

      const existingAccount = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      // Use existing account:
      if (existingAccount) {
        return true;
      }

      // Create new account:
      await prisma.user.create({
        data: {
          name,
          email,
          Team: {
            create: {
              name: "Personal Team",
            },
          },
        },
      });

      return true;
    },
  },
});
