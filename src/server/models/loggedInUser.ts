import { Prisma } from "@prisma/client";
import { createSelect, pgInstanceBaseSelect } from "./pgInstance";

export const loggedInUserSelect = createSelect<Prisma.UserSelect>()({
  createdAt: true,
  email: true,
  id: true,
  name: true,
  updatedAt: true,
  teamId: true,
  Team: {
    include: {
      Projects: {
        include: {
          PgInstances: {
            select: pgInstanceBaseSelect,
          },
        },
      },
    },
  },
});

export type LoggedInUser = Prisma.UserGetPayload<{
  select: typeof loggedInUserSelect;
}>;
