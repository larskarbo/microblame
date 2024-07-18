import { clickhouseClient } from "../src/utils/insight/clickhouse";
import { createTracedQueriesTableIfNotExists } from "../src/utils/insight/createTracedQueriesTable";

export const initAndMigrateClickhouse = async () => {
  await createTracedQueriesTableIfNotExists();

  //   delete table if exists pg_stat_statements_snapshots
  await clickhouseClient.query({
    query: `
  			DROP TABLE IF EXISTS pg_stat_statements_snapshots;
  		`,
  });

  // delete table if exists pg_stat_activity_snapshot
  await clickhouseClient.query({
    query: `
  			DROP TABLE IF EXISTS pg_stat_activity_snapshot;
  		`,
  });

  await clickhouseClient.query({
    query: `
	CREATE TABLE IF NOT EXISTS pg_stat_activity_snapshot
	(
		instance_uuid String,
		datid Int32,
		datname String,
		pid Int32,
		usesysid Int32,
		usename String,
		application_name String,
		client_addr String,
		client_hostname String,
		client_port Int32,
		backend_start DateTime,
		xact_start DateTime,
		query_start DateTime,
		state_change DateTime,
		waiting String,
		state String,
		backend_xid Int32,
		backend_xmin Int32,
		query String,
		timestamp DateTime64
	) ENGINE = MergeTree()
	ORDER BY (instance_uuid, timestamp)
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
			instance_uuid String
		) ENGINE = MergeTree()
		ORDER BY
			(timestamp, queryid)
		`,
  });
};
