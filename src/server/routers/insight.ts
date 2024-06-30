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
      return {
        queries,
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

      await postgresJsInstance`
				select pg_stat_statements_reset();
			`;

      return {
        success: true,
      };
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
