import { prisma } from "../../db";
import { getPostgresJsInstance } from "../../server/utils/pgInstance";
import { createPgStatActivitySnapshotTableIfNotExists } from "./createPgStatActivitySnapshotTable";
import { clickhouseClient } from "../insight/clickhouse";
import postgres from "postgres";

const start = async () => {
  console.log(`Starting pg_stat_activity snapshot worker`);

  await createPgStatActivitySnapshotTableIfNotExists();

  const getSnapshot = async () => {
    const instances = await prisma.pgInstance.findMany({});
    console.log(
      "Fetching snapshots for instances: ",
      instances.map((instance) => instance.name)
    );

    for (const instance of instances) {
      const pg = await getPostgresJsInstance({ instance });

      const snapshot = await pg<
        {
          datid: number;
          datname: string;
          pid: number;
          usesysid: number;
          usename: string;
          application_name: string;
          client_addr: string;
          client_hostname: string;
          client_port: number;
          backend_start: Date;
          xact_start: Date;
          query_start: Date;
          state_change: Date;
          wait_event_type: string;
          wait_event: string;
          state: string;
          backend_xid: number;
          backend_xmin: number;
          query: string;
        }[]
      >`
        SELECT
          datid,
          datname,
          pid,
          usesysid,
          usename,
          application_name,
          client_addr,
          client_hostname,
          client_port,
          backend_start,
          xact_start,
          query_start,
          state_change,
          wait_event_type,
          wait_event,
          state,
          backend_xid,
          backend_xmin,
          query
        FROM pg_stat_activity;
      `;

      console.log(
        `Inserting ${snapshot.length} rows for instance ${instance.uuid}`
      );

      await clickhouseClient.insert({
        table: "pg_stat_activity_snapshot",
        values: snapshot.map((row) => ({
          instance_uuid: instance.uuid,
          ...row,
          waiting:
            row.wait_event_type !== null || row.wait_event !== null
              ? "true"
              : "false",
          snapshot_time: new Date(),
        })),
        format: "JSONEachRow",
      });
    }
  };

  void getSnapshot();
  setInterval(() => {
    void getSnapshot();
  }, 60_000);
  //   60_000);
};

// @ts-ignore
await start().catch((err) => {
  console.error(err);
  process.exit(1);
});