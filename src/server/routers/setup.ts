import { isNull, omit } from "lodash";
import postgres from "postgres";
import { z } from "zod";
import { prisma } from "../../db";
import { pgInstanceSchema } from "../../pages/dashboard/setup/pg-instance/[pgUuid]";
import { clickhouseQuery } from "../../utils/insight/clickhouse";
import { requireAuth } from "../api/middleware";
import { procedure, router } from "../trpc";
import { decryptPassword, encryptPassword } from "../utils/password";
import { ensureUserHasAccessToTeam } from "../utils/project";

export const setupRouter = router({
  getPgInstance: procedure
    .input(z.object({ pgUuid: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = await requireAuth(ctx);

      const pgInstance = await prisma.pgInstance.findUnique({
        where: {
          uuid: input.pgUuid,
        },
        select: {
          name: true,
          id: true,
          pgDatabase: true,
          pgHost: true,
          pgPort: true,
          pgUser: true,
          teamId: true,
          ssl: true,
          uuid: true,
        },
      });

      if (!pgInstance) {
        throw new Error("PgInstance not found");
      }

      // Check if the user has access to this instance
      if (user?.teamId !== pgInstance.teamId) {
        throw new Error("PgInstance not found");
      }

      return pgInstance;
    }),

  testPgConnection: procedure
    .input(pgInstanceSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await requireAuth(ctx);

      let password = input.pgPassword.newPassword;

      if (!password && input.pgPassword.existingPasswordToPgInstanceUuid) {
        const uuid = input.pgPassword.existingPasswordToPgInstanceUuid;
        const pgInstance = await prisma.pgInstance.findUniqueOrThrow({
          where: {
            uuid: uuid,
          },
        });

        // Check if the user has access to this instance
        if (user?.teamId !== pgInstance.teamId) {
          throw new Error("PgInstance not found");
        }

        password = await decryptPassword(pgInstance.pgPasswordEncrypted);
      }

      if (isNull(password)) {
        throw new Error("Password not provided");
      }

      const postgresJsInstance = postgres({
        user: input.pgUser,
        password: password,
        host: input.pgHost,
        port: input.pgPort,
        database: input.pgDatabase,
        ssl: input.ssl
          ? {
              rejectUnauthorized: false,
            }
          : false,
        max: 1,
        idle_timeout: 20, // 20 seconds
        max_lifetime: 60 * 2, // 2 minutes
        connection: {
          application_name: "postgresjs-microblame-test",
        },
      });

      const canSelect1 = await postgresJsInstance`
				select 1;
			`
        .then(() => {
          return {
            status: "success",
            errorMessage: null,
          };
        })
        .catch(async (err: Error) => {
          await postgresJsInstance.end();
          return {
            status: "error",
            errorMessage: err.message,
          };
        });

      const canUsePgStatStatements = await postgresJsInstance`
				select * from pg_stat_statements limit 1;
			`
        .then(() => {
          return {
            status: "success",
            errorMessage: null,
          };
        })
        .catch(async (err) => {
          await postgresJsInstance.end();
          return {
            status: "error",
            errorMessage: err.message,
          };
        });

      await postgresJsInstance.end();

      return {
        success: true,
        canSelect1,
        canUsePgStatStatements,
      };
    }),

  addPgInstance: procedure
    .input(
      z.object({
        instance: pgInstanceSchema,
        teamId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { instance, teamId } = input;
      const { user } = ctx;

      await ensureUserHasAccessToTeam({
        prisma,
        user,
        teamId,
      });

      const password = instance.pgPassword.newPassword;
      if (isNull(password)) {
        throw new Error("Password not provided");
      }

      return await prisma.pgInstance.create({
        data: {
          ...omit(instance, ["pgPassword"]),
          pgPasswordEncrypted: await encryptPassword(password),
          teamId: input.teamId,
        },
      });
    }),

  updatePgInstance: procedure
    .input(
      z.object({
        uuid: z.string(),
        instance: pgInstanceSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { instance, uuid } = input;
      const { user } = ctx;

      const pgInstance = await prisma.pgInstance.findUniqueOrThrow({
        where: {
          uuid,
        },
      });

      await ensureUserHasAccessToTeam({
        prisma,
        user,
        teamId: pgInstance.teamId,
      });

      return await prisma.pgInstance.update({
        where: {
          uuid,
        },
        data: {
          ...omit(instance, ["pgPassword"]),
          pgPasswordEncrypted: instance.pgPassword.newPassword
            ? await encryptPassword(instance.pgPassword.newPassword)
            : undefined,
        },
      });
    }),

  deletePgInstance: procedure
    .input(z.object({ uuid: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { uuid } = input;
      const { user } = ctx;

      const pgInstance = await prisma.pgInstance.findUniqueOrThrow({
        where: {
          uuid,
        },
      });

      await ensureUserHasAccessToTeam({
        prisma,
        user,
        teamId: pgInstance.teamId,
      });

      return await prisma.pgInstance.delete({
        where: {
          uuid,
        },
      });
    }),

  clickhouseStatus: procedure.query(async () => {
    const simpleQuery = `
			SELECT 1;
		`;
    await clickhouseQuery(simpleQuery).catch((err) => {
      throw new Error(`Cound not connect to Clickhouse...: ${err.message}`);
    });

    const tracedQueriesCount = await clickhouseQuery<{
      "count()": string;
    }>(`
			SELECT count(*)
			FROM traced_queries;
	`).then((items) => {
      return items[0]?.["count()"];
    });

    const otelTracesCount = await clickhouseQuery<{
      "count()": string;
    }>(`
			SELECT count(*)
			FROM otel_traces;
		`).then((items) => {
      return items[0]?.["count()"];
    });

    const tracesDateRange = await clickhouseQuery<{
      "min(timestamp)": string;
      "max(timestamp)": string;
    }>(`
			SELECT min(timestamp), max(timestamp)
			FROM traced_queries;
		`).then((items) => {
      console.log("items: ", items);
      return {
        min: items[0]?.["min(timestamp)"],
        max: items[0]?.["max(timestamp)"],
      };
    });

    const otelTracesDateRange = await clickhouseQuery<{
      "min(Timestamp)": string;
      "max(Timestamp)": string;
    }>(`
			SELECT min(Timestamp), max(Timestamp)
			FROM otel_traces;
		`).then((items) => {
      return {
        min: items[0]?.["min(Timestamp)"],
        max: items[0]?.["max(Timestamp)"],
      };
    });

    return {
      tracedQueriesCount,
      otelTracesCount,
      tracesDateRange,
      otelTracesDateRange,
    };
  }),
});
