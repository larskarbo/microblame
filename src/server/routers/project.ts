import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "../../db";
import { requireAuth } from "../api/middleware";
import { procedure, router } from "../trpc";

const projectNameSchema = z
  .string()
  .min(4)
  .refine(
    (value) => {
      const lowercaseHyphenAndNumberRegex = /^[a-z0-9-]*$/;
      return lowercaseHyphenAndNumberRegex.test(value);
    },
    {
      message:
        "Input should be in lowercase, contain only hyphens, and numbers",
    }
  );

export const projectRouter = router({
  createProject: procedure
    .input(
      z.object({
        name: projectNameSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await requireAuth(ctx);

      const project = await prisma.project.create({
        data: {
          name: input.name,
          teamId: user.teamId,
        },
      });

      return project;
    }),

  getProject: procedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = await requireAuth(ctx);

      const project = await prisma.project.findUnique({
        where: {
          name: input.projectId,
        },
        include: {
          Team: {
            include: {
              Members: true,
            },
          },
        },
      });

      if (project?.teamId !== userId.teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this project",
        });
      }

      return project;
    }),
});
