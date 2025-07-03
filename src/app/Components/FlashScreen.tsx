"use client";
import { Play } from "lucide-react";
import Player from "lottie-react";
import loaderAnimation from "./loader2.json";

import React, { useEffect, useState } from "react";

type FlashScreenProps = {
  loading: boolean;
  onComplete?: () => void;
  fetchDuration?: number; // ms, optional, for network speed
  error?: string | null;
};

const FlashScreen = ({ error }: FlashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  // Animate progress to 100% in 6 seconds, then hide
  useEffect(() => {
    if (error) {
      setProgress(0);
      setVisible(true);
      return;
    }
    setProgress(0);
    setVisible(true);
    const start = performance.now();
    let frame: number;
    function animate(ts: number) {
      const elapsed = ts - start;
      const percent = Math.min(100, Math.round((elapsed / 6000) * 100));
      setProgress(percent);
      if (percent < 100) {
        frame = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setVisible(false), 0); // Hide immediately after 100%
      }
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [error]);

  if (!visible) return null;

  if (error) {
    return (
      <div className="bg-[#000000fa] h-[100dvh] flex justify-center items-center min-w-[320px] overflow-x-auto ">
        <div className="pt-[68px] flex flex-col items-center sm:gap-2 gap-1 ">
          <div className="bg-black p-3 rounded-3xl border-2 border-red-700 ">
            <h1 className="text-red-700 flex items-center gap-[5px] font-extrabold text-[50px] sm:text-[70px]  [transform:scaleY(1.4)] ">
              <span>D</span>
              <span>
                <Play className="w-4 h-4 fill-red-700 " />
              </span>
              <span>P</span>
            </h1>
          </div>
          <div>
            <p className="text-white text-center font-bold text-[22px] sm:text-[32px]  ">
              <span>Dandy</span> <span className="text-red-700">Prime</span>
            </p>
            <p className="text-red-700 font-semibold tracking-wider text-[14px] sm:text-[16px]  [transform:scaleY(1.2)]  ">
              Network Error: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#000000fa] h-[100dvh] flex justify-center items-center min-w-[320px] overflow-x-auto ">
      <div className="pt-[68px] flex flex-col items-center sm:gap-2 gap-1 ">
        <div className="bg-black p-3 rounded-3xl border-2 border-blue-700 ">
          <h1 className="text-blue-700 flex items-center gap-[5px] font-extrabold text-[50px] sm:text-[70px]  [transform:scaleY(1.4)] ">
            <span>D</span>
            <span>
              <Play className="w-4 h-4 fill-blue-700 " />
            </span>
            <span>P</span>
          </h1>
        </div>
        <div>
          <p className="text-white text-center font-bold text-[22px] sm:text-[32px]  ">
            <span>Dandy</span> <span className="text-blue-700">Prime</span>
          </p>
          <p className="text-white font-semibold tracking-wider text-[14px] sm:text-[16px]  [transform:scaleY(1.2)]  ">
            <span className="text-blue-700">Your Gateway To</span> Unlimited
            Streaming
          </p>
        </div>
        <div className="sm:max-w-[40px] max-w-[33px] w-full ">
          <Player autoplay loop animationData={loaderAnimation} />
        </div>
        <div className="max-w-[300px]  w-full relative  ">
          <p className="bg-gray-700 w-full h-3 rounded-full "></p>
          <p
            className="bg-blue-700 h-3 rounded-full absolute top-0 left-0 transition-all duration-75"
            style={{ width: `${progress}%` }}
          ></p>
          <p className="text-gray-300 text-[14px] text-center font-medium p-2">
            Loading...{progress}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlashScreen;
