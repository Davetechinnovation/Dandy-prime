
import { NextRequest, NextResponse } from "next/server";
const CONFIG = {
  FETCH_TIMEOUT: 8000,
};

const logError = (context: string, error: unknown, metadata?: object) => {
  let errorMessage = "";
  if (error && typeof error === "object" && "message" in error) {
    errorMessage = (error as { message?: string }).message || "";
  } else if (typeof error === "string") {
    errorMessage = error;
  }
  console.error(`[${context}]`, {
    errorMessage,
    ...metadata,
  });
};

const VALID_MEDIA_TYPES = ["movie", "tv", "anime", "kdrama"] as const;
type MediaType = (typeof VALID_MEDIA_TYPES)[number];

const SOURCE_CONFIG = {
  sonix: {
    domain: "https://sonix-movies.vercel.app",
    urlPattern: (mediaType: string, id: string) => `${mediaType}/${id}`,
  },
  vidsrc: {
    domain: "https://vidsrc.to",
    urlPattern: (mediaType: string, id: string) => `embed/${mediaType}/${id}`,
  },
  flixhq: {
    domain: "https://flixhq.to",
    urlPattern: (mediaType: string, id: string) => `embed/${mediaType}/${id}`,
  },
  goojara: {
    domain: "https://goojara.to",
    urlPattern: (mediaType: string, id: string) => `embed/${id}`,
  },
  zoro: {
    domain: "https://zoro.to",
    urlPattern: (mediaType: string, id: string) => `embed/${id}`,
  },
  dramacool: {
    domain: "https://dramacool.pa",
    urlPattern: (mediaType: string, id: string) => `embed/${id}`,
  },
  asiaflix: {
    domain: "https://asiaflix.net/home",
    urlPattern: (mediaType: string, id: string) => `embed/${id}`,
  },
};

const MOVIE_SOURCES = ["sonix", "vidsrc", "goojara", "flixhq"];
const TV_SOURCES = ["sonix", "asiaflix", "dramacool", "zoro"];

async function fetchFromSourceDirectly(
  sourceName: string,
  id: string,
  mediaType: MediaType
): Promise<{ response: Response; sourceName: string }> {
  const sourceConfig = SOURCE_CONFIG[sourceName as keyof typeof SOURCE_CONFIG];
  if (!sourceConfig) {
    throw new Error(`Invalid source: ${sourceName}`);
  }

  const targetUrl = `${sourceConfig.domain}/${sourceConfig.urlPattern(
    mediaType,
    id
  )}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

  try {
    console.log(`Fetching directly from ${sourceName}: ${targetUrl}`);
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: sourceConfig.domain,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Source ${sourceName} failed with status ${res.status}: ${errorBody}`
      );
    }
    return {
      response: res,
      sourceName: sourceName,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mediaTypeParam = request.nextUrl.searchParams.get("media_type");

  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    return new NextResponse("Invalid ID format", { status: 400 });
  }

  if (
    mediaTypeParam &&
    !VALID_MEDIA_TYPES.includes(mediaTypeParam as unknown as MediaType)
  ) {
    return new NextResponse("Invalid media type", { status: 400 });
  }
  const mediaType = mediaTypeParam as MediaType;

  const sources = mediaType === "tv" ? TV_SOURCES : MOVIE_SOURCES;

  try {
    console.log("Trying sources:", sources);
    const fetchPromises = sources.map((sourceName) =>
      fetchFromSourceDirectly(sourceName, id, mediaType)
    );
    const { response, sourceName } = await Promise.any(fetchPromises);
    console.log(`Success with source: ${sourceName}`);
    const html = await response.text();
    return NextResponse.json({ html, sourceName });
  } catch (error) {
    if (error instanceof AggregateError) {
      logError("All sources failed", error, {
        failures: error.errors.map((e: unknown) =>
          e instanceof Error ? e.message : String(e)
        ),
      });
    } else {
      logError("An unexpected error occurred during fetch", error);
    }
    return new NextResponse(
      "All streaming sources are currently unavailable.",
      {
        status: 502,
      }
    );
  }
}
