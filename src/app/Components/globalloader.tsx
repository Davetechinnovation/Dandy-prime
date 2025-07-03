"use client";

import Player from "lottie-react";
import loaderAnimation from "./loader.json";

const globalloader = () => {
  return (
    <div className="flex bg-black  justify-center items-center h-[100dvh] pt-[68px] ">
      <div className="max-w-[90px] w-full ">
        <Player autoplay loop animationData={loaderAnimation} />
      </div>
    </div>
  );
};

export default globalloader;
