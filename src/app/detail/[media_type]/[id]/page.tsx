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
interface MovieDetails {
  id: number;
  title: string;
  rating: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  runtime: number;
  language: string;
  genres: GenreOrKeyword[];
  keywords: GenreOrKeyword[];
  trailer: Video | null;
  reviews_count: number;
  main_cast: Cast[];
  recommendations: unknown[];
  similar: unknown[];
  adult: boolean;
  vote_count: number;
}

import { useParams } from "next/navigation";
import Loader2 from "../../../Components/Loader2";

export default function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id, media_type } = params as { id: string; media_type: string };
  const [data, setData] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !media_type) return;
    setLoading(true);
    setError(null);
    fetch(`/api/home/details?id=${id}&media_type=${media_type}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch movie details");
        return res.json();
      })
      .then((json) => {
        setData(json);
        console.log("Fetched data:", json); // Added log
        console.log("Backdrop path:", json.backdrop_path);
        console.log("Poster path:", json.poster_path);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [id, media_type]);

  if (!id || !media_type) {
    return (
      <div className="text-white flex justify-center items-center h-screen">
        <p>Missing movie ID or media type.</p>
      </div>
    );
  }

  if (!isValidMediaType(media_type)) {
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
    return <Loader2 height={60} />;
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
    <main className="text-white sm:py-[71px] py-[85px]  ">
      <section className="grid items-center md:grid-cols-[760px_1fr] small:grid-cols-1 medium:grid-cols-[610px_1fr] grid-cols-1  gap-2">
        <div
          className="relative w-full sm:h-[355px] h-[205px] "
          style={{ height: "355px" }}
        >
          {data.backdrop_path ? (
            <ImageWithSkeleton
              src={imageBase + data.backdrop_path}
              alt={data.title}
              fill
              unoptimized
              priority
              className="object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 rounded-lg" />
          )}
          {/* Trailer button UI present but disabled */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-not-allowed opacity-50 select-none">
            <PlayCircleIcon className="w-10 h-10 fill-blue-700" />
          </div>
          <div
            className="max-w-[150px]  small:hidden h-[220px] absolute w-full -bottom-[70px] left-10 "
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
            {data.title ||
              (typeof data === "object" && "name" in data
                ? (data as { name?: string }).name
                : "")}
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
              {/* Trailer nav item UI present but disabled */}
              <li className="flex flex-col items-center text-[13px] sm:text-[15px] cursor-not-allowed opacity-50 select-none">
                <span>
                  <Play className="text-blue-700 w-5 h-5 " />
                </span>
                <span>Trailer</span>
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
          <div className="grid grid-cols-2 pt-6 gap-3">
            {/* Watch Trailer button UI present but disabled */}
            <button
              className="bg-blue-700 rounded-full sm:py-3 py-2 flex items-center gap-2 justify-center border-2 border-blue-700 duration-500 transition-all text-white opacity-50 cursor-not-allowed select-none"
              disabled
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
              className=" cursor-pointer bg-black border-2 border-blue-700 rounded-full px-2  focus:outline-none focus:ring-0"
            >
              <option value="1">Server 1</option>
              <option value="2">Server 2</option>
              <option value="3">Server 3</option>
              <option value="4">Server 4</option>
              <option value="5">Server 5</option>
              <option value="6">Server 6</option>
              <option value="7">Server 7</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-[20px] ">
            <select
              name="season"
              id="season"
              className=" cursor-pointer bg-black border-2 py-3 border-blue-700 rounded-full px-2  focus:outline-none focus:ring-0"
            >
              <option value="1">Season 1</option>
              <option value="2">Season 2</option>
              <option value="3">Season 3</option>
              <option value="4">Season 4</option>
              <option value="5">Season 5</option>
              <option value="6">Season 6</option>
              <option value="7">Season 7</option>
            </select>

            <select
              name="Episode"
              id="episode"
              className=" cursor-pointer bg-black border-2 border-blue-700 rounded-full px-2  focus:outline-none focus:ring-0"
            >
              <option value="1">Episode 1</option>
              <option value="2">Episode 2</option>
              <option value="3">Episode 3</option>
              <option value="4">Episode 4</option>
              <option value="5">Episode 5</option>
              <option value="6">Episode 6</option>
              <option value="7">Episode 7</option>
            </select>
          </div>

          <div className="border border-blue-700 rounded-full py-2 mt-2 px-2 cursor-pointer ">
            <div className="flex  gap-3 w-full justify-between  ">
              <h2>Episode information</h2>
              <p>
                <ChevronDown />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className=" small:pt-[0px] pt-[78px] px-4 ">
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
              <dd className="text-[144px] sm:text-[16px] ">
                {data.release_date}
              </dd>
            </div>
          </div>
          <div className="border-b border-b-blue-700 py-2">
            <div className="flex items-center justify-between max-w-[300px]   ">
              <dt>Runtime</dt>
              <dd className="text-[14px] sm:text-[16px] ">
                {data.runtime} minutes
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
                className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700"
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
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {data.main_cast.map((cast, idx) => (
                <div
                  key={cast.name + "-" + cast.character + "-" + idx}
                  className="min-w-[100px]  max-w-[150px]  "
                >
                  <ImageWithSkeleton
                    src={
                      cast.profile_path
                        ? imageBase + cast.profile_path
                        : "/images/cast-replacing.png"
                    }
                    alt={cast.name}
                    width={200}
                    height={100}
                    unoptimized
                    className="object-cover rounded-lg"
                  />
                  <p className="text-center mt-2 truncate ">{cast.name}</p>
                  <p className="text-center text-xs text-gray-400 truncate ">
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
                  className="px-10 py-[5px] cursor-pointer bg-blue-700 rounded-3xl hover:bg-transparent border-2 border-blue-700 duration-500 transition-all hover:text-blue-700"
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
                    <CardOverlay movieId={movie.id} mediaType={media_type} />
                  </div>
                  <p className="flex gap-3 items-center justify-between mt-1 text-sm">
                    <span className="truncate">{movie.title}</span>
                    <span>{movie.release_date?.slice(0, 4)}</span>
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
                    <CardOverlay movieId={movie.id} mediaType={media_type} />
                  </div>
                  <p className="flex gap-3 items-center justify-between mt-1 text-sm">
                    <span className="truncate">{movie.title}</span>
                    <span>{movie.release_date?.slice(0, 4)}</span>
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
