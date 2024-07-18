export type SnapshottedQuery = {
  queryid: string;
  query: string;
  calls: number;
  total_exec_time: number;
  min_exec_time: number;
  max_exec_time: number;
  mean_exec_time: number;
  stddev_exec_time: number;
  percentageOfLoad: number;
  timestampUnix: string;
  pgInstanceUuid: string;
};
