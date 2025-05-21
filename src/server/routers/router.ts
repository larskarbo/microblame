import { procedure, router } from "../trpc";
import { insightRouter } from "./insight";
import { setupRouter } from "./setup";
import { aiRouter } from "./ai";

export const appRouter = router({
  insight: insightRouter,
  ai: aiRouter,

  me: procedure.query(async ({ ctx }) => {
    const { user } = ctx;

    return user || null;
  }),

  setup: setupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
