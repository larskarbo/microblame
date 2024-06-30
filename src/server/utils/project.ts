import { PrismaClient } from "@prisma/client";
import { LoggedInUser } from "../models/loggedInUser";

export const ensureUserHasAccessToProject = async ({
  prisma,
  user,
  projectId,
}: {
  prisma: PrismaClient;
  user?: LoggedInUser | null;
  projectId: number;
}) => {
  const project = user?.Team?.Projects.some((project) => {
    return project.id === projectId;
  });

  if (!project) {
    throw new Error("User is not part of project");
  }
};
