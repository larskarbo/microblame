import { initTRPC } from "@trpc/server";
import { Context } from "./context";

const t = initTRPC.context<Context>().create({
  errorFormatter({ error, shape }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      return {
        message: "Something went wrong!",
        code: shape.code,
        data: {},
      };
    }

    return shape;
  },
});

// Base router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;
