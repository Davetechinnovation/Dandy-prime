import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

// 3. Configuration Management
const CONFIG = {
  CACHE_TTL: 1800, // 30 minutes
  FETCH_TIMEOUT: 8000,
  CACHE_CHECK_TIMEOUT: 3000,
  MAX_RETRIES: 2,
} as const;

// 1. Error Handling & Logging
const logError = (context: string, error: unknown, metadata?: object) => {
  let errorMessage = '';
  if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = (error as { message?: string }).message || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  console.error(`[${context}]`, {
    errorMessage,
    ...metadata,
  });
};

// 2. Input Validation & Security
const VALID_MEDIA_TYPES = ["movie", "tv", "anime", "kdrama"] as const;
type MediaType = (typeof VALID_MEDIA_TYPES)[number];

type Source = {
  name: string;
  url: string;
};

const ALL_SOURCES: Source[] = [
  { name: "vidsrc", url: "https://dandy-prime-streamer.dandy-tv.workers.dev" },
  { name: "flixhq", url: "https://dandy-prime-streamer.dandy-tv.workers.dev" },
  { name: "goojara", url: "https://dandy-prime-streamer.dandy-tv.workers.dev" },
  { name: "zoro", url: "https://dandy-prime-streamer.dandy-tv.workers.dev" },
  {
    name: "dramacool",
    url: "https://dandy-prime-streamer.dandy-tv.workers.dev",
  },
  {
    name: "asiaflix",
    url: "https://dandy-prime-streamer.dandy-tv.workers.dev",
  },
];

const WORKER_SECRET = process.env.WORKER_SECRET;
if (!WORKER_SECRET) {
  console.warn("WORKER_SECRET not configured - API calls may fail");
}

// Define source groups for the new two-tiered logic
const MOVIE_SOURCES = {
  primary: ["vidsrc", "goojara", "flixhq"],
  fallback: ["asiaflix", "dramacool", "zoro"],
};

const TV_SOURCES = {
  primary: ["asiaflix", "dramacool", "zoro"],
  fallback: ["vidsrc", "flixhq", "goojara"],
};

// Helper to get full source objects from a list of names
function getSourcesByNames(names: string[]): Source[] {
  return names
    .map((name) => ALL_SOURCES.find((s) => s.name === name))
    .filter((s): s is Source => s !== undefined);
}

