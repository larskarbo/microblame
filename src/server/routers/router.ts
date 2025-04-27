import { procedure, router } from "../trpc";
import { insightRouter } from "./insight";
import { setupRouter } from "./setup";

export const appRouter = router({
  insight: insightRouter,

  me: procedure.query(async ({ ctx }) => {
    const { user } = ctx;

    return user || null;
  }),

  setup: setupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
