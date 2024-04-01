import { clsx } from "clsx";
import { useState } from "react";

import { ChartBarSquareIcon } from "@heroicons/react/24/outline";
import { QueryRow } from "../components/QueryRow";
import { Spinner } from "../components/Spinner";
import { trpc } from "../utils/trpc";
const navigation = [
  {
    name: "Top Postgres Queries",
    href: "/",
    icon: ChartBarSquareIcon,
    current: true,
  },
];

export const Project = () => {
  const [instance, setInstance] = useState<"main" | "readonly">("main");

  const { data, isLoading, refetch, isFetching } =
    trpc.insight.getQueries.useQuery({
      instance,
    });

  const utils = trpc.useUtils();

  const { mutate: resetPgStats, isLoading: isResettingPgStats } =
    trpc.insight.resetPgStats.useMutation({
      onSuccess() {
        void utils.insight.getQueries.invalidate();
        refetch();
      },
    });

  const queries = data?.queries;

  return (
    <div>
      <div className="fixed inset-y-0 z-50 flex flex-col w-72">
        <div className="flex flex-col px-6 overflow-y-auto grow gap-y-5 bg-black/10 ring-1 ring-white/5">
          <div className="flex items-center h-16 shrink-0">
            <div className="font-bold font-mono">
              microblame <span className="font-sans">⚡</span>
            </div>
          </div>
          <nav className="flex flex-col flex-1">
            <ul role="list" className="flex flex-col flex-1 gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isCurrent = true;
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={clsx(
                            isCurrent
                              ? "bg-gray-50 text-gray-600"
                              : "text-gray-700 hover:text-gray-600 hover:bg-gray-50",
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                          )}
                        >
                          <item.icon
                            className={clsx(
                              isCurrent
                                ? "text-gray-600"
                                : "text-gray-400 group-hover:text-gray-600",
                              "h-6 w-6 shrink-0"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>

              <li className="p-4 mt-auto -mx-6 "></li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="pl-72">
        <div className="p-8">
          <div className="">
            <div className="text-xs">
              <select
                value={instance}
                onChange={(e) =>
                  setInstance(e.target.value as "main" | "readonly")
                }
                className="border hover:bg-gray-100 text-gray-900 rounded-md text-xs mb-4"
              >
                <option value="main">Main</option>
                <option value="readonly">Readonly</option>
              </select>
            </div>
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  void resetPgStats({
                    instance,
                  });
                }}
                className="border hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-xs disabled:opacity-50"
                disabled={isResettingPgStats}
              >
                {isResettingPgStats ? "Resetting..." : "Reset pg stats"}
              </button>
              <button
                onClick={() => {
                  void refetch();
                }}
                className="border hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-xs disabled:opacity-50"
                disabled={isFetching || isResettingPgStats}
              >
                Refresh
                {isFetching && "ing..."}
              </button>
            </div>

            {isLoading ? (
              <Spinner />
            ) : (
              <div className="-mx-8 ">
                <table className="w-full max-w-full table-auto border-spacing-4">
                  <thead>
                    <tr className="font-mono font-normal text-left">
                      <th className="w-8 " style={{}}></th>
                      <th></th>
                      <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap ">
                        Instance
                      </th>
                      <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap ">
                        Query
                      </th>
                      <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap">
                        Mean
                      </th>
                      <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap">
                        Total duration
                      </th>
                      <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap">
                        Requests
                      </th>
                      <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap ">
                        Prisma
                      </th>
                      <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap ">
                        TRPC paths
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {queries?.map((requestObject, index) => (
                      <QueryRow key={index} pgRow={requestObject} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="py-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
