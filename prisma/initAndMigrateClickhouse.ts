import { clickhouseClient } from "../src/utils/insight/clickhouse";
import { createTracedQueriesTableIfNotExists } from "../src/utils/insight/createTracedQueriesTable";

export const initAndMigrateClickhouse = async () => {
  await createTracedQueriesTableIfNotExists();

  // delete table if exists pg_stat_statements_snapshots
  await clickhouseClient.query({
    query: `
			DROP TABLE IF EXISTS pg_stat_statements_snapshots;
		`,
  });

  await clickhouseClient.query({
    query: `
		CREATE TABLE IF NOT EXISTS pg_stat_statements_snapshots (
			queryid String,
			query String,
			calls UInt32,
			total_exec_time Float64,
			min_exec_time Float64,
			max_exec_time Float64,
			mean_exec_time Float64,
			stddev_exec_time Float64,
			percentageOfLoad Float64,
			timestamp DateTime64,
			pgInstanceUuid String
		) ENGINE = MergeTree()
		ORDER BY
			(timestamp, queryid)
		`,
  });
};
