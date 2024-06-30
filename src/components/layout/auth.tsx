import { isNull } from "lodash";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { Spinner } from "../Spinner";

const LoadingPage = () => {
  return (
    <>
      <div className="flex justify-center my-12">
        <Spinner />
      </div>
    </>
  );
};

type Props = {
  children: React.ReactNode;
};

export const LoggedInPage = ({ children }: Props): JSX.Element => {
  const router = useRouter();
  const { data: me, isFetched, isLoading: loading } = trpc.me.useQuery();

  useEffect(() => {
    if (!isFetched || !router.isReady) return;

    if (!me) {
      void router.push({
        pathname: "/login",
        query: { returnUrl: router.asPath },
      });
    }
  }, [isFetched, me]);

  if (loading) {
    return <LoadingPage />;
  }

  const authorized = !isNull(me);

  return authorized ? <>{children}</> : <LoadingPage />;
};

export const LoggedOutPage = ({ children }: Props): JSX.Element => {
  const router = useRouter();
  const { data: me, isFetched, isLoading: loading } = trpc.me.useQuery();

  useEffect(() => {
    if (!isFetched || !router.isReady) return;

    if (me) {
      void router.push({
        pathname: "/dashboard",
        query: { returnUrl: router.asPath },
      });
    }
  }, [isFetched, me]);

  if (loading) {
    return <LoadingPage />;
  }

  const isNotLoggedIn = isNull(me);

  return isNotLoggedIn ? <>{children}</> : <LoadingPage />;
};
