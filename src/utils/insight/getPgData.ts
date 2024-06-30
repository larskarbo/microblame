import postgres from "postgres";
import { getTopPgQueries } from "./pgStatQueries";

export const getPgData = async ({
  order,
  postgresJsInstance,
}: {
  order: "total_exec_time" | "mean_exec_time";
  postgresJsInstance: postgres.Sql<{}>;
}) => {
  return (
    await getTopPgQueries(postgresJsInstance, {
      limit: 25,
      order,
    })
  ).map((row) => {
    return {
      ...row,
    };
  });
};
