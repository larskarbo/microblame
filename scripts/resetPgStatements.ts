import { readPostgres } from "../src/utils/insight/pgStatQueries";

export const resetPgStatements = async () => {
  const postgres = readPostgres;
  await postgres`select pg_stat_statements_reset();`;
};
