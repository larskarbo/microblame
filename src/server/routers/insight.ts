import { z } from "zod";
import {
  UberQuery,
  findSingleTracedQueryByQuery,
  findSingleTracedQueryByStatementHash,
} from "../../utils/insight/clickhouseQueries";
import { getPgData } from "../../utils/insight/getPgData";
import { everythingRedis } from "../../utils/insight/redis";
import { getTracedQueryWithStats } from "../../utils/insight/tracedQueryWithStats";
import { removeComments } from "../../utils/insight/utils";
import { procedure, router } from "../trpc";
import { mainPostgres, readPostgres } from "../../utils/insight/pgStatQueries";

export const insightRouter = router({
  getQueries: procedure
    .input(
      z.object({
        instance: z.enum(["main", "readonly"]),
      })
    )
    .query(async ({ input }) => {
      const queries = await getPgData({
        order: "total_exec_time",
        instance: input.instance,
      });
      return {
        queries,
      };
    }),

  resetPgStats: procedure
    .input(
      z.object({
        instance: z.enum(["main", "readonly"]),
      })
    )
    .mutation(async ({ input }) => {
      const { instance } = input;
      const postgres = instance === "main" ? mainPostgres : readPostgres;

      await postgres`
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
      const statementHashCached = await everythingRedis.get(
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
        await everythingRedis.set(
          `pg-query-id-to-statement-hash:${queryid}`,
          tracedQuery.statementHash
        );
      }

      // fetchedNum++
      // console.log(
      //   `Fetched ${fetchedNum} of ${queriesThatMatter.length} queries`,
      //   `${!tracedQuery ? chalk.red("(no trace found)") : ""}`,
      //   `${
      //     statementHashCached ? chalk.yellow("(statement hash cached ✨)") : ""
      //   }`
      // )

      return {
        sampleTracedQuery: tracedQuery,
        tracedQueryWithStats,
      };
    }),
});
