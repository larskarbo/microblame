import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { round, truncate } from "lodash";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import { Code } from "./Code";
import { PgRow } from "../utils/insight/pgStatQueries";

export const QueryRow = ({ pgRow: pgRow }: { pgRow: PgRow }) => {
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <>
      <tr
        className={clsx(
          "h-6 font-mono align-top  border-x border-t  cursor-pointer text-xxs hover:bg-gray-50 ",
          isOpen ? " bg-slate-100 border-gray-900" : "border-transparent "
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <td></td>
        <td>
          {isOpen ? (
            <ChevronDownIcon className="w-3 h-3" />
          ) : (
            <ChevronRightIcon className="w-3 h-3" />
          )}
        </td>
        <td>{pgRow.instance}</td>
        <td>
          {truncate(pgRow.query, {
            length: 20,
          })}
        </td>

        <td>
          {pgRow.mean_exec_time ? round(pgRow.mean_exec_time, 1) : null}
          ms
        </td>
        <td>
          {pgRow.total_exec_time ? round(pgRow.total_exec_time) : null}s (
          {pgRow.percentageOfLoad}%)
        </td>
        <td className="pr-2 whitespace-nowrap">{pgRow.calls} calls</td>
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
            items={tracedQueryWithStats?.distinctHttpTargetsWithCount || []}
          />
        </td>
        <td className="pr-2">
          <ItemWithCountPreview
            items={tracedQueryWithStats?.distinctServiceNamesWithCount || []}
          />
        </td>
      </tr>
      {isOpen && (
        <>
          <tr className="text-xxs">
            <td
              colSpan={99}
              className="w-full px-8 pb-4 border-b border-gray-900 border-x bg-slate-100"
            >
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => {}}>
                  <Code
                    className="h-48 overflow-auto whitespace-break-spaces"
                    language="sql"
                    code={sampleTracedQuery?.dbStatement || pgRow.query}
                  />
                </div>
                <div>
                  <div className="font-semibold">Observability data</div>
                  {tracedQueryWithStats ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          Prisma spans:
                          <ItemsTextarea
                            items={
                              tracedQueryWithStats.distinctPrismaSpansWithCount
                            }
                          />
                        </div>
                        <div>
                          TRPC spans:
                          <ItemsTextarea
                            items={
                              tracedQueryWithStats.distinctTRPCSpansWithCount
                            }
                          />
                        </div>
                        <div>
                          Service names:
                          <ItemsTextarea
                            items={
                              tracedQueryWithStats.distinctServiceNamesWithCount
                            }
                          />
                        </div>
                        <div>
                          Http paths:
                          <ItemsTextarea
                            items={
                              tracedQueryWithStats.distinctHttpTargetsWithCount
                            }
                          />
                        </div>
                      </div>
                      <div>
                        Average duration: {tracedQueryWithStats?.avgDurMs} ms
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600">
                      No observability data found
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="pt-4" />
          </tr>
        </>
      )}
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
