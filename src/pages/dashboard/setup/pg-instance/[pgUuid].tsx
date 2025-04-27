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
import { ArrowPathIcon, BeakerIcon, PlusCircleIcon, TrashIcon } from "@heroicons/react/20/solid";
import toast from "react-hot-toast";
import { NoPgInstancesMessage } from "../../../../components/dashboard/NoPgInstancesMessage";
import { isBrowser } from "../../../../env";
import { atom, useAtom } from "jotai";
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
    return null;
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

const connectionStringAtom = atom<string>("");

const NewPostgresInstanceForm = ({ pgUuid }: { pgUuid: string }) => {
  const { data: me } = trpc.me.useQuery();

  const [connectionString, setConnectionString] = useAtom(connectionStringAtom);

  const router = useRouter();

  const { mutate: addPgInstance, isLoading: isAddingPgInstance } =
    trpc.setup.addPgInstance.useMutation({
      onSuccess: () => {
        router.push("/dashboard/setup");
      },
    });

  const { mutate: updatePgInstance, isLoading: isUpdatingPgInstance } =
    trpc.setup.updatePgInstance.useMutation({
      onSuccess: () => {
        router.push("/dashboard/setup");
      },
    });

  const { mutate: deletePgInstance, isLoading: isDeletingPgInstance } =
    trpc.setup.deletePgInstance.useMutation({
      onSuccess: () => {
        router.push("/dashboard/setup");
      },
    });

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

  const [showAddButton, setShowAddButton] = useState(false);

  useEffect(() => {
    if (testResult) {
      const allTestsPass =
        testResult.canSelect1.status === "success" &&
        testResult.canUsePgStatStatements.status === "success";
      setShowAddButton(allTestsPass);
    }
  }, [testResult]);

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

  // Only check for instances if we're NOT on the new instance page
  if (pgUuid !== "new" && me && me.Team.PgInstances.length === 0) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-extrabold">Postgres Instance</h1>
        <NoPgInstancesMessage />
      </div>
    );
  }

  const handleInitialTestConnection = () => {
    // Initial test - resets UI
    testPgConnection(workingPginstace);
    setShowAddButton(false);
  };

  const handleRecheckConnection = () => {
    // Just recheck, don't reset UI state
    testPgConnection(workingPginstace);
  };

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
        <Button
          onClick={handleInitialTestConnection}
          isLoading={isTestingPgConnection}
          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1.5 shadow-sm"
        >
          <BeakerIcon className="h-4 w-4" />
          Test connection
        </Button>

        {pgInstance && (
          <>
            <Button
              onClick={() => {
                updatePgInstance({
                  instance: workingPginstace,
                  uuid: pgInstance.uuid,
                });
              }}
              isLoading={isUpdatingPgInstance}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Update instance
            </Button>
            <Button
              onClick={() => {
                const confirm = window.confirm(
                  "Are you sure you want to delete this instance?"
                );
                if (confirm) {
                  deletePgInstance({
                    uuid: pgInstance.uuid,
                  });
                }
              }}
              isLoading={isDeletingPgInstance}
              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 shadow-sm"
            >
              <TrashIcon className="h-4 w-4" />
              Delete instance
            </Button>
          </>
        )}

        {testResult && showAddButton && !pgInstance && (
          <Button
            onClick={() => {
              if (!me?.teamId) {
                alert("Could not find your team");
                return;
              }
              addPgInstance({
                instance: workingPginstace,
                teamId: me.teamId,
              });
            }}
            isLoading={isAddingPgInstance}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add instance
          </Button>
        )}
      </div>

      {testResult && (
        <TestResultShower
          data={testResult}
          pgUser={workingPginstace.pgUser}
          onRefetch={handleRecheckConnection}
        />
      )}
    </div>
  );
};

const TestResultShower = ({
  data,
  pgUser,
  onRefetch,
}: {
  data: {
    canSelect1: { status: string; errorMessage?: string | null };
    canUsePgStatStatements: { status: string; errorMessage?: string | null };
  };
  pgUser: string;
  onRefetch: () => void;
}) => {
  const connectionSuccessful = data.canSelect1.status === "success";
  const pgStatStatementsWorking =
    data.canUsePgStatStatements.status === "success";

  const allTestsPass = connectionSuccessful && pgStatStatementsWorking;
  const hasErrors = !connectionSuccessful || !pgStatStatementsWorking;

  return (
    <div className="mt-6 p-6 border rounded-md bg-slate-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Setup Checklist</h3>
        {hasErrors && (
          <Button
            onClick={onRefetch}
            className="text-sm py-1.5 px-3 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Recheck
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Step 1: Basic Connection */}
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              connectionSuccessful
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {connectionSuccessful ? "✓" : "!"}
          </div>
          <div className="flex-1 ml-3">
            <h4 className="text-base font-medium leading-none">
              Step 1: Connect to PostgreSQL
            </h4>
            {connectionSuccessful ? (
              <p className="text-sm text-green-700 mt-1">
                Connection successful! ✅
              </p>
            ) : (
              <div className="text-sm text-red-600 mt-1">
                <p>Connection failed: {data.canSelect1.errorMessage}</p>
                <p className="mt-1">
                  Check your connection details and try again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Only show next step if connection works */}
        {connectionSuccessful && (
          <>
            {/* Step 2: pg_stat_statements extension */}
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  pgStatStatementsWorking
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {pgStatStatementsWorking ? "✓" : "!"}
              </div>
              <div className="flex-1 ml-3">
                <h4 className="text-base font-medium leading-none">
                  Step 2: Set up <InlineCode>pg_stat_statements</InlineCode>{" "}
                  extension and permissions
                </h4>

                {pgStatStatementsWorking ? (
                  <p className="text-sm text-green-700 mt-1">
                    Extension and permissions configured correctly ✅
                  </p>
                ) : (
                  <div className="text-sm mt-1">
                    <p className="text-amber-700 mb-2">
                      Configuration required:
                    </p>

                    <p className="mb-1 text-sm">1. Install the extension:</p>
                    <div className="mb-3">
                      <InlineCode>
                        CREATE EXTENSION pg_stat_statements;
                      </InlineCode>
                    </div>

                    <p className="mb-1 text-sm">
                      2. Grant permissions to user:
                    </p>
                    <div className="mb-2">
                      <InlineCode>
                        GRANT pg_stat_statements TO {pgUser};
                      </InlineCode>
                    </div>

                    {data.canUsePgStatStatements.errorMessage?.includes(
                      "does not exist"
                    ) && (
                      <p className="mt-2 text-slate-600 text-sm">
                        <strong>Note:</strong> The error indicates that the
                        pg_stat_statements object doesn't exist. Make sure
                        you've installed the extension first.
                      </p>
                    )}

                    <p className="mt-2 text-slate-500 text-xs">
                      Error details: {data.canUsePgStatStatements.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
