"use client";
import React from "react";
import useSWR from "swr";
import ImageWithSkeleton from "../Components/ImageWithSkeleton";
import { Star } from "lucide-react";
import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Toprated = () => {
  const { data, error, isLoading } = useSWR("/api/home/asian", fetcher);
  // Deduplicate movies by id
  const topRatedRaw: Movie[] = data?.topRated || [];
  const seen = new Set<number>();
  const topRated: Movie[] = topRatedRaw.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">Failed to load</div>;

  return (
    <div>
      <div className="text-white pb-10 lg:pb-0 -translate-y-10 sm:px-5 px-3 ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Top Rated
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[10px]">
          {topRated.length === 0 && (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No top rated movies found.
            </div>
          )}
          {topRated.map((movie) => (
            <div key={movie.id} className="">
              <ImageWithSkeleton
                src={movie.image || "/images/sinners.webp"}
                alt={movie.title}
                width={500}
                height={250}
                className="w-full h-[120px] sm:h-[250px] rounded-t-lg object-cover"
                loading="lazy"
                placeholder="blur"
                blurDataURL="/images/sinners.webp"
              />
              <div className="border border-t-0 border-blue-700 rounded-b-lg px-2 leading-8 ">
                <p className="sm:text-[16px] text-[13px] truncate ">
                  {movie.title}
                </p>
                <p className="flex items-center justify-between sm:text-[14px] text-[11px] ">
                  <span>{movie.year || "-"}</span>
                  <span className="flex items-center justify-between gap-2 ">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />{" "}
                    {movie.rating ? Number(movie.rating).toFixed(1) : "-"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toprated;
