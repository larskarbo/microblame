import { clickhouseQuery } from "./clickhouse";

type TracedQueryStats = {
  dbStatement: string;
  statementHash: string;
  calls: number;
  avgDurMs: number;
  totalDuration: number;
  distinctPrismaSpansWithCount: [string, string][];
  distinctTRPCSpansWithCount: [string, string][];
  distinctHttpTargetsWithCount: [string, string][];
  distinctServiceNamesWithCount: [string, string][];
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
		arrayMap((x, y) -> (x, y),
        (arrayReduce(
            'sumMap',
            [(groupArrayArray([prismaSpan]) as arrPrismaSpan)],
            [arrayResize(CAST([], 'Array(UInt64)'), length(arrPrismaSpan), toUInt64(1))]
        ) as sPrismaSpan).1,
        sPrismaSpan.2
    ) distinctPrismaSpansWithCount,
		arrayMap((x, y) -> (x, y),
				(arrayReduce(
						'sumMap',
						[(groupArrayArray([trpcSpan]) as arrTRPCSpan)],
						[arrayResize(CAST([], 'Array(UInt64)'), length(arrTRPCSpan), toUInt64(1))]
				) as sTRPCSpan).1,
				sTRPCSpan.2
		) distinctTRPCSpansWithCount,
		arrayMap((x, y) -> (x, y),
				(arrayReduce(
						'sumMap',
						[(groupArrayArray([httpTarget]) as arrHttpTarget)],
						[arrayResize(CAST([], 'Array(UInt64)'), length(arrHttpTarget), toUInt64(1))]
				) as sHttpTarget).1,
				sHttpTarget.2
		) distinctHttpTargetsWithCount,
		arrayMap((x, y) -> (x, y),
				(arrayReduce(
						'sumMap',
						[(groupArrayArray([serviceName]) as arrServiceName)],
						[arrayResize(CAST([], 'Array(UInt64)'), length(arrServiceName), toUInt64(1))]
				) as sServiceName).1,
				sServiceName.2
		) distinctServiceNamesWithCount,
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

  const rowsWithItemsSorted = rows.map((row) => {
    return {
      ...row,
      distinctHttpTargetsWithCount: filterAndSort(
        row.distinctHttpTargetsWithCount
      ),
      distinctPrismaSpansWithCount: filterAndSort(
        row.distinctPrismaSpansWithCount
      ),
      distinctTRPCSpansWithCount: filterAndSort(row.distinctTRPCSpansWithCount),
      distinctServiceNamesWithCount: filterAndSort(
        row.distinctServiceNamesWithCount
      ),
    };
  });
  return rowsWithItemsSorted;
};

const filterAndSort = (arr: [string, string][]) =>
  arr
    .map(([a, b]) => ({
      name: a,
      count: parseInt(b),
    }))
    .sort((a, b) => b.count - a.count)
    .filter((x) => x.name !== "");

export const getTracedQueryWithStats = async ({
  statementHash,
}: {
  statementHash?: string;
}) => {
  const queries = await getTracedQueriesWithStats({ statementHash });
  return queries[0];
};
