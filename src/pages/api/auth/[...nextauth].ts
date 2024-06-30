// src/pages/api/auth/[...nextAuth].ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { GoogleAuthObj } from "../../../server/api/middleware";
import { prisma } from "../../../db";

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
