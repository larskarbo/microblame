import { useState } from "react";

import { ChartBarSquareIcon } from "@heroicons/react/24/outline";
import { Button } from "../components/Button";
import Layout from "../components/Layout";
import { QueryRow } from "../components/QueryRow";
import { Spinner } from "../components/Spinner";
import { trpc } from "../utils/trpc";

export const Project = () => {
  const [instance, setInstance] = useState<"main" | "readonly">("main");

  const { data, error, isLoading, refetch, isFetching } =
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
    <Layout>
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
            <Button
              onClick={() => {
                void resetPgStats({
                  instance,
                });
              }}
              className="border hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-xs disabled:opacity-50"
              disabled={isResettingPgStats}
            >
              {isResettingPgStats ? "Resetting..." : "Reset pg stats"}
            </Button>
            <Button
              onClick={() => {
                void refetch();
              }}
              className="border hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-xs disabled:opacity-50"
              disabled={isFetching || isResettingPgStats}
            >
              Refresh
              {isFetching && "ing..."}
            </Button>
          </div>

          {isLoading ? (
            <Spinner />
          ) : error ? (
            <div className="bg-red-100 text-red-800 text-xs p-2 rounded-md mb-4">
              {error.message}
            </div>
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
    </Layout>
  );
};

export default Project;
