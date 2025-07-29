"use client";
import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import MovieCard from "../Components/MovieCard";
import Loader from "../Components/Loader";


type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

const SearchPage = () => {
  // const { showNetworkError, retryRequests } = useNetworkRecovery();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const loader = React.useRef<HTMLDivElement | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Trending infinite query
  const {
    data: trendingData,
    isLoading: trendingLoading,
    fetchNextPage: fetchTrendingNext,
    hasNextPage: trendingHasNext,
    isFetchingNextPage: trendingIsFetchingNext,
  } = useInfiniteQuery({
    queryKey: ["trendingSearch"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/home/search?page=${pageParam}`);
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      if (
        nextPage <= (lastPage?.totalPages || 1000) &&
        (lastPage?.trending?.length ?? 0) > 0
      ) {
        return nextPage;
      }
      return undefined;
    },
    enabled: !debounced,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount) => {
      if (!navigator.onLine) return false;
      return failureCount < 3;
    },
  });

  // Search infinite query
  const {
    data: searchData,
    isLoading: searchLoading,
    fetchNextPage: fetchSearchNext,
    hasNextPage: searchHasNext,
    isFetchingNextPage: searchIsFetchingNext,
  } = useInfiniteQuery({
    queryKey: ["searchQuery", debounced],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/home/search/query?query=${encodeURIComponent(
          debounced
        )}&page=${pageParam}`
      );
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      if (
        nextPage <= (lastPage?.totalPages || 1000) &&
        (lastPage?.results?.length ?? 0) > 0
      ) {
        return nextPage;
      }
      return undefined;
    },
    enabled: !!debounced,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: (failureCount) => {
      if (!navigator.onLine) return false;
      return failureCount < 3;
    },
  });

  // Infinite scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      if (debounced) {
        if (
          searchHasNext &&
          !searchIsFetchingNext &&
          window.innerHeight + window.scrollY >=
            document.body.offsetHeight - 400
        ) {
          fetchSearchNext();
        }
      } else {
        if (
          trendingHasNext &&
          !trendingIsFetchingNext &&
          window.innerHeight + window.scrollY >=
            document.body.offsetHeight - 400
        ) {
          fetchTrendingNext();
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    debounced,
    searchHasNext,
    searchIsFetchingNext,
    fetchSearchNext,
    trendingHasNext,
    trendingIsFetchingNext,
    fetchTrendingNext,
  ]);

  // Flatten all pages' movies
  const trendingMovies: Movie[] =
    trendingData?.pages?.flatMap((page) => page.trending || []) || [];
  const searchMovies: Movie[] =
    searchData?.pages?.flatMap((page) => page.results || []) || [];

  return (
    <>
      {/* <NetworkErrorPage show={showNetworkError} onRetry={retryRequests} /> */}
      <div className="min-h-screen text-white ">
      <div className="sm:pt-[88px] pt-[99px] pb-36 sm:px-5 px-3 ">
        <div className="relative w-full">
          <div className="w-full ">
            <input
              type="search"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for movies or shows by title or actor..."
              className="w-full px-4 py-2 rounded-full border border-blue-700 bg-black text-white focus:outline-none focus:border-blue-700 transition duration-200"
            />
          </div>
        </div>
        {debounced ? (
          <>
            <h2 className="text-white font-bold text-[25px] py-3 ">
              Search Results ({searchData?.pages?.[0]?.totalResults ?? 0})
            </h2>
            <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
              {searchLoading && searchMovies.length === 0 && (
                <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
                  <Loader />
                </div>
              )}
              {searchMovies.length === 0 && !searchLoading ? (
                <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
                  No results found.
                </div>
              ) : (
                searchMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              )}
            </div>
            {searchIsFetchingNext && <Loader height={60} />}
            {!searchHasNext && searchMovies.length > 0 && (
              <div className="text-white text-lg py-6">No more results.</div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-white font-bold text-[25px] py-3 ">
              Trending Today 🔥
            </h2>
            <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
              {trendingLoading && trendingMovies.length === 0 && (
                <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
                  <Loader />
                </div>
              )}
              {trendingMovies.length === 0 && !trendingLoading ? (
                <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
                  No trending movies found.
                </div>
              ) : (
                trendingMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              )}
            </div>
            {trendingIsFetchingNext && <Loader height={60} />}
            {!trendingHasNext && trendingMovies.length > 0 && (
              <div className="text-white text-lg py-6">No more movies.</div>
            )}
          </>
        )}
        <div ref={loader} />
      </div>
    </div>
    </>
  );
};

export default SearchPage;