// 4. Robust Caching Strategy
async function getCachedUrl(cacheKey: string): Promise<string | null> {
  try {
    const cachedUrl = await redis.get<string>(cacheKey);
    if (!cachedUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      CONFIG.CACHE_CHECK_TIMEOUT
    );

    try {
      const response = await fetch(cachedUrl, {
        method: "HEAD",
        headers: { "X-Your-Secret-Key": WORKER_SECRET || "" },
        signal: controller.signal,
      });

      if (response.ok) {
        console.log(`Cache validation successful for ${cacheKey}`);
        return cachedUrl;
      } else {
        logError(
          "Cached URL validation failed",
          new Error(`Status ${response.status}`),
          { cacheKey }
        );
        await redis.del(cacheKey);
        return null;
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    logError("Cache validation failed", error, { cacheKey });
    return null;
  }
}

// 6. Better Response Handling
async function streamResponse(
  response: Response,
  sourceName: string
): Promise<NextResponse> {
  const html = await response.text();
  return NextResponse.json({ html, sourceName });
}

async function fetchFromSource(
  source: Source,
  id: string,
  mediaType: MediaType | null
): Promise<{ response: Response; successfulUrl: string; sourceName: string }> {
  const workerUrl = new URL(source.url);
  workerUrl.searchParams.append("id", id);
  workerUrl.searchParams.append("source", source.name);
  if (mediaType) {
    workerUrl.searchParams.append("media_type", mediaType);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

  try {
    const res = await fetch(workerUrl.toString(), {
      headers: { "X-Your-Secret-Key": WORKER_SECRET || "" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Source ${source.name} failed with status ${res.status}`);
    }
    return {
      response: res,
      successfulUrl: workerUrl.toString(),
      sourceName: source.name,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const startTime = Date.now();
  const id = params.id;
  const mediaTypeParam = request.nextUrl.searchParams.get("media_type");

  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    return new NextResponse("Invalid ID format", { status: 400 });
  }

  if (mediaTypeParam && !VALID_MEDIA_TYPES.includes(mediaTypeParam as unknown as MediaType)) {
    return new NextResponse("Invalid media type", { status: 400 });
  }
  const mediaType = mediaTypeParam as MediaType | null;

  const cacheKey = `stream:${mediaType}:${id}`;

  const cachedUrl = await getCachedUrl(cacheKey);
  if (cachedUrl) {
    console.log(`Cache hit for ${cacheKey}.`);
    // Extract source name from cached URL for consistent response format
    const url = new URL(cachedUrl);
    const sourceName = url.searchParams.get("source") || "unknown";
    const response = await fetch(cachedUrl, {
      headers: { "X-Your-Secret-Key": WORKER_SECRET || "" },
    });
    return streamResponse(response, sourceName);
  }

  console.log(`Cache miss for ${cacheKey}. Trying sources...`);

  let primarySources: Source[];
  let fallbackSources: Source[];

  // If the media type is 'tv', use the TV source priority. Otherwise, default to movie logic.
  if (mediaType === "tv") {
    primarySources = getSourcesByNames(TV_SOURCES.primary);
    fallbackSources = getSourcesByNames(TV_SOURCES.fallback);
  } else {
    // Default to movie logic for 'movie' and any other case
    primarySources = getSourcesByNames(MOVIE_SOURCES.primary);
    fallbackSources = getSourcesByNames(MOVIE_SOURCES.fallback);
  }

  // Helper to handle caching and response streaming on success
  const handleSuccess = async (
    response: Response,
    successfulUrl: string,
    sourceName: string
  ) => {
    await redis.set(cacheKey, successfulUrl, { ex: CONFIG.CACHE_TTL });
    console.log(
      `Cached ${successfulUrl} for ${CONFIG.CACHE_TTL / 60} minutes.`
    );

    await redis.incr(`source:${sourceName}:success_count`);
    await redis.set(`source:${sourceName}:last_success`, Date.now());
    console.log(
      `Request completed in ${
        Date.now() - startTime
      }ms using source: ${sourceName}`
    );

    return streamResponse(response, sourceName);
  };

  // --- Attempt 1: Primary Sources ---
  if (primarySources.length > 0) {
    try {
      console.log(
        "Trying primary sources:",
        primarySources.map((s) => s.name)
      );
      const fetchPromises = primarySources.map((source) =>
        fetchFromSource(source, id, mediaType)
      );
      const { response, successfulUrl, sourceName } = await Promise.any(
        fetchPromises
      );
      console.log(`Success with primary source: ${sourceName}`);
      return await handleSuccess(response, successfulUrl, sourceName);
    } catch (error) {
      if (error instanceof AggregateError) {
        logError("All primary sources failed", error, {
          failures: (error as AggregateError).errors.map((e: unknown) => (e && typeof e === 'object' && 'message' in e ? (e as { message?: string }).message : String(e))),
          cacheKey,
        });
      } else {
        logError("An unexpected error occurred during primary fetch", error, {
          cacheKey,
        });
      }
    }
  }

  // --- Attempt 2: Fallback Sources ---
  if (fallbackSources.length > 0) {
    try {
      console.log(
        "Trying fallback sources:",
        fallbackSources.map((s) => s.name)
      );
      const fetchPromises = fallbackSources.map((source) =>
        fetchFromSource(source, id, mediaType)
      );
      const { response, successfulUrl, sourceName } = await Promise.any(
        fetchPromises
      );
      console.log(`Success with fallback source: ${sourceName}`);
      return await handleSuccess(response, successfulUrl, sourceName);
    } catch (error) {
      if (error instanceof AggregateError) {
        logError("All fallback sources also failed", error, {
          failures: (error as AggregateError).errors.map((e: unknown) => (e && typeof e === 'object' && 'message' in e ? (e as { message?: string }).message : String(e))),
          cacheKey,
        });
      } else {
        logError("An unexpected error occurred during fallback fetch", error, {
          cacheKey,
        });
      }
    }
  }

  return new NextResponse("All streaming sources are currently unavailable.", {
    status: 502,
  });
}
