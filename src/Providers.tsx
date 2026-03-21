"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";
import ThemeProvider, { useTheme } from "@/components/ThemeProvider";
import SocketProvider from "@/components/SocketProvider";

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      toastOptions={{
        style: {
          background: "var(--color-surface-container-highest)",
          border: "1px solid var(--color-outline-variant)",
          color: "var(--color-on-surface)",
          fontWeight: 500,
          borderRadius: "12px",
          boxShadow: "var(--shadow-elevation-2)",
        },
      }}
    />
  );
}

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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          {children}
        </SocketProvider>
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
