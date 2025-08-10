import { NextRequest, NextResponse } from "next/server";
import redis from "../../../lib/redis";

// Types
type Source = {
  name: string;
  urlTemplate: string;
};

type TVCategory =
  | "Asian dramas"
  | "Anime"
  | "General / Hollywood TV"
  | "Drama"
  | "Science Fiction";
type TVSources = { [key in TVCategory]?: Source[] };
type Sources = { "TV Shows": TVSources; Movies: Source[] };

const commonSources: Source[] = [
  { name: "vidsrc.xyz", urlTemplate: "https://vidsrc.xyz/embed/movie/${id}" },
  { name: "vidsrc.pm", urlTemplate: "https://vidsrc.pm/embed/movie/${id}" },
  { name: "vidsrc.in", urlTemplate: "https://vidsrc.in/embed/movie/${id}" },
  { name: "vidsrc.net", urlTemplate: "https://vidsrc.net/embed/movie/${id}" },
];

const sources: Sources = {
  "TV Shows": {
    "Asian dramas": [
      {
        name: "vidsrc.xyz",
        urlTemplate: "https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.pm",
        urlTemplate: "https://vidsrc.pm/embed/tv/${id}/${season}/${episode}",
      },
    ],
    Drama: [
      {
        name: "vidsrc.xyz",
        urlTemplate: "https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.pm",
        urlTemplate: "https://vidsrc.pm/embed/tv/${id}/${season}/${episode}",
      },
    ],
    Anime: [
      {
        name: "vidsrc.xyz",
        urlTemplate: "https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.pm",
        urlTemplate: "https://vidsrc.pm/embed/tv/${id}/${season}/${episode}",
      },
    ],
    "General / Hollywood TV": [
      {
        name: "vidsrc.xyz",
        urlTemplate: "https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.pm",
        urlTemplate: "https://vidsrc.pm/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.in",
        urlTemplate: "https://vidsrc.in/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.net",
        urlTemplate: "https://vidsrc.net/embed/tv/${id}/${season}/${episode}",
      },
    ],
    "Science Fiction": [
      {
        name: "vidsrc.xyz",
        urlTemplate: "https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.pm",
        urlTemplate: "https://vidsrc.pm/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.in",
        urlTemplate: "https://vidsrc.in/embed/tv/${id}/${season}/${episode}",
      },
      {
        name: "vidsrc.net",
        urlTemplate: "https://vidsrc.net/embed/tv/${id}/${season}/${episode}",
      },
    ],
  },
  Movies: commonSources,
};

const processStreamRequest = async (
  type: string | null,
  category: string | null,
  id: string | null,
  season: string | null,
  episode: string | null
): Promise<NextResponse> => {
  const cacheKey = `stream:${type}:${id}:${season}:${episode}`;

  // Check cache first
  try {
    const cachedStreamUrl = await redis.get<string>(cacheKey);
    if (cachedStreamUrl) {
      return NextResponse.json({ streamUrl: cachedStreamUrl, fromCache: true });
    }
  } catch {
    console.error("Cache check error:");
  }

  // Determine source list
  let sourceList: Source[] | undefined;
  if (type === "TV Shows" && category && category in sources["TV Shows"]) {
    sourceList = sources["TV Shows"][category as TVCategory];
  } else if (type === "Movies") {
    sourceList = sources["Movies"];
  } else {
    return NextResponse.json(
      { error: "Invalid type or category" },
      { status: 400 }
    );
  }

  if (!sourceList || sourceList.length === 0) {
    return NextResponse.json(
      { error: "No sources found for this category" },
      { status: 404 }
    );
  }

  // Use the first available source
  const source = sourceList[0];

  try {
    const resolvedUrl = source.urlTemplate
      .replace("${id}", id || "")
      .replace("${season}", season || "")
      .replace("${episode}", episode || "");

    console.log(`Using source ${source.name} with URL: ${resolvedUrl}`);

    // Cache the URL for 1 hour
    await redis.set(cacheKey, resolvedUrl, { ex: 3600 });

    return NextResponse.json({
      streamUrl: resolvedUrl,
      fromCache: false,
      source: source.name,
      type: "embed",
    });
  } catch {
    console.error("Error processing stream request:");
    return NextResponse.json(
      { error: "Failed to process stream request" },
      { status: 500 }
    );
  }
};

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "clear-cache") {
    try {
      const keys = await redis.keys("stream:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return NextResponse.json({
        message: "Stream cache cleared successfully",
        clearedKeys: keys.length,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to clear cache" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const id = searchParams.get("id");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  return processStreamRequest(type, category, id, season, episode);
}
