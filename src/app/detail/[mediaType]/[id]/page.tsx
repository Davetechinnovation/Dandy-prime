"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageWithSkeleton from "../../../Components/ImageWithSkeleton";
import Link from "next/link";
import CardOverlay from "@/app/Components/CardOverlay";
import { isValidMediaType } from "@/lib/utils";
import {
  AlertTriangleIcon,
  ArrowLeft,
  Bookmark,
  ChevronDown,
  Download,
  Play,
  PlayCircle,
  PlayCircleIcon,
  PlayIcon,
  Share2,
  Star,
  StarIcon,
} from "lucide-react";

interface Cast {
  name: string;
  profile_path: string | null;
  character: string;
}

interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
}

interface GenreOrKeyword {
  id: number;
  name: string;
}

interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number;
  season_number: number;
}

interface MovieDetails {
  id: number;
  title: string;
  name?: string; // For TV shows
  original_name?: string;
  status?: string;
  rating: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  runtime: number;
  episode_run_time?: number[];
  language: string;
  genres: GenreOrKeyword[];
  keywords: GenreOrKeyword[];
  trailer: Video | null;
  teaser: Video | null;
  reviews_count: number;
  main_cast: Cast[];
  recommendations: unknown[];
  similar: unknown[];
  adult: boolean;
  vote_count: number;
  seasons?: Season[];
}

import { useParams } from "next/navigation";
import Loader2 from "../../../Components/Loader2";


