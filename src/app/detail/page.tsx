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
    <main className="text-white sm:py-[71px] py-[85px]  ">
      <section className="grid items-center md:grid-cols-[760px_1fr] small:grid-cols-1 medium:grid-cols-[610px_1fr] grid-cols-1  gap-2">
        <div className="relative w-full sm:h-[355px] h-[205px] ">
          <Image
            src="/images/test.webp"
            alt="image"
            fill
            unoptimized
            className="object-cover rounded-lg"
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
            <span className="">2025</span>
            <span className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> 7.5
              rating
            </span>
          </p>
          <nav
            className="border-blue-700 border-2 w-full rounded-lg"
            aria-label="Movie actions"
          >
            <ul className="flex items-center justify-between px-3 py-2 gap-2">
              <li className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Play className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Trailer</span>
              </li>
              <li className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Bookmark className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Watchlist</span>
              </li>
              <li className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <AlertTriangleIcon className="text-blue-700 w-5 h-5 " />
                </span>
                <span className="sm:block hidden">Report/complain</span>
                <span className="sm:hidden">Report</span>
              </li>
              <li className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Download className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Download</span>
              </li>
              <li className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-pointer">
                <span>
                  <Share2 className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Share</span>
              </li>
            </ul>
          </nav>
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
      </section>

      <section className=" small:pt-[0px] pt-[78px] px-4 ">
        <div className="max-w-[490px] py-4">
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_2fr] sm:gap-  w-full">
            <div className="">
              <h2 className="text-[25px] font-semibold">8.5</h2>
              <p className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />
                <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />
                <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />
                <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />
                <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 " />
              </p>
              <p>57625 (reviews)</p>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span>5</span>
                <span className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                  <span className="w-[75%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
                </span>
                <span>75%</span>
              </div>

              <div className="flex items-center gap-1">
                <span>4</span>
                <span className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                  <span className="w-[20%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
                </span>
                <span>20%</span>
              </div>

              <div className="flex items-center gap-1">
                <span>3</span>
                <span className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                  <span className="w-[10%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
                </span>
                <span>10%</span>
              </div>

              <div className="flex items-center gap-1">
                <span>2</span>
                <span className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                  <span className="w-[5%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
                </span>
                <span>5%</span>
              </div>

              <div className="flex items-center gap-1">
                <span>1</span>
                <span className="w-[260px] h-[10px] relative  rounded-full bg-[#cecece] ">
                  <span className="w-[2%] rounded-full h-full bg-blue-700 absolute inset-0 "></span>
                </span>
                <span>2%</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="px-3">
        <h2 className="font-semibold border-b border-b-blue-700 pb-4 text-[25px] ">
          Metadata
        </h2>
        <dl>
          <div className="border-b border-b-blue-700 py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt>Released Date</dt>
              <dd>2025-07-25</dd>
            </div>
          </div>
          <div className="border-b border-b-blue-700 py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt>Runtime</dt>
              <dd>500 minutes</dd>
            </div>
          </div>
          <div className="py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt>Language</dt>
              <dd>English</dd>
            </div>
          </div>
        </dl>
      </section>
      <section className="py-6 px-2  gap-2 ">
        <h2 className="text-[25px] font-semibold  my-3 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
          Genre
        </h2>
        <div className="flex items-center gap-3 ">
          <p className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700">
            Action
          </p>
          <p className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700">
            Romance
          </p>
        </div>
        <p className="text-white opacity-40 pt-3 ">PG-18</p>
      </section>
      <section className="px-4">
        <h2 className="text-[25px] font-semibold  my-3 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
          Plot
        </h2>
        <p>
          In the year 2097, Earth is on the brink of collapse from decades of
          climate wars and technological overreach. Dr. Elara Voss, a reclusive
          quantum physicist haunted by her past, discovers a way to receive
          faint signals from the future — echoes of events that haven’t yet
          happened. When she intercepts a warning about a mysterious global
          catastrophe, she must decode fragmented visions and face a shadowy
          agency determined to bury the truth. As timelines blur and betrayals
          surface, Elara races against time — and her future self — to rewrite
          fate and save a world that may already be lost. Are we bound by
          destiny… or can we change the echo?
        </p>
        <h2 className="text-[25px] font-semibold  my-3 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
          Cast
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>

          <div className="min-w-[200px] max-w-[300px]  ">
            <Image
              src="/images/test.webp"
              alt="image"
              width={200}
              height={850}
              unoptimized
              className="object-cover rounded-lg"
            />
          </div>
        </div>
        <h2 className="text-[25px] font-semibold  my-4 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
          Keywords
        </h2>
        <div className="flex items-center gap-3 ">
          <p className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700">
            Adventure
          </p>
          <p className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700">
            Future
          </p>
          <p className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700">
            Space Exploration
          </p>
          <p className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700">
            Mission
          </p>
        </div>
      </section>
      <section className="px-3" >
        <h2 className="text-[25px] font-semibold my-4  border-b-2 max-w-[350px] border-b-blue-700 " >Recommended after watching</h2>
        <div>
          <div className="max-w-[200px] min-w-[150px]">
            <Image
              src="/images/straw.webp"
              alt="dandy-prime-image "
              width={200}
              height={200}
            />
            <p className="flex gap-3 items-center justify-between">
              <span>Straw</span>
              <span>2025</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
