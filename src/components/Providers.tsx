"use client";

import { SWRConfig } from "swr";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: true,
          revalidateIfStale: true,
          dedupingInterval: 5000,
          keepPreviousData: true,
          shouldRetryOnError: false,
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
