import { z } from "zod";
import { mainPostgres, readPostgres } from "../../utils/insight/pgStatQueries";
import { procedure, router } from "../trpc";
import { clickhouseQuery } from "../../utils/insight/clickhouse";

export const setupRouter = router({
  testPostgresConnection: procedure
    .input(
      z.object({
        instance: z.enum(["main", "readonly"]),
      })
    )
    .mutation(async ({ input }) => {
      const pg = input.instance === "main" ? mainPostgres : readPostgres;

      const canSelect1 = await pg`
				select 1;
			`
        .then(() => {
          return {
            status: "success",
            errorMessage: null,
          };
        })
        .catch((err: Error) => {
          return {
            status: "error",
            errorMessage: err.message,
          };
        });

      const canUsePgStatStatements = await pg`
				select * from pg_stat_statements limit 1;
			`
        .then(() => {
          return {
            status: "success",
            errorMessage: null,
          };
        })
        .catch((err) => {
          return {
            status: "error",
            errorMessage: err.message,
          };
        });

      return {
        success: true,
        canSelect1,
        canUsePgStatStatements,
      };
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
