"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
        dedupingInterval: 30_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
