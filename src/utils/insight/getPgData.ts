import {
  getTopPgQueries,
  mainPostgres,
  readPostgres,
} from "./pgStatQueries"

export const getPgData = async ({
  order,
  instance,
}: {
  order: "total_exec_time" | "mean_exec_time"
  instance: "main" | "readonly"
}) => {
  const postgresNode =
    instance === "main" ? mainPostgres : readPostgres

  return (
    await getTopPgQueries(postgresNode, {
      limit: 25,
      order,
    })
  ).map(row => {
    return {
      ...row,
      instance,
    }
  })
}
