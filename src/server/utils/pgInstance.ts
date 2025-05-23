import postgres from "postgres";
import { prisma } from "../../db";
import { LoggedInUser } from "../models/loggedInUser";
import { ensureUserHasAccessToTeam } from "./project";
import { decryptPassword } from "./password";
import { PgInstance } from "@prisma/client";

export const getPostgresJsInstanceIfUserHasAccess = async ({
  instanceUuid,
  user,
}: {
  instanceUuid: string;
  user?: LoggedInUser;
}) => {
  if (!user) {
    throw new Error("User not found");
  }

  const instance = await prisma.pgInstance.findUniqueOrThrow({
    where: {
      uuid: instanceUuid,
    },
  });

  await ensureUserHasAccessToTeam({
    prisma,
    user,
    teamId: instance.teamId,
  });

  const postgresJsInstance = await getPostgresJsInstance({
    instance,
  });

  return postgresJsInstance;
};

export const getPostgresJsInstance = async ({
  instance,
}: {
  instance: PgInstance;
}) => {
  return postgres({
    user: instance.pgUser,
    password: await decryptPassword(instance.pgPasswordEncrypted),
    host: instance.pgHost,
    port: instance.pgPort,
    database: instance.pgDatabase,
    ssl: instance.ssl
      ? {
          rejectUnauthorized: false,
        }
      : false,
    max: 1,
    idle_timeout: 20, // 20 seconds
    max_lifetime: 60 * 2, // 2 minutes
    connection: {
      application_name: "postgresjs-microblame",
    },
  });
};
