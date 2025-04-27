import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";
import "prismjs/themes/prism-tomorrow.css";
import "typeface-merriweather";
import "../global.css";
import { trpc } from "../utils/trpc";
import { Toaster } from "react-hot-toast";

import { NuqsAdapter } from "nuqs/adapters/next/pages";
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <NuqsAdapter>
        <Component {...pageProps} />

        <Toaster
          toastOptions={{
            style: {
              maxWidth: 450,
              wordBreak: "break-word",
            },
          }}
        />
      </NuqsAdapter>
    </>
  );
}

export default trpc.withTRPC(MyApp);
