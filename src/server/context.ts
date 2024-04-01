import { inferAsyncReturnType } from "@trpc/server"
import { CreateNextContextOptions } from "@trpc/server/adapters/next"

export async function createContext(opts: CreateNextContextOptions) {
  return {
    req: opts.req,
    res: opts.res,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
