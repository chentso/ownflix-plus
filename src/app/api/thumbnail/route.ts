import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { spawn } from "child_process";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory LRU cache for extracted JPEG seek thumbnails (key: `${sourceKey}:${bucketSec}`)
const MAX_CACHE_ITEMS = 400;
const thumbnailCache = new Map<string, Buffer>();
const inFlightExtractions = new Map<string, Promise<Buffer | null>>();

function setCachedThumbnail(key: string, buf: Buffer) {
  if (thumbnailCache.size >= MAX_CACHE_ITEMS) {
    const oldestKey = thumbnailCache.keys().next().value;
    if (oldestKey) thumbnailCache.delete(oldestKey);
  }
  thumbnailCache.set(key, buf);
}

function extractFrameWithFfmpeg(
  inputSource: string,
  timeSec: number
): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const args = [
      "-ss",
      String(timeSec),
      "-i",
      inputSource,
      "-frames:v",
      "1",
      "-vf",
      "scale=240:-2",
      "-q:v",
      "5",
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "pipe:1",
    ];

    const proc = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "ignore"],
    });

    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      resolve(null);
    }, 6000);

    proc.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    proc.stdout.on("end", () => {
      clearTimeout(timer);
      if (chunks.length === 0) {
        resolve(null);
      } else {
        resolve(Buffer.concat(chunks));
      }
    });

    proc.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId");
  const episodeId = searchParams.get("episodeId");
  const rawTime = parseFloat(searchParams.get("t") || "0") || 0;

  // Snap to 5-second intervals for high cache hit rate while scrubbing
  const bucketSec = Math.max(0, Math.floor(rawTime / 5) * 5);

  let filePath: string | null = null;
  let remoteUrl: string | null = null;
  let sourceKey = "";

  if (episodeId) {
    const ep = await prisma.episode.findUnique({
      where: { id: episodeId },
      select: { id: true, filePath: true, videoUrl: true },
    });
    if (!ep) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }
    filePath = ep.filePath;
    remoteUrl = ep.videoUrl;
    sourceKey = `ep:${ep.id}`;
  } else if (mediaId) {
    const media = await prisma.mediaItem.findUnique({
      where: { id: mediaId },
      select: { id: true, filePath: true, videoUrl: true },
    });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    filePath = media.filePath;
    remoteUrl = media.videoUrl;
    sourceKey = `media:${media.id}`;
  } else {
    return NextResponse.json(
      { error: "Missing mediaId or episodeId" },
      { status: 400 }
    );
  }

  let inputSource: string | null = null;
  if (filePath && (filePath.startsWith("http") || fs.existsSync(filePath))) {
    inputSource = filePath;
  } else if (remoteUrl && remoteUrl.startsWith("http")) {
    inputSource = remoteUrl;
  }

  if (!inputSource) {
    return NextResponse.json(
      { error: "No valid video source for thumbnail" },
      { status: 404 }
    );
  }

  const cacheKey = `${sourceKey}:${bucketSec}`;
  const cached = thumbnailCache.get(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  let promise = inFlightExtractions.get(cacheKey);
  if (!promise) {
    promise = extractFrameWithFfmpeg(inputSource, bucketSec).finally(() => {
      inFlightExtractions.delete(cacheKey);
    });
    inFlightExtractions.set(cacheKey, promise);
  }

  const frameBuffer = await promise;
  if (!frameBuffer) {
    return NextResponse.json(
      { error: "Could not extract thumbnail frame" },
      { status: 404 }
    );
  }

  setCachedThumbnail(cacheKey, frameBuffer);

  return new NextResponse(new Uint8Array(frameBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
