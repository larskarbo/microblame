import { PrismaClient } from "@prisma/client";
import { LoggedInUser } from "../models/loggedInUser";

export const ensureUserHasAccessToTeam = async ({
  prisma,
  user,
  teamId,
}: {
  prisma: PrismaClient;
  user?: LoggedInUser | null;
  teamId: number;
}) => {
  if (!user || user.teamId !== teamId) {
    throw new Error("User is not part of team");
  }
};
