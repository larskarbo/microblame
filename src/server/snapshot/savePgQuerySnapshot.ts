import { clickhouseClient } from "../../utils/insight/clickhouse";
import { PgRow } from "../../utils/insight/pgStatQueries";

export const savePgQuerySnapshot = async ({
  pgRows,
  pgInstanceUuid,
}: {
  pgRows: PgRow[];
  pgInstanceUuid: string;
}) => {
  clickhouseClient.insert({
    table: "pg_stat_statements_snapshots",
    values: pgRows.map((row) => ({
      ...row,
      pgInstanceUuid,
    })),
    format: "JSONEachRow",
    clickhouse_settings: {
      async_insert: 1,
    },
  });
};
