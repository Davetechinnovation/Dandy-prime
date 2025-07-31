"use client";
import React from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import MovieCard from "../../../Components/MovieCard";
import Loader from "../../../Components/Loader";
import { ArrowLeft } from "lucide-react";

// Movie type
interface Movie {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
}

const SearchByTypePage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params?.type as string; // 'genre' or 'keyword'
  const id = params?.id as string;
  const name = searchParams.get("name") || "";
  const loader = React.useRef<HTMLDivElement | null>(null);

    const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // Infinite query for genre/keyword
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["searchByType", type, id],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await fetch(
          `/api/home/search/${type}?id=${id}&page=${pageParam}`
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
      enabled: !!id && (type === "genre" || type === "keyword"),
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
      if (
        hasNextPage &&
        !isFetchingNextPage &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 400
      ) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages' movies
  const movies: Movie[] =
    data?.pages?.flatMap((page) => page.results || []) || [];

  return (
    <div className="min-h-screen text-white ">
      <div className="sm:pt-[88px] pt-[99px] pb-36 sm:px-5 px-3 ">
        <p
          onClick={handleBack}
          className="md:px-2 px-1 sm:py-3 py-1 max-w-[40px] w-full cursor-pointer border-2 border-blue-700 rounded-xl"
        >
          <ArrowLeft />
        </p>
        <h2 className="text-white font-bold text-[25px] py-3 ">
          {type === "genre" ? "Genre: " : "Keyword: "}
          <span className="text-blue-400">{name}</span>
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
          {isLoading && movies.length === 0 && (
            <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
              <Loader />
            </div>
          )}
          {movies.length === 0 && !isLoading ? (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No results found.
            </div>
          ) : (
            movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
          )}
        </div>
        {isFetchingNextPage && <Loader height={60} />}
        {!hasNextPage && movies.length > 0 && (
          <div className="text-white text-lg py-6">No more results.</div>
        )}
        <div ref={loader} />
      </div>
    </div>
  );
};

export default SearchByTypePage;
