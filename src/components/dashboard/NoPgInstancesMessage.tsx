import { FC } from "react";
import { Button } from "../Button";
import { useRouter } from "next/router";

export const NoPgInstancesMessage: FC = () => {
  const router = useRouter();
  
  return (
    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
      <h2 className="font-bold mb-2">No Database Instances Found</h2>
      <p className="mb-4">
        You need to add a database instance first to use this feature.
      </p>
      <Button onClick={() => router.push('/dashboard/setup/pg-instance/new')}>Add Database Instance</Button>
    </div>
  );
}; 