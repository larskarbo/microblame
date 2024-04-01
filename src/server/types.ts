import { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import { AppRouter } from "./routers/router"

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>
