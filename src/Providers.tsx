"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#e0e5ec",
              border: "none",
              boxShadow: "6px 6px 12px #bec3c9, -6px -6px 12px #ffffff",
              color: "#2d3748",
              fontWeight: 600,
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
