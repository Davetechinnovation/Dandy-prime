import Link from "next/link";
import { Trophy, Home, Bookmark, Search } from "lucide-react";
import React from "react";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  return (
    <div>
      <div className="bg-black fixed bottom-0 left-0 w-[100%]  py-[10px] border-t border-t-blue-700">
        <div className="text-white flex justify-between sm:px-20 px-3 gap-2  ">
          <Link href="/">
            <p className="flex flex-col items-center group cursor-pointer">
              <span>
                <Home
                  className={`sm:w-6 sm:h-6 w-5 h-5 transition group-hover:text-blue-700 ${
                    pathname === "/" ? "text-blue-700" : "text-white"
                  }`}
                />
              </span>
              <span
                className={`text-sm sm:text-md transition group-hover:text-blue-700 ${
                  pathname === "/" ? "text-blue-700" : "text-white"
                }`}
              >
                Home
              </span>
            </p>
          </Link>

          <Link href="/sports">
            <p className="flex flex-col items-center group cursor-pointer">
              <span>
                <Trophy
                  className={`sm:w-6 sm:h-6 w-5 h-5 transition group-hover:text-blue-700 ${
                    pathname === "/sports" ? "text-blue-700" : "text-white"
                  }`}
                />
              </span>
              <span
                className={`text-sm sm:text-md transition group-hover:text-blue-700 ${
                  pathname === "/sports" ? "text-blue-700" : "text-white"
                }`}
              >
                Sports
              </span>
            </p>
          </Link>
          <Link href="/search">
            <p className="flex flex-col items-center group cursor-pointer">
              <span>
                <Search
                  className={`sm:w-6 sm:h-6 w-5 h-5 transition group-hover:text-blue-700 ${
                    pathname === "/search" ? "text-blue-700" : "text-white"
                  }`}
                />
              </span>
              <span
                className={`text-sm sm:text-md transition group-hover:text-blue-700 ${
                  pathname === "/search" ? "text-blue-700" : "text-white"
                }`}
              >
                Search
              </span>
            </p>
          </Link>
          <Link href="/watchlist">
            <p className="flex flex-col items-center group cursor-pointer">
              <span>
                <Bookmark
                  className={`sm:w-6 sm:h-6 w-5 h-5 transition group-hover:text-blue-700 ${
                    pathname === "/watchlist" ? "text-blue-700" : "text-white"
                  }`}
                />
              </span>
              <span
                className={`text-sm sm:text-md transition group-hover:text-blue-700 ${
                  pathname === "/watchlist" ? "text-blue-700" : "text-white"
                }`}
              >
                Watchlist
              </span>
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;
