"use client";
import { useContext } from "react";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import NetworkStatus from "./Components/NetworkStatus";
import NetworkErrorPage from "./Components/NetworkErrorPage";
import { useNetworkRecovery } from "./hooks/useNetworkRecovery";
import { LayoutContext } from "./Providers";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hideLayout } = useContext(LayoutContext);
  const { showNetworkError, retryRequests } = useNetworkRecovery();
  return (
    <>
      {!hideLayout && <Navbar />}
      <NetworkStatus />
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
