"use client";

import React, { useRef } from "react";
import useSWRInfinite from "swr/infinite";
import Image from "next/image";
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

const PAGE_SIZE = 20;

const Popular = () => {
  const { data, setSize, isValidating } = useSWRInfinite(
    (index) => `/api/home/asian?page=${index + 1}`,
    fetcher,
    {
      revalidateFirstPage: false,
    }
  );

  const movies: Movie[] = data
    ? data.flatMap((page) => page.popular || [])
    : [];
  const isReachingEnd =
    data && data[data.length - 1]?.popular?.length < PAGE_SIZE;

  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll observer
  React.useEffect(() => {
    if (!loaderRef.current || isReachingEnd) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isValidating) {
          setSize((s) => s + 1);
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isValidating, setSize, isReachingEnd]);

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-2 ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-6 gap-3 ">
          {movies.length === 0 && (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No popular movies found.
            </div>
          )}
          {movies.map((movie) => (
            <div key={movie.id} className="">
              <Image
                src={movie.image || "/images/sinners.webp"}
                alt={movie.title}
                width={200}
                height={100}
                className="w-full sm:h-[25vh] h-[19vh] rounded-t-lg object-cover "
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
        <div ref={loaderRef} className="w-full flex justify-center py-4">
          {isValidating && <Loader height={60} />}
          {isReachingEnd && (
            <span className="text-gray-400">No more movies.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popular;
