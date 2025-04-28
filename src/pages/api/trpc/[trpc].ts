import * as trpcNext from "@trpc/server/adapters/next";
import { createContext } from "@/server/context";
import { appRouter } from "@/server/routers/router";

// export API handler
// @see https://trpc.io/docs/server/adapters
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createContext,
  onError({ error, path, input, ctx }) {
    const errorToLog = (error.cause || error) as Error;

    // log error
    console.error(errorToLog);
  },
});
