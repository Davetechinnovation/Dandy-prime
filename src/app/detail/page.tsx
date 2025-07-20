import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import React from "react";

const page = () => {
  return (
    <div className="text-white sm:py-[75px] py-[85px] ">
      <p className="md:px-5 sm:py-3 py-1 cursor-pointer ">
        {" "}
        <ArrowLeft />{" "}
      </p>
      <div className="grid md:grid-cols-2 grid-cols-1 md:gap-9 gap-2 ">
        <div className="relative w-full sm:h-[400px] h-[200px] " >
          <Image
            src="/images/test.webp"
            alt="image"
           fill
            unoptimized
              className="object-cover"
          />
        </div>

        <div>
          <h1>Jurassic World Rebirth</h1>
          <p className="flex items-center gap-5"> <span>2025</span>  <span>7.5 rating</span> </p>
          <div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
