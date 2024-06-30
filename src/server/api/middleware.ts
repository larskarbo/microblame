import { getToken } from "next-auth/jwt";
import { Context } from "../context";
import { NextApiRequest } from "next";
import { PrismaClient } from "@prisma/client";
import { pgInstanceBaseSelect } from "../models/pgInstance";
import { isMultiUser } from "../../components/env";
import { loggedInUserSelect } from "../models/loggedInUser";

export interface GoogleAuthObj {
  name: string;
  email: string;
  picture: string;
  iat: number;
  exp: number;
  jti: string;
}

export const maybeGetAuthedUser = async ({
  req,
  prisma,
}: {
  req: NextApiRequest;
  prisma: PrismaClient;
}) => {
  if (!isMultiUser) {
    const defaultUser = await prisma.user.findFirstOrThrow({
      where: {
        id: 1,
      },
      select: loggedInUserSelect,
    });
    return defaultUser;
  }

  if (req) {
    const token = (await getToken({ req })) as unknown as
      | GoogleAuthObj
      | undefined;

    if (!token) {
      return undefined;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: token.email,
      },
      select: loggedInUserSelect,
    });

    if (!user) {
      return undefined;
    }

    return user;
  } else {
    return undefined;
  }
};

export const requireAuth = async (ctx: Context) => {
  const { user } = ctx;

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
};
