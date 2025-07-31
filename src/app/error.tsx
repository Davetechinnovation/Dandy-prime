"use client";
import NetworkErrorPage from "./Components/NetworkErrorPage";

export default function GlobalError({ reset }: { error: Error, reset: () => void }) {
  // Only show NetworkErrorPage if offline
  if (typeof window !== "undefined" && !navigator.onLine) {
    return <NetworkErrorPage show={true} onRetry={reset} />;
  }
  // Otherwise, show nothing or a generic error (optional)
  return null;
}
