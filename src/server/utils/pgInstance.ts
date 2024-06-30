import postgres from "postgres";
import { prisma } from "../../db";
import { LoggedInUser } from "../models/loggedInUser";
import { ensureUserHasAccessToProject } from "./project";
import { decryptPassword } from "./password";

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

  await ensureUserHasAccessToProject({
    prisma,
    user,
    projectId: instance.projectId,
  });

  const postgresJsInstance = postgres({
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
  });

  return postgresJsInstance;
};
