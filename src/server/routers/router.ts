import { procedure, router } from "../trpc";
import { insightRouter } from "./insight";
import { projectRouter } from "./project";
import { setupRouter } from "./setup";

export const appRouter = router({
  insight: insightRouter,
  project: projectRouter,

  me: procedure.query(async ({ ctx }) => {
    const { user } = ctx;

    return user || null;
  }),

  setup: setupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
