import { clickhouseClient } from "./clickhouse";

export const createTracedQueriesTableIfNotExists = async () => {
  await clickhouseClient.query({
    query: `
	CREATE TABLE IF NOT EXISTS traced_queries (
		spanID String,
		traceID String,
		dbStatement String,
		trpcSpan String,
		prismaSpan String,
		httpTarget String,
		timestamp DateTime,
		durationNano UInt64,
		serviceName String,
		statementHash String,
		INDEX idx_statement_hash statementHash TYPE minmax GRANULARITY 1
	) ENGINE = MergeTree()
	ORDER BY
		(timestamp, traceID)
	TTL timestamp + INTERVAL 3 HOUR;
	`,
  });
};

export const dropTracedQueriesTable = async () => {
  await clickhouseClient.query({
    query: `DROP TABLE IF EXISTS traced_queries;`,
  });

  console.log(`Dropped table traced_queries`);
};
