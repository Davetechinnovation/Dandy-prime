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
    // Only disable service worker in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (typeof window !== "undefined" && "serviceWorker" in navigator && !isDevelopment) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        // Check for updates every 30 seconds
        setInterval(() => {
          registration.update();
        }, 30000);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, refresh automatically after 3 seconds
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }
            });
          }
        });
        
        navigator.serviceWorker.ready.then((reg) => {
          // Request background sync for watchlist
          if (
            "sync" in reg &&
            typeof (reg.sync as { register?: (tag: string) => Promise<void> })
              ?.register === "function"
          ) {
            (reg.sync as { register: (tag: string) => Promise<void> }).register(
              "sync-watchlist"
            );
          }
          // Request periodic cache update (Chrome only)
          if (
            "periodicSync" in reg &&
            typeof (
              reg.periodicSync as {
                register?: (
                  tag: string,
                  options?: { minInterval?: number }
                ) => Promise<void>;
              }
            )?.register === "function"
          ) {
            (
              reg.periodicSync as {
                register: (
                  tag: string,
                  options?: { minInterval?: number }
                ) => Promise<void>;
              }
            ).register("update-cache", {
              minInterval: 24 * 60 * 60 * 1000,
            });
          }
          // Listen for push notifications (scaffold)
          if ("pushManager" in reg) {
            // You would subscribe to push notifications here
          }
        });
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
