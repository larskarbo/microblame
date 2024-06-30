import { clickhouseClient } from "../insight/clickhouse";

export const createPgStatActivitySnapshotTableIfNotExists = async () => {
  await clickhouseClient.query({
    query: `
	CREATE TABLE IF NOT EXISTS pg_stat_activity_snapshot
	(
		"instance_uuid" String,
		"datid" Int32,
		"datname" String,
		"pid" Int32,
		"usesysid" Int32,
		"usename" String,
		"application_name" String,
		"client_addr" String,
		"client_hostname" String,
		"client_port" Int32,
		"backend_start" DateTime,
		"xact_start" DateTime,
		"query_start" DateTime,
		"state_change" DateTime,
		"waiting" String,
		"state" String,
		"backend_xid" Int32,
		"backend_xmin" Int32,
		"query" String,
		"snapshot_time" DateTime
	) ENGINE = MergeTree()
	ORDER BY (instance_uuid, snapshot_time);
	`,
  });
};
