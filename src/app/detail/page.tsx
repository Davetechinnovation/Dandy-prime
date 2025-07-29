"use client";
import {
  AlertTriangleIcon,
  ArrowLeft,
  Bookmark,
  Download,
  Play,
  PlayCircle,
  PlayCircleIcon,
  Share2,
  Star,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back(); // Go to previous page
    } else {
      router.push("/"); // Fallback to home
    }
  };
  return (
    <div className="text-white sm:py-[71px] py-[85px]  ">
      <div className="grid items-center md:grid-cols-[760px_1fr] small:grid-cols-1 medium:grid-cols-[610px_1fr] grid-cols-1  gap-2">
        <div className="relative w-full sm:h-[355px] h-[205px] ">
          <Image
            src="/images/test.webp"
            alt="image"
            fill
            unoptimized
            className="object-cover"
          />
          <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  ">
            <PlayCircleIcon className="w-10 h-10 fill-blue-700 cursor-pointer " />
          </p>
          <div className="max-w-[150px]  small:hidden h-[220px] absolute w-full -bottom-[70px] left-10 ">
            <Image
              src="/images/test.webp"
              alt="image"
              fill
              unoptimized
              className="object-cover rounded-lg "
            />
          </div>
          <p
            onClick={handleBack}
            className="md:px-2 px-1 sm:py-3 py-1 absolute top-0 left-0 cursor-pointer border-2 border-blue-700 rounded-xl"
          >
            <ArrowLeft />
          </p>
        </div>

        <div className="sm:px-5 px-2 ">
          <h1 className="sm:text-[28px] text-[23px] font-bold ">
            Jurassic World Rebirth
          </h1>
          <p className="flex items-center gap-5 text-[15px] font-medium py-3 ">
            {" "}
            <span className="">2025</span>{" "}
            <span className="flex items-center gap-1">
              {" "}
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> 7.5
              rating
            </span>{" "}
          </p>
          <div className="border-blue-700 border-2 w-full rounded-lg">
            <div className="flex items-center justify-between px-3 py-2 gap-2 ">
              <p className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Play className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Trailer</span>
              </p>
              <p className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Bookmark className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Watchlist</span>
              </p>
              <p className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <AlertTriangleIcon className="text-blue-700 w-5 h-5 " />
                </span>
                <span className="sm:block hidden">Report/complain</span>
                <span className="sm:hidden">Report</span>
              </p>
              <p className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Download className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Download</span>
              </p>
              <p className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Share2 className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Share</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 pt-6 gap-3">
            <button className="bg-blue-700 rounded-full sm:py-3 py-2 flex items-center gap-2 justify-center hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700  ">
              <span>
                <PlayCircle />
              </span>
              Watch Trailer
            </button>
            <select
              name="server"
              id="server"
              className=" cursor-pointer bg-black border-2 border-blue-700 rounded-full px-2  focus:outline-none focus:ring-0"
            >
              <option value="1">Server 1</option>
              <option value="2">Server 2</option>
              <option value="3">Server 3</option>
              <option value="4">Server 4</option>
              <option value="5">Server 5</option>
              <option value="6">Server 6</option>
              <option value="7">Server 7</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sm:pt-[78px] px-4 ">
        <div className="flex gap-7">
          <div className="">
            <h2 className="text-[25px] font-semibold">8.5</h2>
            <p className="flex items-center gap-1">
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />{" "}
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />{" "}
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />{" "}
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />{" "}
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />
            </p>
            <p>57625 (reviews)</p>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <p>5</p>
              <p className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                <span className="w-[75%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
              </p>
              <p>75%</p>
            </div>

            <div className="flex items-center gap-1">
              <p>4</p>
              <p className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                <span className="w-[20%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
              </p>
              <p>20%</p>
            </div>

            <div className="flex items-center gap-1">
              <p>3</p>
              <p className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                <span className="w-[10%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
              </p>
              <p>10%</p>
            </div>

            <div className="flex items-center gap-1">
              <p>2</p>
              <p className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                <span className="w-[5%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
              </p>
              <p>5%</p>
            </div>

            <div className="flex items-center gap-1">
              <p>1</p>
              <p className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                <span className="w-[2%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
              </p>
              <p>2%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
