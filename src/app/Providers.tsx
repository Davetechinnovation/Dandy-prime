"use client";
import React from "react";

export const LayoutContext = React.createContext<{
  hideLayout: boolean;
  setHideLayout: (val: boolean) => void;
}>({
  hideLayout: false,
  setHideLayout: () => {},
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [hideLayout, setHideLayout] = React.useState(false);
  const [queryClient] = React.useState(() => new QueryClient());

  // Register service worker for PWA/offline support and advanced features
  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // Request background sync for watchlist
        if (
          "sync" in reg &&
          typeof (reg as any).sync?.register === "function"
        ) {
          (reg as any).sync.register("sync-watchlist");
        }
        // Request periodic cache update (Chrome only)
        if (
          "periodicSync" in reg &&
          typeof (reg as any).periodicSync?.register === "function"
        ) {
          (reg as any).periodicSync.register("update-cache", {
            minInterval: 24 * 60 * 60 * 1000,
          });
        }
        // Listen for push notifications (scaffold)
        if ("pushManager" in reg) {
          // You would subscribe to push notifications here
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LayoutContext.Provider value={{ hideLayout, setHideLayout }}>
        {children}
      </LayoutContext.Provider>
    </QueryClientProvider>
  );
}
