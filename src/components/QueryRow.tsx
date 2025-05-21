import { XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { round } from "lodash";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import { Code } from "./Code";
import { PgRow } from "../utils/insight/pgStatQueries";
import { SnapshottedQuery } from "../server/snapshot/snapshottedQuery";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../server/routers/router";

export const QueryRow = ({
  pgRow: pgRow,
}: {
  pgRow: PgRow & {
    lastSnapshottedQuery?: SnapshottedQuery;
  };
}) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const { data, isLoading, isError } = trpc.insight.getTracedQuery.useQuery(
    {
      query: pgRow.query,
      queryid: pgRow.queryid,
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );
  const tracedQueryWithStats = data?.tracedQueryWithStats;
  const sampleTracedQuery = data?.sampleTracedQuery;

  let callsPerMinute = null;

  if (pgRow.lastSnapshottedQuery) {
    const lastSnapshottedQuery = pgRow.lastSnapshottedQuery;
    const lastSnapshottedQueryTimestamp = new Date(
      parseInt(lastSnapshottedQuery.timestampUnix)
    ).getTime();
    const queryTimestamp = pgRow.timestamp.getTime();
    const timeDiff = queryTimestamp - lastSnapshottedQueryTimestamp;
    const callsDiff = pgRow.calls - lastSnapshottedQuery.calls;
    callsPerMinute = (callsDiff / (timeDiff / 1000)) * 60;
  }

  return (
    <>
      <tr
        className={clsx(
          "h-6 font-mono align-top cursor-pointer text-xxs hover:bg-gray-50",
          isOverlayOpen ? "bg-slate-100" : ""
        )}
        onClick={() => setIsOverlayOpen(true)}
      >
        <td></td>
        <td></td>
        <td className="select-none truncate max-w-xs overflow-hidden pr-6">
          {pgRow.query}
        </td>
        <td>
          {pgRow.mean_exec_time ? round(pgRow.mean_exec_time, 1) : null}
          ms
        </td>
        <td>
          {pgRow.total_exec_time ? round(pgRow.total_exec_time) : null}s (
          {pgRow.percentageOfLoad}%)
        </td>
        <td className="pr-2 whitespace-nowrap">
          <>{pgRow.calls} </>{" "}
          {callsPerMinute !== null ? (
            <> ({round(callsPerMinute, 0)} calls/min)</>
          ) : null}
        </td>
        <td className="pr-2">
          {isError ? (
            <div className="text-red-500">Error</div>
          ) : isLoading ? (
            <div
              className="inline-block h-2 w-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            ></div>
          ) : null}
          <ItemWithCountPreview
            items={tracedQueryWithStats?.distinctPrismaSpansWithCount || []}
          />
        </td>
        <td className="pr-2">
          <ItemWithCountPreview
            items={tracedQueryWithStats?.distinctTRPCSpansWithCount || []}
          />
        </td>
      </tr>
      {isOverlayOpen && (
        <QueryDetailsOverlay
          onClose={() => setIsOverlayOpen(false)}
          pgRow={pgRow}
          tracedQueryWithStats={tracedQueryWithStats}
          sampleTracedQuery={sampleTracedQuery}
        />
      )}
      {/* Transparent overlay for closing */}
      {isOverlayOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsOverlayOpen(false)}
          aria-label="Close overlay"
        />
      )}
    </>
  );
};

