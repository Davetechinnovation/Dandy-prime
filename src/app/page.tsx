"use client";
import BannerSkeleton from "./Components/BannerSkeleton";
import { useContext } from "react";
import { LayoutContext } from "./Providers";

import Image from "next/image";
import { Star, Bookmark, PlayCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Movies from "./movies/page";


import dynamic from "next/dynamic";

const FlashScreen = dynamic(() => import("./Components/FlashScreen"), {
  ssr: false,
});
const GlobalLoader = dynamic(() => import("./Components/globalloader"), {
  ssr: false,
});

type HeroMovie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
  votes: number;
  language: string;
  description: string;
};

export default function Home() {
  const { setHideLayout } = useContext(LayoutContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Show FlashScreen only if user reloads on / (not if they come from another route)
  const [showFlash, setShowFlash] = useState(() => {
    if (typeof window !== "undefined") {
      // Only show splash if this is a reload on /
      const nav = window.performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const isReload = nav && nav.type === "reload";
      // Only set sessionStorage flag if on / and reloading
      if (window.location.pathname === "/" && isReload) {
        sessionStorage.setItem("dandyprime-flashscreen", "show");
        return true;
      }
      // If not on /, clear the flag
      if (window.location.pathname !== "/") {
        sessionStorage.removeItem("dandyprime-flashscreen");
      }
      // Only show if flag is set and on /
      return (
        window.location.pathname === "/" &&
        sessionStorage.getItem("dandyprime-flashscreen") === "show"
      );
    }
    return false;
  });
  const [showGlobalLoader, setShowGlobalLoader] = useState(false);

  // React Query for hero movies
  const { data: movies = [], isLoading: loading } = useQuery<HeroMovie[]>({
    queryKey: ["heroMovies"],
    queryFn: async () => {
      const res = await fetch("/api/home/hero");
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Only show FlashScreen if this is a reload on /

  // Always show FlashScreen on every reload of /
  // No sessionStorage logic, always show splash

  useEffect(() => {
    if (!showFlash) return;
    // Show flash screen for 6 seconds
    const timer = setTimeout(() => {
      setShowFlash(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [showFlash]);

  useEffect(() => {
    // If flash screen is gone and still loading, show global loader
    if (!showFlash && loading) {
      setShowGlobalLoader(true);
    } else if (!loading) {
      setShowGlobalLoader(false);
    }
  }, [showFlash, loading]);

  // Auto-advance slides
  useEffect(() => {
    if (movies.length <= 1) return;

    const timer = setTimeout(() => {
      setIsTransitioning(true);
      // Wait for transition to complete before changing index
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
        setIsTransitioning(false);
      }, 700); // Match this with your transition duration
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentIndex, movies.length]);

  const nextIndex = (currentIndex + 1) % movies.length;
  const currentMovie = movies[currentIndex];

  // Flash screen logic
  useEffect(() => {
    if (showFlash) {
      setHideLayout(true);
    } else {
      setHideLayout(false);
    }
  }, [showFlash, setHideLayout]);

  if (showFlash) {
    return <FlashScreen loading={loading} />;
  }

  if (showGlobalLoader) {
    return (
      <>
        <GlobalLoader />
      </>
    );
  }

  // Main page content
  const nextMovie = movies[(currentIndex + 1) % movies.length];
  return (
    <div className="bg-black min-w-[320px] py-[68px] min-h-[100dvh]">
      <div className="relative w-full h-[54vh] sm:h-[82vh] overflow-hidden">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex items-center justify-center w-full h-full">
              {/* Custom skeleton for banner */}
              <BannerSkeleton />
            </div>
          ) : movies.length > 0 ? (
            <div>
              {/* Current slide */}
              <motion.div
                key={`current-${currentIndex}`}
                className="absolute top-0 left-0 w-full h-full"
                initial={{ opacity: 1 }}
                animate={{ opacity: isTransitioning ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              >
                <div className="w-full h-[54vh] sm:h-[80vh] aspect-[16/9] relative">
                  {/* Banner skeleton overlays the image while loading */}
                  <BannerSkeleton />
                  {currentMovie?.image && (
                    <Image
                      src={currentMovie.image}
                      alt={currentMovie.title}
                      fill
                      className="object-cover transition-opacity duration-700"
                      style={{ zIndex: 1, opacity: 1 }}
                      priority
                      onLoadingComplete={(img) => {
                        img.style.opacity = "1";
                        // Optionally, you could hide the skeleton here if you want to control it with state
                      }}
                    />
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-full bg-black/[30%] flex items-end z-10">
                    <div className="text-white sm:px-10 px-3 sm:pb-10 pb-3  flex flex-col gap-2">
                      <h1 className="sm:text-[50px] text-[25px] font-bold">
                        {currentMovie.title}
                      </h1>
                      <p className="flex items-center gap-2 sm:text-[17px] text-[14px]">
                        <span className="bg-blue-700/[50%] px-2 rounded-sm">
                          {currentMovie.year}
                        </span>
                        <span className="flex items-center bg-blue-700/[50%] px-2 rounded-md">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          {currentMovie.rating} ({currentMovie.votes} votes)
                        </span>
                        <span className="bg-blue-700/[50%] px-2 rounded-sm">
                          {currentMovie.language?.toUpperCase()}
                        </span>
                      </p>
                      <p className="max-w-[700px] sm:text-[17px] text-[14px] line-clamp-2">
                        {currentMovie.description}
                      </p>
                      <div className="flex sm:gap-4 gap-2 items-center">
                        <button className="sm:text-[17px] text-[14px] flex items-center gap-2 bg-blue-700 sm:px-4 px-2 py-[5px] rounded-md cursor-pointer border-2 border-blue-700 hover:text-blue-700 hover:bg-transparent duration-500 transition-all">
                          <PlayCircle className="w-5 h-5 cursor-pointer" />
                          Watch Now
                        </button>
                        <button className="sm:text-[17px] text-[14px] flex items-center gap-2 bg-blue-700 sm:px-4 px-2 py-[5px] rounded-md cursor-pointer border-2 border-blue-700 hover:text-blue-700 hover:bg-transparent duration-500 transition-all">
                          <Bookmark className="w-5 h-5 cursor-pointer" />
                          Save to watch list
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Next slide */}
              {isTransitioning && (
                <motion.div
                  key={`next-${nextIndex}`}
                  className="absolute top-0 left-0 w-full h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                >
                  <div className="w-full h-[54vh] sm:h-[80vh] aspect-[16/9] relative">
                    {nextMovie?.image && (
                      <Image
                        src={nextMovie.image}
                        alt={nextMovie.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    )}
                    <div className="absolute bottom-0 left-0 w-full h-full bg-black/[30%] flex items-end">
                      <div className="text-white sm:px-10 px-3 sm:pb-10 pb-6 pt-[69px] flex flex-col gap-2">
                        <h1 className="sm:text-[50px] text-[25px] font-bold">
                          {nextMovie.title}
                        </h1>
                        <p className="flex items-center gap-2 sm:text-[17px] text-[14px]">
                          <span className="bg-blue-700/[50%] px-2 rounded-sm">
                            {nextMovie.year}
                          </span>
                          <span className="flex items-center bg-blue-700/[50%] px-2 rounded-md">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {nextMovie.rating} ({nextMovie.votes} votes)
                          </span>
                          <span className="bg-blue-700/[50%] px-2 rounded-sm">
                            {nextMovie.language?.toUpperCase()}
                          </span>
                        </p>
                        <p className="max-w-[600px] sm:text-[17px] text-[14px] line-clamp-2">
                          {nextMovie.description}
                        </p>
                        <div className="flex sm:gap-4 gap-2 items-center">
                          <button className="sm:text-[17px] text-[14px] flex items-center gap-2 bg-blue-700 sm:px-4 px-2 py-[5px] rounded-md cursor-pointer border-2 border-blue-700 hover:text-blue-700 hover:bg-transparent duration-500 transition-all">
                            <PlayCircle className="w-5 h-5 cursor-pointer" />
                            Watch Now
                          </button>
                          <button className="sm:text-[17px] text-[14px] flex items-center gap-2 bg-blue-700 sm:px-4 px-2 py-[5px] rounded-md cursor-pointer border-2 border-blue-700 hover:text-blue-700 hover:bg-transparent duration-500 transition-all">
                            <Bookmark className="w-5 h-5 cursor-pointer" />
                            Save to watch list
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-white text-xl">
              Error loading... Please refresh.
            </div>
          )}
        </AnimatePresence>
      </div>
      <Movies />
    </div>
  );
}
