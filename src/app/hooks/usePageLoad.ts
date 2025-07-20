"use client";
import { useState, useEffect } from 'react';

export const usePageLoad = (routePath: string) => {
  const [isPageLoad] = useState(() => {
    if (typeof window === "undefined") return false;
    
    const isCorrectRoute = window.location.pathname === routePath;
    const hasNavigated = sessionStorage.getItem("dandyprime-navigated");
    const isRefresh = performance.navigation?.type === 1;
    
    // Return true if we're on the correct route AND it's either a refresh or first visit
    return isCorrectRoute && (isRefresh || !hasNavigated);
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Mark that navigation has occurred
      sessionStorage.setItem("dandyprime-navigated", "true");
      
      // Clear navigation flag on page unload for accurate fresh load detection
      const handleBeforeUnload = () => {
        sessionStorage.removeItem("dandyprime-navigated");
      };
      
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  return isPageLoad;
};
