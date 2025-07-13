import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import redis from "@/lib/redis";

// Type for a watchlist item
interface WatchlistItem {
  id: string;
  [key: string]: any;
}

// POST: Sync offline watchlist data to Redis
export async function POST(req: NextRequest) {
  try {
    const data: WatchlistItem[] = await req.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "No watchlist data provided." }, { status: 400 });
    }

    // Store each item in Redis under a user's key (for demo, use a global key)
    // In production, use user/session ID for multi-user support
    const redisKey = "watchlist:offline";
    const pipeline = redis.multi();
    for (const item of data) {
      if (!item.id) continue;
      pipeline.hset(redisKey, { [item.id]: JSON.stringify(item) });
    }
    await pipeline.exec();

    return NextResponse.json({ success: true, count: data.length }, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
