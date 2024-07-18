import { useEffect, useState } from "react";

import { Button } from "../../components/Button";
import Layout from "../../components/layout/Layout";
import { QueryRow } from "../../components/QueryRow";
import { Spinner } from "../../components/Spinner";
import { trpc } from "../../utils/trpc";
import Link from "next/link";

export const Project = () => {
  const { data: me } = trpc.me.useQuery();

  if (!me) {
    return null;
  }

  const pgInstances = me!.Team!.Projects[0]!.PgInstances;

  return (
    <Layout>
      <div className="p-8">
        <div className="">
          <h1 className="text-2xl font-semibold">Postgres Instances</h1>
          <div className="py-10"></div>
          <div className="space-y-4">
            {pgInstances.map((pgInstance) => (
              <div
                key={pgInstance.id}
                className=" gap-4 items-center border p-2"
              >
                <div className="text-sm w-64 pb-4">{pgInstance.name}</div>
                <Link href={`/dashboard`} passHref key={pgInstance.id}>
                  <Button>Top queries</Button>
                </Link>
              </div>
            ))}

            {pgInstances.length === 0 && (
              <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded-md">
                No Postgres instances found
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Project;
