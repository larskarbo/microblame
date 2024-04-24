import { router } from "../trpc";
import { insightRouter } from "./insight";
import { setupRouter } from "./setup";

export const appRouter = router({
  insight: insightRouter,
  setup: setupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
