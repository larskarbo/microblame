import { httpLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import type { AppRouter } from "../server/routers/router";
import { isDev } from "../env";
import { getErrorMessage } from "../components/utils";
import toast from "react-hot-toast";
import superjson from "superjson";

function getBaseUrl() {
  if (typeof window !== "undefined")
    // browser should use relative path
    return "";

  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;

  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpLink({
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @link https://trpc.io/docs/ssr
           **/
          url: `${getBaseUrl()}/api/trpc`,

          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              // authorization: getAuthCookie(),
            };
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnMount: true,
            refetchOnWindowFocus: isDev ? true : false,
            refetchOnReconnect: isDev ? true : false,
          },
          mutations: {
            retry: false,
            onError: (e: unknown) => {
              const errMsg = getErrorMessage(e);
              /* eslint-disable no-console */
              console.error(e);
              toast.error(errMsg);
            },
          },
        },
      },
      transformer: superjson,
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
});
