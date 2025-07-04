"use client";
import React from "react";

export const LayoutContext = React.createContext<{
  hideLayout: boolean;
  setHideLayout: (val: boolean) => void;
}>({
  hideLayout: false,
  setHideLayout: () => {},
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  const [hideLayout, setHideLayout] = React.useState(false);
  const [queryClient] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <LayoutContext.Provider value={{ hideLayout, setHideLayout }}>
        {children}
      </LayoutContext.Provider>
    </QueryClientProvider>
  );
}