const QueryDetailsOverlay = ({
  onClose,
  pgRow,
  tracedQueryWithStats,
  sampleTracedQuery,
}: {
  onClose: () => void;
  pgRow: PgRow & { lastSnapshottedQuery?: SnapshottedQuery };
  tracedQueryWithStats: any;
  sampleTracedQuery: any;
}) => {
  const simplifyQueryMutation = trpc.ai.simplifyQuery.useMutation({});
  const queryToSimplify = sampleTracedQuery?.dbStatement || pgRow.query;
  return (
    <>
      {/* Transparent overlay for closing */}
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
        aria-label="Close overlay"
      />
      {/* Overlay panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-3xl md:w-[75vw] z-50 bg-white border-l border-gray-200 shadow-xl overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="font-bold text-lg">Query Details</div>
          <button onClick={onClose} className="hover:opacity-70">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {/* Query stats */}
          <div className="flex flex-wrap gap-6 text-xs text-gray-700">
            <div>
              <span className="font-semibold">Mean exec time:</span>{" "}
              {pgRow.mean_exec_time
                ? `${round(pgRow.mean_exec_time, 1)} ms`
                : "-"}
            </div>
            <div>
              <span className="font-semibold">Total duration:</span>{" "}
              {pgRow.total_exec_time
                ? `${round(pgRow.total_exec_time)} s`
                : "-"}
            </div>
            <div>
              <span className="font-semibold">Calls:</span> {pgRow.calls}
            </div>
            <div>
              <span className="font-semibold">% of load:</span>{" "}
              {pgRow.percentageOfLoad}%
            </div>
          </div>
          {/* Query preview full width */}
          <div>
            <Code
              className="h-48 overflow-auto whitespace-break-spaces text-[10px] w-full"
              language="sql"
              code={sampleTracedQuery?.dbStatement || pgRow.query}
            />
          </div>
          {simplifyQueryMutation.data?.simplifiedSql && (
            <div>
              <Code
                className="h-48 overflow-auto whitespace-break-spaces text-[10px] w-full"
                language="sql"
                code={simplifyQueryMutation.data.simplifiedSql}
              />
            </div>
          )}
          {/* Observability data */}
          <div>
            <div className="font-semibold">Observability data</div>
            {tracedQueryWithStats ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    Prisma spans:
                    <ItemsTextarea
                      items={tracedQueryWithStats.distinctPrismaSpansWithCount}
                    />
                  </div>
                  <div>
                    TRPC spans:
                    <ItemsTextarea
                      items={tracedQueryWithStats.distinctTRPCSpansWithCount}
                    />
                  </div>
                  <div>
                    Service names:
                    <ItemsTextarea
                      items={tracedQueryWithStats.distinctServiceNamesWithCount}
                    />
                  </div>
                  <div>
                    Http paths:
                    <ItemsTextarea
                      items={tracedQueryWithStats.distinctHttpTargetsWithCount}
                    />
                  </div>
                </div>
                <div>Average duration: {tracedQueryWithStats?.avgDurMs} ms</div>
              </>
            ) : (
              <div className="text-gray-600">No observability data found</div>
            )}
          </div>
          <div>
            <button
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              onClick={() =>
                simplifyQueryMutation.mutate({ query: queryToSimplify })
              }
              disabled={simplifyQueryMutation.isPending}
            >
              {simplifyQueryMutation.isPending
                ? "Simplifying..."
                : "Simplify Query"}
            </button>
            {simplifyQueryMutation.isError && (
              <div className="text-red-500 mt-2">
                {simplifyQueryMutation.error.message}
              </div>
            )}
            {simplifyQueryMutation.data?.shortDescription && (
              <div className="mt-4 p-2 bg-gray-50 border rounded text-sm whitespace-pre-line">
                {simplifyQueryMutation.data.shortDescription}
              </div>
            )}
            {simplifyQueryMutation.data?.simplifiedSql && (
              <div className="mt-4 p-2 bg-gray-50 border rounded text-sm whitespace-pre-line">
                {simplifyQueryMutation.data.simplifiedSql}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const ItemWithCountPreview = ({
  items,
}: {
  items: {
    name: string;
    count: number;
  }[];
}) => {
  return (
    <div>
      {items?.[0] && (
        <div>
          {items?.[0].name}
          {items.length > 1 && (
            <span className="text-gray-600"> (+{items.length - 1})</span>
          )}
        </div>
      )}
    </div>
  );
};

const ItemsTextarea = ({
  items,
}: {
  items: { name: string; count: number }[];
}) => {
  return (
    <textarea
      className="w-full h-24"
      readOnly
      value={items.map((item) => `${item.name} (${item.count})`).join("\n")}
    />
  );
};
