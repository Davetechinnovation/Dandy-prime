"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import TopRated from "./TopRated";
import Popular from "./Popular";
import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

const Page = () => {
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNewReleases() {
      setLoading(true);
      try {
        const res = await fetch("/api/home/all");
        const data = await res.json();
        console.log("API /api/home/all response:", data);
        setNewReleases(data.newReleases || []);
      } catch {
        setNewReleases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNewReleases();
  }, []);

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-2 ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          New Released Movies
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 ">
          {loading ? (
            <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
              <Loader />
            </div>
          ) : newReleases.length === 0 ? (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No new releases found.
            </div>
          ) : (
            newReleases.map((movie) => (
              <div key={movie.id} className="">
                <Image
                  src={movie.image || "/images/sinners.webp"}
                  alt={movie.title}
                  width={300}
                  height={170}
                  className="w-full sm:h-[25vh] h-[19vh] rounded-t-lg object-cover"
                />
                <div className="border border-t-0 border-blue-700 rounded-b-lg px-2 leading-8 ">
                  <p className="sm:text-[16px] text-[13px] truncate ">
                    {movie.title}
                  </p>
                  <p className="flex items-center justify-between sm:text-[14px] text-[11px] ">
                    <span>{movie.year}</span>
                    <span className="flex items-center justify-between gap-2 ">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {movie.rating}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <TopRated />
      <Popular />
    </div>
  );
};

export default Page;
