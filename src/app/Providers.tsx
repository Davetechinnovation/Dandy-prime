"use client";
import React from "react";

export const LayoutContext = React.createContext<{
  hideLayout: boolean;
  setHideLayout: (val: boolean) => void;
}>({
  hideLayout: false,
  setHideLayout: () => {},
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [hideLayout, setHideLayout] = React.useState(false);
  return (
    <LayoutContext.Provider value={{ hideLayout, setHideLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}
