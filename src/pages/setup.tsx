import { useState } from "react";
import { Button } from "../components/Button";
import Layout from "../components/Layout";
import { Spinner } from "../components/Spinner";
import { trpc } from "../utils/trpc";

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1 py-0.5 mx-1 bg-gray-700 text-gray-50 rounded">
    {children}
  </code>
);

const PostgresTester = ({ instance }: { instance: "main" | "readonly" }) => {
  const { data, mutate: testUri } =
    trpc.setup.testPostgresConnection.useMutation({});

  return (
    <div className="mb-2">
      <div className="flex gap-4 text-xs items-center">
        <div>{instance === "main" ? "Main" : "Readonly"} PG</div>
        <Button
          onClick={() =>
            testUri({
              instance: "main",
            })
          }
        >
          Test Connection
        </Button>
      </div>
      {data && (
        <ul className="text-xs font-medium list-disc">
          {data.canSelect1.status === "success" ? (
            <li className="text-green-800">Connection successful ✅</li>
          ) : (
            <li className="text-red-500">
              Connection failed. {data.canSelect1.errorMessage}
            </li>
          )}

          {data.canSelect1.status === "success" && (
            <>
              {data.canUsePgStatStatements.status === "success" ? (
                <li className="text-green-800">
                  Was able to query pg_stat_statements ✅
                </li>
              ) : (
                <>
                  <li className="text-red-500">
                    Could not query pg_stat_statements. (
                    <strong className="text-red-600">
                      {data.canUsePgStatStatements.errorMessage}
                    </strong>
                    ).
                  </li>
                  <ul className=" list-disc ">
                    <li>
                      Make sure you have the <code>pg_stat_statements</code>{" "}
                      extension enabled.
                    </li>
                    <InlineCode>
                      CREATE EXTENSION pg_stat_statements;
                    </InlineCode>
                    <li>
                      Make sure your user has the necessary permissions to query{" "}
                      <code>pg_stat_statements</code>.
                    </li>
                    <InlineCode>
                      GRANT pg_stat_statements TO your_user;
                    </InlineCode>
                  </ul>
                </>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

const isBrowser = typeof window !== "undefined";

const SetupPage = () => {
  return (
    <Layout>
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-extrabold">Setup</h1>

        <div className="pb-12 prose-sm prose-gray">
          <h2>Postgres</h2>
          <PostgresTester instance="main" />
          <PostgresTester instance="readonly" />

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
