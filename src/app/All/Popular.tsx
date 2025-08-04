import React, { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import MovieCard from "../Components/MovieCard";

import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
  media_type?: string;
};

type PopularApiResponse = {
  totalPages: number;
  popular: Movie[];
};

// PAGE_SIZE removed (was unused)

const Popular = () => {
  const loader = useRef<HTMLDivElement | null>(null);

  // React Query infinite scroll
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<PopularApiResponse>({
      queryKey: ["allPopular"],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await fetch(`/api/home/all?page=${pageParam}`);
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const nextPage = allPages.length + 1;
        if (
          nextPage <= (lastPage?.totalPages || 1000) &&
          (lastPage?.popular?.length ?? 0) > 0
        ) {
          return nextPage;
        }
        return undefined;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    });

  // Infinite scroll effect
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 400
      ) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages' movies
  const movies = data?.pages?.flatMap((page) => page.popular || []) || [];

  return (
    <div>
      <div className="text-white pb-10 lg:pb-0 -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular Movies
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-[15px] ">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={{
                id: movie.id,
                title: movie.title,
                image: movie.image,
                year: movie.year,
                rating: Number(movie.rating),
                media_type: movie.media_type === "tv" ? "tv" : "movie",
              }}
            />
          ))}
        </div>
        {(isLoading || isFetchingNextPage) && <Loader height={60} />}
        {!hasNextPage && (
          <div className="text-white text-lg py-6">No more movies.</div>
        )}
        <div ref={loader} />
      </div>
    </div>
  );
};

export default Popular;
