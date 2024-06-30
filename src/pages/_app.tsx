import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";
import "prismjs/themes/prism-tomorrow.css";
import "typeface-merriweather";
import "../global.css";
import { trpc } from "../utils/trpc";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />

      <Toaster
        toastOptions={{
          style: {
            maxWidth: 450,
            wordBreak: "break-word",
          },
        }}
      />
    </>
  );
}

export default trpc.withTRPC(MyApp);
