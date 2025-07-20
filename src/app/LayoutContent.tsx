"use client";
import { useContext } from "react";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import NetworkStatus from "./Components/NetworkStatus";
import { LayoutContext } from "./Providers";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hideLayout } = useContext(LayoutContext);
  return (
    <>
      {!hideLayout && <Navbar />}
      <NetworkStatus />
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
