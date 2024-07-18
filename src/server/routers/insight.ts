import { z } from "zod";
import {
  UberQuery,
  findSingleTracedQueryByQuery,
  findSingleTracedQueryByStatementHash,
} from "../../utils/insight/clickhouseQueries";
import { getPgData } from "../../utils/insight/getPgData";
import { redisInstance } from "../../utils/insight/redis";
import { getTracedQueryWithStats } from "../../utils/insight/tracedQueryWithStats";
import { removeComments } from "../../utils/insight/utils";
import { procedure, router } from "../trpc";
import { getPostgresJsInstanceIfUserHasAccess } from "../utils/pgInstance";
import { getErrorMessage } from "../../components/utils";
import { TRPCError } from "@trpc/server";
import { savePgQuerySnapshot } from "../snapshot/savePgQuerySnapshot";
import { clickhouseQuery } from "../../utils/insight/clickhouse";
import { SnapshottedQuery } from "../snapshot/snapshottedQuery";

export const insightRouter = router({
  getQueries: procedure
    .input(
      z.object({
        instanceUuid: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx;

      const postgresJsInstance = await getPostgresJsInstanceIfUserHasAccess({
        instanceUuid: input.instanceUuid,
        user,
      });

      const queries = await getPgData({
        order: "total_exec_time",
        postgresJsInstance,
      });

      const queriesWithLastSnapshottedQuery = await Promise.all(
        queries.map(async (query) => {
          const lastSnapshottedQuery = await clickhouseQuery<SnapshottedQuery>(`
						SELECT *, toUnixTimestamp64Milli(timestamp) as timestampUnix from pg_stat_statements_snapshots
						WHERE queryid = '${query.queryid}'
						and pgInstanceUuid = '${input.instanceUuid}'
						and timestamp > now() - INTERVAL 1 HOUR
						ORDER BY timestamp DESC
						LIMIT 1
						`);

          return {
            ...query,
            lastSnapshottedQuery: lastSnapshottedQuery[0],
          };
        })
      );

      const lastResetRaw = await postgresJsInstance<
        {
          stats_reset: string;
        }[]
      >`
				SELECT * FROM public.pg_stat_statements_info();
				`;

      const lastReset = lastResetRaw[0]?.stats_reset;

      await savePgQuerySnapshot({
        pgRows: queries,
        pgInstanceUuid: input.instanceUuid,
      });

      return {
        queries: queriesWithLastSnapshottedQuery,
        lastReset: lastReset ? new Date(lastReset) : null,
      };
    }),

  resetPgStats: procedure
    .input(
      z.object({
        instanceUuid: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const postgresJsInstance = await getPostgresJsInstanceIfUserHasAccess({
        instanceUuid: input.instanceUuid,
        user,
      });

      try {
        await postgresJsInstance`
					select pg_stat_statements_reset();
				`;
        return {
          success: true,
        };
      } catch (err) {
        const message = getErrorMessage(err);
        console.log("message: ", message);
        if (
          message === "permission denied for function pg_stat_statements_reset"
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Reset failed, make sure you have permission to call pg_stat_statements_reset()",
          });
        }
        throw err;
      }
    }),

  getTracedQuery: procedure
    .input(
      z.object({
        query: z.string(),
        queryid: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, queryid } = input;

      const queryWithoutComment = removeComments(query);
      const statementHashCached = await redisInstance.get(
        `pg-query-id-to-statement-hash:${queryid}`
      );

      const tracedQuery = (
        statementHashCached
          ? await findSingleTracedQueryByStatementHash(statementHashCached)
          : await Promise.race([
              await findSingleTracedQueryByQuery(queryWithoutComment),
              new Promise((resolve) => {
                setTimeout(() => {
                  console.log("timeout");
                  resolve(null);
                }, 20_000);
              }),
            ])
      ) as UberQuery | null;

      const tracedQueryWithStats = tracedQuery
        ? await getTracedQueryWithStats({
            statementHash: tracedQuery.statementHash,
          })
        : undefined;

      if (tracedQuery) {
        await redisInstance.set(
          `pg-query-id-to-statement-hash:${queryid}`,
          tracedQuery.statementHash
        );
      }

      return {
        sampleTracedQuery: tracedQuery,
        tracedQueryWithStats,
      };
    }),
});
