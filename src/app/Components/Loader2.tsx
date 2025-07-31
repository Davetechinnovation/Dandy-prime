"use client";
import React from "react";
import Lottie from "lottie-react";
import loader2 from "./loader2.json";

const Loader2 = ({ height = 80 }: { height?: number }) => (
  <div
    className="flex items-center justify-center w-full"
    style={{ minHeight: "100vh", minWidth: "10vw" }}
  >
    <Lottie animationData={loader2} loop={true} style={{ height, width: height }} />
  </div>
);

export default Loader2;
