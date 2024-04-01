import {
  differenceInSeconds,
  format,
  formatDistanceToNow,
  subMinutes,
  subSeconds,
} from "date-fns";
import {
  getLastProcessedUberTimestamp,
  processBatch,
} from "./clickhouseQueries";
import { everythingRedis } from "./redis";
import { createTracedQueriesTableIfNotExists } from "./createTracedQueriesTable";

process.env.TZ = "UTC";

const redis = everythingRedis;
const processOne = async () => {
  const enabled =
    process.env.TRACED_QUERY_GENERATOR_IS_ENABLED ||
    (await redis.get("traced-queries-generator-enabled"));

  if (enabled !== "1") {
    console.log("Traced queries processing is disabled");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    void processOne();
    return;
  }

  const maxProcessTo = subSeconds(new Date(), 30);

  let lastProcessedTimestamp = await getLastProcessedUberTimestamp();

  if (lastProcessedTimestamp === undefined) {
    console.log("No previous data found. Starting from 30 minutes ago.");
    lastProcessedTimestamp = subMinutes(new Date(), 30);
  }

  const from = lastProcessedTimestamp;

  const { count } = await processBatch({
    fromTime: from,
    toTime: maxProcessTo,
  });

  const lastTimestamp = (await getLastProcessedUberTimestamp()) || new Date(0);
  console.log(
    `Processed ${count} items. Cursor is now at: ${formatDistanceToNowWithSeconds(
      lastTimestamp
    )} ${format(lastTimestamp, "yyyy-MM-dd HH:mm:ss")}`
  );

  await new Promise((resolve) => setTimeout(resolve, 3000));
  void processOne();
};

export const processTracedQueries = () => {
  createTracedQueriesTableIfNotExists();

  processOne();
};

const formatDistanceToNowWithSeconds = (date: Date) => {
  if (differenceInSeconds(new Date(), date) < 60) {
    return `${differenceInSeconds(new Date(), date)} seconds ago`;
  }
  return formatDistanceToNow(date, {
    includeSeconds: true,
    addSuffix: true,
  });
};
