import { router } from "../trpc"
import { insightRouter } from "./insight"

export const appRouter = router({
  insight: insightRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
