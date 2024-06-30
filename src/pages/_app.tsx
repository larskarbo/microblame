import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";
import "prismjs/themes/prism-tomorrow.css";
import "typeface-merriweather";
import "../global.css";
import { trpc } from "../utils/trpc";
import toast, { Toaster } from "react-hot-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />

      <Toaster
        toastOptions={{
          style: {
            maxWidth: 450,
            wordBreak: "break-word",
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default trpc.withTRPC(MyApp);
