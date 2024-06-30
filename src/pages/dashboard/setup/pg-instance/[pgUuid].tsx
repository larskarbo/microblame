import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../../../components/layout/Layout";
import { LoggedInPage } from "../../../../components/layout/auth";
import { trpc } from "../../../../utils/trpc";

import { z } from "zod";
import { Button } from "../../../../components/Button";
import { InlineCode } from "../../../../components/InlineCode";
import { Input } from "../../../../components/Input";
import { zodStringOrNumberToNumber } from "../../../../components/utils";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const parseConnectionString = (
  connectionString: string
): Partial<PgInstance> => {
  // Replace 'postgres://' with 'http://' to make it compatible with the URL constructor
  const modifiedConnectionString = connectionString
    .replace(/^postgres:\/\//, "http://")
    .replace(/^postgresql:\/\//, "http://");
  const url = new URL(modifiedConnectionString);
  console.log("url: ", url);

  const ssl = url.searchParams.get("sslmode") === "require";
  const pgUser = url.username;
  const pgPassword = url.password;
  const pgHost = url.hostname;
  const pgPort = parseInt(url.port, 10);
  const pgDatabase = url.pathname.slice(1);

  return {
    pgUser,
    pgPassword: {
      existingPasswordToPgInstanceUuid: null,
      newPassword: pgPassword,
    },
    pgHost,
    pgPort,
    pgDatabase,
    ssl,
  };
};

const SetupPage = () => {
  const { data: me } = trpc.me.useQuery();
  const router = useRouter();
  const { pgUuid } = router.query;
  console.log("pgUuid: ", pgUuid);

  if (!me) {
    return "Not authenticated";
  }

  if (!pgUuid) {
    return "No pgUuid";
  }

  return (
    <LoggedInPage>
      <Layout>
        <div className="p-8">
          <h1 className="mb-8 text-3xl font-extrabold">Setup</h1>

          <div className="pb-12 prose-sm prose-gray">
            <h2 className="mb-4">Postgres Instance</h2>

            <NewPostgresInstanceForm pgUuid={pgUuid as string} />
          </div>
        </div>
      </Layout>
    </LoggedInPage>
  );
};

export default SetupPage;

export const pgInstanceSchema = z.object({
  name: z.string(),
  pgUser: z.string(),
  pgPassword: z.object({
    existingPasswordToPgInstanceUuid: z.string().nullable(),
    newPassword: z.string().nullable(),
  }),
  pgHost: z.string(),
  pgPort: zodStringOrNumberToNumber,
  pgDatabase: z.string(),
  ssl: z.boolean(),
});

type PgInstance = z.infer<typeof pgInstanceSchema>;

const NewPostgresInstanceForm = ({ pgUuid }: { pgUuid: string }) => {
  const { data: me } = trpc.me.useQuery();

  const [connectionString, setConnectionString] = useState("");

  const router = useRouter();

  const { mutate: addPgInstance, isLoading: isAddingPgInstance } =
    trpc.setup.addPgInstance.useMutation({
      onSuccess: () => {
        router.push("/dashboard/setup");
      },
    });
  const { mutate: updatePgInstance, isLoading: isUpdatingPgInstance } =
    trpc.setup.updatePgInstance.useMutation();
  const {
    data: testResult,
    mutate: testPgConnection,
    isLoading: isTestingPgConnection,
  } = trpc.setup.testPgConnection.useMutation();

  const { data: pgInstance, error } = trpc.setup.getPgInstance.useQuery(
    {
      pgUuid: pgUuid as string,
    },
    {
      enabled: pgUuid !== "new",
    }
  );

  const [workingPginstace, setWorkingPgInstance] = useState<PgInstance>({
    name: "",
    pgUser: "",
    pgPassword: {
      existingPasswordToPgInstanceUuid: null,
      newPassword: "",
    },
    pgHost: "",
    pgPort: 5432,
    pgDatabase: "",
    ssl: false,
  });

  useEffect(() => {
    if (pgInstance) {
      setWorkingPgInstance({
        ...pgInstance,
        pgPassword: {
          existingPasswordToPgInstanceUuid: pgInstance.uuid,
          newPassword: null,
        },
      });
    }
  }, [pgInstance]);

  if (error) {
    return <div className="text-red-500">{error.message}</div>;
  }

  return (
    <div className="max-w-xl flex flex-col gap-4">
      <div>
        <div>Name</div>
        <div>
          <Input
            placeholder="Name"
            onChange={(e) => {
              setWorkingPgInstance({
                ...workingPginstace,
                name: e.target.value,
              });
            }}
            value={workingPginstace.name}
          />
        </div>
      </div>
      <div className="px-4 py-4 my-2 border bg-slate-100">
        <div className="flex items-center gap-1 mb-2">
          <ClipboardDocumentIcon className="w-3 h-3" />
          Paste connection string
        </div>
        <div className="flex space-x-4">
          <Input
            placeholder="postgres://user:password@host:port/database?sslmode=require"
            onChange={(e) => {
              setConnectionString(e.target.value);
            }}
            value={connectionString}
          />
          <Button
            disabled={connectionString === ""}
            onClick={() => {
              try {
                const parsedInstance = parseConnectionString(connectionString);
                setWorkingPgInstance((w) => ({
                  ...w,
                  ...parsedInstance,
                }));
              } catch (error) {
                toast.error("Failed to parse connection string");
              }
            }}
          >
            Parse
          </Button>
        </div>
      </div>
      <div>
        <div>Username</div>
        <div>
          <Input
            placeholder="Username"
            onChange={(e) => {
              setWorkingPgInstance({
                ...workingPginstace,
                pgUser: e.target.value,
              });
            }}
            value={workingPginstace.pgUser}
          />
        </div>
      </div>
      <div>
        <div>Password</div>
        <div>
          {workingPginstace.pgPassword.existingPasswordToPgInstanceUuid ? (
            <div className="flex space-x-4">
              <Input
                type="text"
                placeholder="Password"
                readOnly
                disabled
                value={"[hidden]"}
                className="font-mono"
              />
              <Button
                className="whitespace-nowrap"
                onClick={() => {
                  setWorkingPgInstance({
                    ...workingPginstace,
                    pgPassword: {
                      existingPasswordToPgInstanceUuid: null,
                      newPassword: "",
                    },
                  });
                }}
              >
                Change password
              </Button>
            </div>
          ) : (
            <Input
              type="password"
              placeholder="Password"
              onChange={(e) => {
                setWorkingPgInstance({
                  ...workingPginstace,
                  pgPassword: {
                    newPassword: e.target.value,
                    existingPasswordToPgInstanceUuid: null,
                  },
                });
              }}
              value={workingPginstace.pgPassword?.newPassword ?? ""}
            />
          )}
        </div>
      </div>
      <div>
        <div>Host</div>
        <div>
          <Input
            placeholder="Host"
            onChange={(e) => {
              setWorkingPgInstance({
                ...workingPginstace,
                pgHost: e.target.value,
              });
            }}
            value={workingPginstace.pgHost}
          />
        </div>
      </div>
      <div>
        <div>Port</div>
        <div>
          <Input
            type="number"
            placeholder="Port"
            onChange={(e) => {
              setWorkingPgInstance({
                ...workingPginstace,
                pgPort: parseInt(e.target.value),
              });
            }}
            value={workingPginstace.pgPort}
          />
        </div>
      </div>
      <div>
        <div>Database</div>
        <div>
          <Input
            placeholder="Database"
            onChange={(e) => {
              setWorkingPgInstance({
                ...workingPginstace,
                pgDatabase: e.target.value,
              });
            }}
            value={workingPginstace.pgDatabase}
          />
        </div>
      </div>

      <div>
        <div>SSL</div>
        <div>
          <select
            className="rounded-md border bg-transparent px-3 py-1"
            onChange={(e) => {
              setWorkingPgInstance({
                ...workingPginstace,
                ssl: e.target.value === "true",
              });
            }}
            value={workingPginstace.ssl.toString()}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-4 mt-8">
        {pgInstance ? (
          <Button
            onClick={() => {
              updatePgInstance({
                instance: workingPginstace,
                uuid: pgInstance.uuid,
              });
            }}
            isLoading={isUpdatingPgInstance}
          >
            Update instance
          </Button>
        ) : (
          <Button
            onClick={() => {
              addPgInstance({
                instance: workingPginstace,
                projectId: me!.Team.Projects[0]!.id,
              });
            }}
            isLoading={isAddingPgInstance}
          >
            Add instance
          </Button>
        )}

        <Button
          onClick={() => {
            testPgConnection(workingPginstace);
          }}
          isLoading={isTestingPgConnection}
        >
          Test connection
        </Button>
      </div>

      {testResult && <TestResultShower data={testResult} />}
    </div>
  );
};

const TestResultShower = ({
  data,
}: {
  data: {
    canSelect1: { status: string; errorMessage?: string | null };
    canUsePgStatStatements: { status: string; errorMessage?: string | null };
  };
}) => {
  return (
    <ul className="text-xs mt-4 font-medium list-disc">
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
                <InlineCode>CREATE EXTENSION pg_stat_statements;</InlineCode>
                <li>
                  Make sure your user has the necessary permissions to query{" "}
                  <code>pg_stat_statements</code>.
                </li>
                <InlineCode>GRANT pg_stat_statements TO your_user;</InlineCode>
              </ul>
            </>
          )}
        </>
      )}
    </ul>
  );
};
