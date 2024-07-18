import { prisma } from "../../db";
import { savePgQuerySnapshot } from "../../server/snapshot/savePgQuerySnapshot";
import { getPostgresJsInstance } from "../../server/utils/pgInstance";
import { getPgData } from "../insight/getPgData";

export const takeQuerySnapshots = async () => {
  const instances = await prisma.pgInstance.findMany({});
  console.log(
    "Fetching query snapshots for instances: ",
    instances.map((instance) => instance.name)
  );

  for (const instance of instances) {
    try {
      const postgresJsInstance = await getPostgresJsInstance({ instance });

      const queries = await getPgData({
        order: "total_exec_time",
        postgresJsInstance,
      });

			void postgresJsInstance.end();

      await savePgQuerySnapshot({
        pgRows: queries,
        pgInstanceUuid: instance.uuid,
      });
    } catch (e) {
      console.log(
        `Failed to get query snapshot for instance ${instance.uuid}`,
        {
          error: e,
        }
      );
    }
  }
};
