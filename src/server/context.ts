import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { prisma } from "../db";
import { maybeGetAuthedUser } from "./api/middleware";

export async function createContext(opts: CreateNextContextOptions) {
  const user = await maybeGetAuthedUser({
    req: opts.req,
    prisma,
  });

  return {
    prisma,
    req: opts.req,
    res: opts.res,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
