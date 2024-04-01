import { clickhouseQuery } from "./clickhouse";

type TracedQueryStats = {
  dbStatement: string;
  statementHash: string;
  calls: number;
  avgDurMs: number;
  totalDuration: number;
  distinctPrismaSpans: string[];
  distinctTRPCSpans: string[];
  distinctHttpTargets: string[];
  distinctServiceNames: string[];
	firstSeenAt: string;
	lastSeenAt: string;
};

export const getTracedQueriesWithStats = async ({
  statementHash,
}: {
  statementHash?: string;
}) => {
  const rows = await clickhouseQuery<TracedQueryStats>(/* sql */ `
	SELECT
		any(dbStatement) AS dbStatement,
		statementHash,
		count(*) AS calls,
		round(avg(durationNano) / 1000000) AS avgDurMs,
		round(sum(durationNano) / 1000000) AS totalDuration,
		arrayDistinct(groupArray(prismaSpan)) AS distinctPrismaSpans,
		arrayDistinct(groupArray(trpcSpan)) AS distinctTRPCSpans,
		arrayDistinct(groupArray(httpTarget)) AS distinctHttpTargets,
		arrayDistinct(groupArray(serviceName)) AS distinctServiceNames,
		min(timestamp) AS firstSeenAt,
		max(timestamp) AS lastSeenAt
	FROM
		traced_queries
	GROUP BY
		statementHash

	${statementHash ? `HAVING statementHash = '${statementHash}'` : ""}

	ORDER BY
		-- calls DESC
		totalDuration DESC
		-- avgDurMs DESC
	LIMIT 20
	;

	`);

  const rowsWithEmptyItemsInArraysRemoved = rows.map((row) => {
    return {
      ...row,
      distinctPrismaSpans: row.distinctPrismaSpans.filter((a) => a != ""),
      distinctTRPCSpans: row.distinctTRPCSpans.filter((a) => a != ""),
      distinctHttpTargets: row.distinctHttpTargets.filter((a) => a != ""),
      distinctServiceNames: row.distinctServiceNames.filter((a) => a != ""),
    };
  });
  return rowsWithEmptyItemsInArraysRemoved;
};

export const getTracedQueryWithStats = async ({
  statementHash,
}: {
  statementHash?: string;
}) => {
  const queries = await getTracedQueriesWithStats({ statementHash });
  return queries[0];
};
