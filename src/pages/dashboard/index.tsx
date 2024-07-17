import { useEffect, useState } from "react";

import { Button } from "../../components/Button";
import Layout from "../../components/layout/Layout";
import { QueryRow } from "../../components/QueryRow";
import { Spinner } from "../../components/Spinner";
import { trpc } from "../../utils/trpc";
import { formatDistanceToNow } from "date-fns";

export const Project = () => {
  const [instanceUuid, setInstanceUuid] = useState<string | null>(null);

  const { data: me } = trpc.me.useQuery();

  useEffect(() => {
    if (instanceUuid === null) {
      const firstInstance = me?.Team?.Projects[0]?.PgInstances[0];
      console.log("firstInstance: ", firstInstance);
      if (firstInstance) {
        setInstanceUuid(firstInstance.uuid);
      }
    }
  }, [me?.Team?.Projects]);

  const { data, error, isLoading, refetch, isFetching } =
    trpc.insight.getQueries.useQuery(
      {
        instanceUuid: instanceUuid || "",
      },
      {
        enabled: !!instanceUuid,
      }
    );

  const utils = trpc.useUtils();

  const { mutate: resetPgStats, isLoading: isResettingPgStats } =
    trpc.insight.resetPgStats.useMutation({
      onSuccess() {
        void utils.insight.getQueries.invalidate();
        refetch();
      },
    });

  const queries = data?.queries;
  const lastReset = data?.lastReset;

  const pgInstances = me?.Team?.Projects[0]?.PgInstances;

  return (
    <Layout>
      <div className="p-8">
        <div className="">
          <div className="text-xs">
            <select
              value={instanceUuid || undefined}
              onChange={(e) => setInstanceUuid(e.target.value)}
              className="border hover:bg-gray-100 text-gray-900 rounded-md text-xs mb-4"
            >
              {pgInstances?.map((pgInstance) => (
                <option key={pgInstance.id} value={pgInstance.uuid}>
                  {pgInstance.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-8">
            <div className="flex gap-4">
              <div>
                <Button
                  onClick={() => {
                    if (!instanceUuid) {
                      return;
                    }
                    void resetPgStats({
                      instanceUuid: instanceUuid,
                    });
                  }}
                  className="border hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-xs disabled:opacity-50"
                  disabled={isResettingPgStats}
                >
                  {isResettingPgStats ? "Resetting..." : "Reset pg stats"}
                </Button>
              </div>
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
            {lastReset && (
              <div className="text-xxs text-gray-500 mt-1">
                Last reset:{" "}
                {formatDistanceToNow(new Date(lastReset), {
                  addSuffix: true,
                })}
              </div>
            )}
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
                      Query
                    </th>
                    <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap">
                      Mean
                    </th>
                    <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap">
                      Total duration
                    </th>
                    <th className="py-2 pr-2 font-normal text-xxs whitespace-nowrap">
                      Calls
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
