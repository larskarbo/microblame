import { z } from "zod";
import { clickhouseClient, clickhouseQuery } from "./clickhouse";
import { groupBy } from "lodash";
import { format } from "date-fns";
import { createHash } from "crypto";
import { removeComments } from "./utils";
import crypto from "node:crypto";
// @ts-ignore
globalThis.crypto ??= crypto.webcrypto;

const spanSchema = z.object({
  dbStatement: z.string().optional(),
  trpcPath: z.string().optional(),
  SpanId: z.string(),
  ParentSpanId: z.string().optional(),
  SpanName: z.string(),
  ServiceName: z.string(),
  TraceId: z.string(),
  SpanAttributes: z.record(z.string()),
  Timestamp: z.string(),
  Duration: z.number(),
});

const emptyToUndefined = (value?: string) => {
  if (value === "") {
    return undefined;
  }
  return value;
};

type Span = z.infer<typeof spanSchema>;
const columns = [
  "SpanAttributes['db.statement'] as dbStatement",
  "SpanAttributes['path'] as trpcPath",
  "SpanId",
  "TraceId",
  "ParentSpanId",
  "SpanName",
  "ServiceName",
  "SpanAttributes",
  "Timestamp",
  "Duration",
];

export const findSingleTracedQueryByQuery = async (query: string) => {
  if (query.startsWith("COPY (select lsn")) {
    return undefined;
  }

  const queryNoWhitespace = query
    .replaceAll(/\s/g, "")
    // dollars to %
    .replaceAll(/\$[0-9]+/g, "%")
    // t0, t1, etc to %
    .replaceAll(/t[0-9]+/g, "%")
    // escape single quotes
    .replaceAll(/'/g, "''");

  const chQuery = `
			SELECT *
			FROM traced_queries
			WHERE replaceRegexpAll(dbStatement, '\\s', '') ILIKE '%${queryNoWhitespace}%'
			LIMIT 1;
	`;
  const items = await clickhouseQuery<UberQuery>(chQuery);
  if (items.length === 0) {
    console.log(`No query found for query:\n${query}\n${chQuery}\n\n`);
  }
  return items[0];
};

export const findSingleTracedQueryByStatementHash = async (
  statementHash: string
) => {
  const chQuery = `
			SELECT *
			FROM traced_queries
			WHERE statementHash = '${statementHash}'
			ORDER BY timestamp DESC
			LIMIT 1;
	`;
  const items = await clickhouseQuery<UberQuery>(chQuery);
  return items[0];
};

export const getLatestAddedTracedQuery = async () => {
  const items = await clickhouseQuery<UberQuery>(
    `SELECT * FROM traced_queries ORDER BY timestamp DESC LIMIT 1;`
  );
  return items[0];
};

export const findSpanByQuery = async (query: string) => {
  const queryNoWhitespace = query
    .replaceAll(/\s/g, "")
    // dollars to %
    .replaceAll(/\$[0-9]+/g, "%")
    // escape single quotes
    .replaceAll(/'/g, "''");

  const chQuery = `
			SELECT *
			FROM signoz_traces.test_mat_view_lars
			WHERE replaceRegexpAll(dbStatement, '\\s', '') ILIKE '%${queryNoWhitespace}%'
			LIMIT 1;
	`;
  const items = await clickhouseQuery<Span>(chQuery);
  return items[0];
};

export type UberQuery = {
  spanID: string;
  traceID: string;
  dbStatement: string;
  statementHash: string;
  trpcSpan: string | undefined;
  prismaSpan: string | undefined;
  httpTarget: string | undefined;
  timestamp: string;
  durationNano: number;
  serviceName: string;
};

export const processBatch = async ({
  fromTime,
  toTime,
}: {
  fromTime: Date;
  toTime?: Date;
}) => {
  const items = await clickhouseQuery<Span>(`
		SELECT ${columns.join(", ")}
		FROM default."otel_traces"
		WHERE Timestamp > '${format(fromTime, "yyyy-MM-dd HH:mm:ss")}'
		${toTime ? `AND Timestamp < '${format(toTime, "yyyy-MM-dd HH:mm:ss")}'` : ""}
		ORDER BY Timestamp ASC
		LIMIT 10000
	`);

  const now = Date.now();
  const itemsByTrace = groupBy(items, (item) => item.TraceId)!;
  const uberQueries: UberQuery[] = [];
  for (const traces of Object.values(itemsByTrace)) {
    const dbTraces = traces.filter(
      (t) => t.SpanName === "prisma:engine:db_query"
    );
    for (const trace of dbTraces) {
      const parentSpans = findParentsPure(traces, [trace], trace);
      const trpcSpan = parentSpans.find((s) => s.SpanName === "trpc-request");
      const prismaSpan = parentSpans.find(
        (s) => s.SpanName === "prisma:client:operation"
      );
      let httpTarget = parentSpans.find((s) => s.SpanAttributes["http.target"])
        ?.SpanAttributes["http.target"];
      if (httpTarget?.startsWith("/api/trpc")) {
        httpTarget = "/api/trpc";
      }
      // remove "?" and everything after it
      httpTarget = httpTarget?.split("?")[0];

      const queryWithoutComment = removeComments(trace.dbStatement!);

      if (queryWithoutComment === "SELECT 1") {
        continue;
      }

      const statementHash = createHash("md5")
        .update(
          queryWithoutComment
            .toLowerCase()
            .replaceAll(/\s/g, "")
            .replaceAll(/'/g, "")
            .replaceAll(/"/g, "")
        )
        .digest("hex")
        .slice(0, 8);

      const uberQuery = {
        spanID: trace.SpanId,
        traceID: trace.TraceId,
        dbStatement: queryWithoutComment,
        statementHash: statementHash,
        trpcSpan: emptyToUndefined(trpcSpan?.trpcPath),
        prismaSpan: emptyToUndefined(prismaSpan?.SpanAttributes.name),
        httpTarget: emptyToUndefined(httpTarget),
        timestamp: trace.Timestamp,
        durationNano: trace.Duration,
        serviceName: trace.ServiceName,
      };
      uberQueries.push(uberQuery);
    }
  }

  const stats = await clickhouseClient.insert({
    table: "traced_queries",
    values: uberQueries,
    format: "JSONEachRow",
  });

  // console.log("insert done after", Date.now() - now, "ms");

  return {
    stats,
    lastInsert: uberQueries[uberQueries.length - 1],
    count: uberQueries.length,
  };
};

export const getLastProcessedUberTimestamp = async () => {
  const items = await clickhouseQuery<{ timestamp: string }>(
    `SELECT timestamp FROM traced_queries ORDER BY timestamp DESC LIMIT 1;`
  );
  return items[0]?.timestamp ? new Date(items[0].timestamp) : undefined;
};

export const findSpanBySpanID = async (spanID: string) => {
  const items = await clickhouseQuery<Span>(`
		SELECT ${columns.join(", ")}
		FROM signoz_traces."distributed_signoz_index_v2"
		WHERE spanID = '${spanID}'
		LIMIT 1;
	`);
  return items[0];
};

const findParentsPure = (
  allSpans: Span[],
  currentTree: Span[],
  span: Span
): Span[] => {
  const parentSpan = allSpans.find((s) => s.SpanId === span.ParentSpanId);
  if (!parentSpan) {
    return currentTree;
  }
  return findParentsPure(allSpans, [parentSpan, ...currentTree], parentSpan);
};
