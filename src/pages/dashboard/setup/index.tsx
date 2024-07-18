import { useState } from "react";
import { Button } from "../../../components/Button";
import Layout from "../../../components/layout/Layout";
import { Spinner } from "../../../components/Spinner";
import { trpc } from "../../../utils/trpc";
import { LoggedInPage } from "../../../components/layout/auth";
import { isBrowser } from "../../../env";
import { InlineCode } from "../../../components/InlineCode";
import Link from "next/link";

const SetupPage = () => {
  const { data: me } = trpc.me.useQuery();

  if (!me) {
    return null;
  }

  const pgInstances = me!.Team!.Projects[0]!.PgInstances;

  return (
    <LoggedInPage>
      <Layout>
        <div className="p-8">
          <h1 className="mb-8 text-3xl font-extrabold">Setup</h1>

          <div className="pb-12 prose-sm prose-gray">
            <h2>Postgres Instances</h2>
            <div className="space-y-4">
              {pgInstances.map((pgInstance) => (
                <div key={pgInstance.id} className="flex gap-4 items-center">
                  <div className="text-sm w-64">{pgInstance.name}</div>
                  <Link
                    href={`/dashboard/setup/pg-instance/${pgInstance.uuid}`}
                    passHref
                    key={pgInstance.id}
                  >
                    <Button>Edit Connection Details</Button>
                  </Link>
                </div>
              ))}

              {pgInstances.length === 0 && (
                <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded-md">
                  No Postgres instances found
                </div>
              )}
            </div>

            <div className="my-4"></div>
            <Link href="/dashboard/setup/pg-instance/new" passHref>
              <Button>New Postgres Instance</Button>
            </Link>

            <h2>Traces</h2>
            <p>
              Send OpenTelemetry traces to
              {isBrowser && (
                <InlineCode>
                  {window.location.protocol}//{window.location.hostname}
                  :4318/v1/traces
                </InlineCode>
              )}
            </p>
            <ClickHouseStatus />
          </div>
        </div>
      </Layout>
    </LoggedInPage>
  );
};

const ClickHouseStatus = () => {
  const [showStats, setShowStats] = useState(false);
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = trpc.setup.clickhouseStatus.useQuery(undefined, {
    enabled: showStats,
  });

  return (
    <div>
      <Button onClick={() => setShowStats(!showStats)}>
        {showStats ? "Hide" : "Show"} nerdy stats
      </Button>
      {showStats && (
        <>
          <h3>Stats</h3>
          <Button onClick={() => refetch()}>Refresh</Button>
          {isLoading ? (
            <Spinner />
          ) : error ? (
            <div className="bg-red-100 text-red-800 text-xs p-2 rounded-md mb-4">
              {error.message}
            </div>
          ) : (
            <ul className=" list-disc">
              <li>
                <InlineCode>otel_traces</InlineCode>: There are{" "}
                <strong>{stats.otelTracesCount}</strong> traces{" "}
                {stats.otelTracesDateRange ? (
                  <>
                    (from <strong>{stats.otelTracesDateRange.min}</strong> to{" "}
                    <strong>{stats.otelTracesDateRange.max}</strong>)
                  </>
                ) : null}{" "}
                in ClickHouse.
              </li>

              <li>
                <InlineCode>traced_queries</InlineCode>: There are{" "}
                <strong>{stats.tracedQueriesCount}</strong> traced queries{" "}
                {stats.tracesDateRange ? (
                  <>
                    (from <strong>{stats.tracesDateRange.min}</strong> to{" "}
                    <strong>{stats.tracesDateRange.max}</strong>)
                  </>
                ) : null}{" "}
                in ClickHouse.
              </li>
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default SetupPage;
