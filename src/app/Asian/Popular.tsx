"use client";

import React, { useRef } from "react";
import useSWRInfinite from "swr/infinite";
import MovieCard from "../Components/MovieCard";

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
    <section>
      <div className="text-white -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular
        </h2>
        <ul className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
          {movies.length === 0 && (
            <li className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No popular movies found.
            </li>
          )}
          {movies.map((movie) => (
            <li key={movie.id}>
              <MovieCard movie={movie} />
            </li>
          ))}
        </ul>
        <div ref={loaderRef} className="w-full flex justify-center py-4">
          {isValidating && <Loader height={60} />}
          {isReachingEnd && (
            <span className="text-gray-400">No more movies.</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default Popular;
