import { round } from "lodash";
import postgres from "postgres";

export type PgRow = {
  queryid: string;
  query: string;
  calls: number;
  total_exec_time: number;
  min_exec_time: number;
  max_exec_time: number;
  mean_exec_time: number;
  stddev_exec_time: number;
  percentageOfLoad: number;
  timestamp: Date;
};

export const getTopPgQueries = async (
  postgres: postgres.Sql<{}>,
  opts: { limit?: number; order: "total_exec_time" | "mean_exec_time" }
) => {
  const limit = opts?.limit || 100;
  const totalExecTimePromise = getTotalExecTime(postgres);

  const resultPromise = postgres<
    {
      queryid: string;
      query: string;
      calls: string;
      total_exec_time: number;
      min_exec_time: number;
      max_exec_time: number;
      mean_exec_time: number;
      stddev_exec_time: number;
    }[]
  >`
		SELECT
			queryid,
			query,
			calls,
			total_exec_time,
			min_exec_time,
			max_exec_time,
			mean_exec_time,
			stddev_exec_time
		FROM
			pg_stat_statements
		ORDER BY
			${postgres`${postgres(opts.order)} DESC`}
		LIMIT
			${limit}
	`;

  const [totalExecTime, result] = await Promise.all([
    totalExecTimePromise,
    resultPromise,
  ]);

  const pgRows: PgRow[] = result.map((row) => {
    return {
      ...row,
      calls: parseInt(row.calls),
      percentageOfLoad: round((row.total_exec_time / totalExecTime) * 100, 2),
      timestamp: new Date(),
    };
  });

  return pgRows;
};

export const getTotalExecTime = async (postgres: postgres.Sql<{}>) => {
  const result = await postgres<
    {
      total_exec_time: number;
    }[]
  >`
	select sum(total_exec_time) as total_exec_time
	from pg_stat_statements
`;
  const first = result[0];
  if (!first) {
    throw new Error("no result");
  }
  return first.total_exec_time;
};