export default function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id, mediaType } = params as { id: string; mediaType: string };
  const [data, setData] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [streamHtml, setStreamHtml] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isEpisodeInfoVisible, setIsEpisodeInfoVisible] = useState(false);
  const [currentServer, setCurrentServer] = useState("1"); // Default to server 1
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [selectedEpisodeDetails, setSelectedEpisodeDetails] = useState<Episode | null>(null);
  const [episodeFetchStatus, setEpisodeFetchStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const serverMap: { [key: string]: string } = {
    vidsrc: "1",
    goojara: "2",
    flixhq: "3",
    dramacool: "4",
    asiaflix: "5",
    zoro: "6",
  };

  const handlePlayVideo = (key: string | null) => {
    if (key) {
      setVideoKey(key);
      setVideoLoading(true);
      setShowVideo(true);
      setShowStream(false); // Ensure stream is hidden when trailer plays
    }
  };

  const handlePlayStream = async () => {
    setStreamLoading(true);
    setShowStream(true);
    setStreamError(null);
    setStreamHtml(null);
    setShowVideo(false); // Ensure trailer is hidden when stream plays
    try {
      const res = await fetch(`/api/stream/${id}?mediaType=${mediaType}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch stream: ${res.status} ${res.statusText} - ${errorText}`);
      }
      const data = await res.json();
      setStreamHtml(data.html);
      if (data.sourceName && serverMap[data.sourceName]) {
        setCurrentServer(serverMap[data.sourceName]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load stream";
      setStreamError(errorMessage);
      console.error("Stream error:", errorMessage);
    } finally {
      setStreamLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !mediaType) return;
    setLoading(true);
    setError(null);
    fetch(`/api/home/details/${mediaType}/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch movie details");
        return res.json();
      })
      .then((json) => {
        setData(json);
        if (json.seasons) {
          setSeasons(json.seasons);
          if (json.seasons.length > 0) {
            setSelectedSeason(json.seasons[0].season_number.toString());
          }
        }
        console.log("Fetched data:", json); // Added log
        console.log("Backdrop path:", json.backdrop_path);
        console.log("Poster path:", json.poster_path);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [id, mediaType]);

  useEffect(() => {
    if (selectedSeason && mediaType === 'tv') {
      fetch(`/api/home/details/tv/${id}/season/${selectedSeason}`)
        .then(res => res.json())
        .then(data => {
          setEpisodes(data.episodes);
          if (data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0].episode_number.toString());
          }
        });
    }
  }, [selectedSeason, id, mediaType]);

  useEffect(() => {
    if (selectedEpisode && selectedSeason && mediaType === "tv") {
      setEpisodeFetchStatus("loading");
      setSelectedEpisodeDetails(null);
      fetch(
        `/api/home/details/tv/${id}/season/${selectedSeason}/episode/${selectedEpisode}`
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error("Episode not found");
          }
          return res.json();
        })
        .then((data) => {
          setSelectedEpisodeDetails(data);
          setEpisodeFetchStatus("success");
        })
        .catch(() => {
          setSelectedEpisodeDetails(null);
          setEpisodeFetchStatus("error");
        });
    }
  }, [selectedEpisode, selectedSeason, id, mediaType]);

  if (!id || !mediaType) {
    return (
      <div className="text-white flex justify-center items-center h-screen">
        <p>Missing movie ID or media type.</p>
      </div>
    );
  }

  if (!isValidMediaType(mediaType)) {
    return (
      <div className="text-white flex justify-center items-center h-screen">
        <p>Invalid media type.</p>
      </div>
    );
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return <Loader2 height={50} />;
  }
  if (error || !data) {
    return (
      <div className="text-white flex flex-col justify-center items-center min-h-[100vh] h-full p-10 text-center">
        <p>Error loading movie details.</p>
        <p className="text-red-400">{error}</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-blue-700 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  const imageBase = "https://image.tmdb.org/t/p/original";
  return (
    <main className="text-white sm:py-[71px] py-[85px] bg-[#0a0a0a] ">
      <section className="grid items-start md:grid-cols-[760px_1fr] small:grid-cols-1 medium:grid-cols-[610px_1fr] grid-cols-1  gap-2">
        <div className="relative w-full sm:h-[355px] h-[205px] bg-black">
          {showStream ? (
            <>
              {streamLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-10">
                  <Loader2 height={40} />
                </div>
              )}
              {streamError ? (
                <div className="w-full h-full flex flex-col justify-center items-center text-center p-4">
                  <p className="text-red-400">Error loading movie details.</p>
                  <p className="text-red-500 mb-4">{streamError}</p>
                  <button
                    onClick={handlePlayStream}
                    className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-600"
                  >
                    Refetch
                  </button>
                </div>
              ) : streamHtml && (
                <iframe
                  srcDoc={streamHtml}
                  title="Stream Player"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              )}
              <button
                onClick={() => setShowStream(false)}
                className="absolute top-2 right-2 z-20 bg-black bg-opacity-50 rounded-full p-1 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
          ) : showVideo && videoKey ? (
            <>
              {videoLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-10">
                  <Loader2 height={40} />
                </div>
              )}
              <iframe
                src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                onLoad={() => setVideoLoading(false)}
              ></iframe>
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-6 right-2 z-20 bg-black bg-opacity-50 rounded-full p-1 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
          ) : (
            <>
              {data.backdrop_path ? (
                <ImageWithSkeleton
                  src={imageBase + data.backdrop_path}
                  alt={data.title}
                  fill
                  unoptimized
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 rounded-lg" />
              )}
              <div
                onClick={handlePlayStream}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none"
              >
                <PlayCircleIcon className="w-10 h-10 fill-blue-700" />
              </div>
            </>
          )}
          <div
            className={`max-w-[150px] small:hidden h-[220px] absolute w-full -bottom-[70px] left-10 ${
              showVideo || showStream ? "hidden" : ""
            }`}
            style={{ height: "220px" }}
          >
            {data.poster_path ? (
              <ImageWithSkeleton
                src={imageBase + data.poster_path}
                alt={data.title}
                fill
                unoptimized
                className="object-cover rounded-lg "
              />
            ) : (
              <div className="w-full h-full bg-gray-800 rounded-lg" />
            )}
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
            {data.title || data.name}
          </h1>

          <p className="flex items-center gap-5 text-[15px] font-medium py-3 ">
            <span>{data.release_date?.slice(0, 4)}</span>
            <span className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />{" "}
              {data.rating} rating
            </span>
          </p>
          <nav
            className="border-blue-700 border-2 w-full rounded-lg"
            aria-label="Movie actions"
          >
            <ul className="flex items-center justify-between px-3 py-2 gap-2">
              <li
                onClick={() => handlePlayVideo(data.teaser?.key ?? null)}
                className={`flex flex-col items-center text-[13px] sm:text-[15px] ${
                  data.teaser?.key
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50 select-none"
                }`}
              >
                <span>
                  <Play className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Teaser</span>
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
          <div className="grid grid-cols-2 pt-3 gap-3">
            <button
              onClick={() => handlePlayVideo(data.trailer?.key ?? null)}
              className={`bg-blue-700 rounded-full sm:py-3 py-2 flex items-center gap-2 justify-center border-2 border-blue-700 duration-500 transition-all text-white ${
                !data.trailer?.key &&
                "opacity-50 cursor-not-allowed select-none"
              }`}
              disabled={!data.trailer?.key}
              type="button"
            >
              <span>
                <PlayCircle />
              </span>
              Watch Trailer
            </button>
            <select
              name="server"
              id="server"
              value={currentServer}
              onChange={(e) => setCurrentServer(e.target.value)}
              className=" cursor-pointer bg-black border-2 border-blue-700 rounded-full px-2 py-3 focus:outline-none focus:ring-0"
            >
              <option value="1">Vidsrc</option>
              <option value="2">Goojara</option>
              <option value="3">FlixHQ</option>
              <option value="4">Dramacool</option>
              <option value="5">Asiaflix</option>
              <option value="6">Zoro</option>
            </select>
          </div>

          {mediaType === "tv" && seasons && seasons.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 py-[10px] ">
                <select
                  name="season"
                  id="season"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className=" cursor-pointer bg-black border-2 border-blue-700 rounded-full px-2  focus:outline-none focus:ring-0"
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.season_number}>
                      Season {season.season_number}
                    </option>
                  ))}
                </select>

                <select
                  name="Episode"
                  id="episode"
                  value={selectedEpisode}
                  onChange={(e) => setSelectedEpisode(e.target.value)}
                  className=" cursor-pointer bg-black border-2 border-blue-700 rounded-full px-2 py-2 focus:outline-none focus:ring-0"
                >
                  {episodes.map((episode) => (
                    <option key={episode.id} value={episode.episode_number}>
                      Episode {episode.episode_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="smalli:relative pb-3  ">
                <div
                  className="border-2 w-full border-blue-700 rounded-full py-3 px-2 cursor-pointer "
                  onClick={() => setIsEpisodeInfoVisible(!isEpisodeInfoVisible)}
                >
                  <div className="flex items-center gap-3 w-full justify-between  ">
                    <h2>Episode information</h2>
                    <p>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isEpisodeInfoVisible ? "rotate-180" : ""
                        }`}
                      />
                    </p>
                  </div>
                </div>

                {isEpisodeInfoVisible && (
                  <div
                    className="rounded-lg p-3 border border-blue-700 w-full smalli:absolute top-14 left-0"
                    style={
                      episodeFetchStatus === 'loading'
                        ? { height: '100px' }
                        : { height: 'auto' }
                    }
                  >
                    {episodeFetchStatus === 'loading' && (
                      <div className="flex justify-center items-center w-full h-full">
                        <Loader2 height={40} />
                      </div>
                    )}
                    {episodeFetchStatus === 'error' && (
                       <div className="flex justify-center items-center w-full h-[150px]">
                        <p>Episode details not available.</p>
                      </div>
                    )}
                    {episodeFetchStatus === 'success' && selectedEpisodeDetails && (
                      <>
                        <div className="flex justify-center items-center w-full h-[150px] overflow-hidden relative bg-gray-800 rounded-lg">
                          {selectedEpisodeDetails.still_path ? (
                            <ImageWithSkeleton
                              src={`${imageBase}${selectedEpisodeDetails.still_path}`}
                              alt={
                                selectedEpisodeDetails.name || "Episode image"
                              }
                              width={0}
                              height={0}
                              unoptimized
                              className="w-full h-auto object-cover rounded-xl"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col justify-center items-center">
                              <Loader2 height={40} />
                              <p className="text-white text-sm mt-2">
                                Image not available
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 ">
                          {selectedEpisodeDetails.name && (
                            <p className="text-[16px] font-bold ">
                              S{selectedEpisodeDetails.season_number} E
                              {selectedEpisodeDetails.episode_number}:{" "}
                              {selectedEpisodeDetails.name}
                            </p>
                          )}
                          {selectedEpisodeDetails.air_date && (
                            <p className="py-2">
                              <span className="font-medium text-[15px]">
                                Release date:
                              </span>{" "}
                              <span className="text-[13px]">
                                {selectedEpisodeDetails.air_date}
                              </span>
                            </p>
                          )}
                          {selectedEpisodeDetails.overview && (
                            <p>
                              <span className="font-medium text-[15px]">
                                Episode description:
                              </span>{" "}
                              <span className="text-[13px]">
                                {selectedEpisodeDetails.overview}
                              </span>
                            </p>
                          )}
                          {selectedEpisodeDetails.runtime > 0 && (
                            <p className="py-2">
                              <span className="font-medium text-[15px]">
                                Runtime:
                              </span>{" "}
                              <span className="text-[13px]">
                                {selectedEpisodeDetails.runtime} minutes
                              </span>
                            </p>
                          )}
                        </div>
                        <button className=" flex justify-center items-center gap-2 w-full bg-blue-700 py-2 border-2 border-blue-700 hover:bg-transparent duration-500 transition-all rounded-lg">
                          {" "}
                          <span>
                            <PlayIcon />
                          </span>{" "}
                          <span>Play Now</span>{" "}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className=" small:pt-[0] pt-[78px]  px-4 ">
        <div className=" max-w-[400px] w-full py-4">
          <div className=" grid grid-cols-[1fr_2fr] w-full">
            <div className="">
              <h2 className="text-[25px] font-semibold">{data.rating}</h2>
              <p className="flex items-center gap-1">
                {[...Array(Math.round(data.rating / 2)).keys()].map((i) => (
                  <StarIcon
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400 "
                  />
                ))}
              </p>
              <p>{data.reviews_count} (reviews)</p>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Rating</span>
                <span className="text-sm font-bold">{data.rating}/10</span>
              </div>
              <div className="max-w-[260px] w-full flex gap-2 items-center h-[10px] relative rounded-full bg-[#cecece] mt-2">
                <span
                  className="rounded-full h-full bg-blue-700 absolute inset-0"
                  style={{
                    width: `${Math.round((data.rating / 10) * 100)}%`,
                  }}
                ></span>
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
              <dt className="text-[14px] sm:text-[16px] ">Released Date</dt>
              <dd className="text-[14px] sm:text-[16px] ">
                {data.release_date}
              </dd>
            </div>
          </div>
          <div className="border-b border-b-blue-700 py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt>Runtime</dt>
              <dd className="text-[14px] sm:text-[16px] ">
                {mediaType === "tv" && data.episode_run_time && data.episode_run_time.length > 0
                  ? `${data.episode_run_time[0]} minutes`
                  : `${data.runtime} minutes`}
              </dd>
            </div>
          </div>
          <div className="border-b border-b-blue-700 py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt>Original Name</dt>
              <dd className="text-[14px] sm:text-[16px] ">
                {data.original_name || data.name}
              </dd>
            </div>
          </div>
          <div className="border-b border-b-blue-700 py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt>Status</dt>
              <dd className="text-[14px] sm:text-[16px] ">
                {data.status}
              </dd>
            </div>
          </div>
          <div className="py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt className="text-[14px] sm:text-[16px] ">Language</dt>
              <dd className="text-[14px] sm:text-[16px] ">{data.language}</dd>
            </div>
          </div>
        </dl>
      </section>
      {data.genres && data.genres.length > 0 && (
        <section className="py-6 px-2  gap-2 ">
          <h2 className="text-[25px] font-semibold  my-3 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
            Genre
          </h2>
          <div className="flex flex-wrap items-center gap-3 ">
            {data.genres.map((genre) => (
              <Link
                key={String(genre.id)}
                href={`/search/genre/${genre.id}?name=${encodeURIComponent(
                  genre.name
                )}`}
                className=" text-[13px] sm:text-[16px] px-10 py-[2px] sm:py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700"
              >
                {genre.name}
              </Link>
            ))}
          </div>
          <p className="text-white opacity-40 pt-3 ">
            {data.adult ? "18+" : "PG-13"}
          </p>
        </section>
      )}
      <section className="px-4">
        <h2 className="text-[25px] font-semibold  my-3 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
          Plot
        </h2>
        <p className="text-[14px] sm:text-[16px] ">{data.overview}</p>
        {data.main_cast && data.main_cast.length > 0 && (
          <>
            <h2 className="text-[25px] font-semibold  my-3 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
              Cast
            </h2>
            <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
              {data.main_cast.map((cast, idx) => (
                <div
                  key={cast.name + "-" + cast.character + "-" + idx}
                  className="flex flex-col items-center w-[150px] flex-shrink-0"
                >
                  <div className="relative w-full h-[225px] rounded-lg overflow-hidden">
                    <ImageWithSkeleton
                      src={
                        cast.profile_path
                          ? imageBase + cast.profile_path
                          : "/images/cast-replacing.png"
                      }
                      alt={cast.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <p className="text-center mt-2 truncate w-full">{cast.name}</p>
                  <p className="text-center text-xs text-gray-400 truncate w-full">
                    {cast.character}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        {data.keywords && data.keywords.length > 0 && (
          <>
            <h2 className="text-[25px] font-semibold  my-4 border-b-2 border-b-blue-700 max-w-[50px] w-full ">
              Keywords
            </h2>
            <div className="flex flex-wrap items-center gap-3 ">
              {data.keywords.map((kw) => (
                <Link
                  key={String(kw.id)}
                  href={`/search/keyword/${kw.id}?name=${encodeURIComponent(
                    kw.name
                  )}`}
                  className=" text-[13px] sm:text-[16px] px-10 py-[2px] sm:py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700"
                >
                  {kw.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
      {data.recommendations && data.recommendations.length > 0 && (
        <section className="px-3">
          <h2 className="text-[25px] font-semibold my-4 border-b-2 max-w-[360px] w-full border-b-blue-700">
            Recommended after watching
          </h2>

          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
            {data.recommendations.map((rec) => {
              const movie = rec as MovieDetails;
              return (
                <div key={String(movie.id)} className="min-w-[100px] w-[150px]">
                  <div
                    className="relative w-full h-[200px] rounded-lg overflow-hidden"
                    style={{ height: "200px" }}
                  >
                    {movie.poster_path ? (
                      <ImageWithSkeleton
                        src={imageBase + movie.poster_path}
                        alt={movie.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800" />
                    )}
                    <CardOverlay movieId={movie.id} mediaType={mediaType} />
                  </div>
                  <p className="flex gap-3 items-center justify-between mt-1 text-sm">
                    <span className="truncate">{movie.title || movie.name}</span>
                    <span>{(movie.release_date || movie.first_air_date)?.slice(0, 4)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {data.similar && data.similar.length > 0 && (
        <section className="px-3">
          <h2 className="text-[25px] font-semibold my-4 border-b-2 max-w-[230px] border-b-blue-700">
            Similar Movies
          </h2>

          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
            {data.similar.map((sim) => {
              const movie = sim as MovieDetails;
              return (
                <div key={String(movie.id)} className="min-w-[100px] w-[150px]">
                  <div
                    className="relative w-full h-[200px] rounded-lg overflow-hidden"
                    style={{ height: "200px" }}
                  >
                    {movie.poster_path ? (
                      <ImageWithSkeleton
                        src={imageBase + movie.poster_path}
                        alt={movie.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800" />
                    )}
                    <CardOverlay movieId={movie.id} mediaType={mediaType} />
                  </div>
                  <p className="flex gap-3 items-center justify-between mt-1 text-sm">
                    <span className="truncate">{movie.title || movie.name}</span>
                    <span>{(movie.release_date || movie.first_air_date)?.slice(0, 4)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
