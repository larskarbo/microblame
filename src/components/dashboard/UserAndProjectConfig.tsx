import { trpc } from "../../utils/trpc";
import { signOut } from "next-auth/react";

export const UserAndProjectConfig = () => {
  const { data: me } = trpc.me.useQuery();

  return (
    <div className="text-xxs">
      <div className="flex gap-2 text-xxs">
        <div className="">User: {me?.name}</div>
        <button
          className="hover:underline"
          onClick={() => {
            signOut();
          }}
        >
          [logout]
        </button>
      </div>
    </div>
  );
};
