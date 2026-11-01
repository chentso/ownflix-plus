import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/mp4",
  ".avi": "video/mp4",
  ".ts": "video/mp4",
};

export type QualityPreset = "original" | "1080p" | "720p" | "480p" | "360p";

interface TranscodeProfile {
  maxWidth: number | null;
  crf: string;
  maxrate: string;
  bufsize: string;
  audioBitrate: string;
  label: string;
}

const QUALITY_PROFILES: Record<Exclude<QualityPreset, "original">, TranscodeProfile> = {
  "1080p": {
    maxWidth: 1920,
    crf: "23",
    maxrate: "4500k",
    bufsize: "9000k",
    audioBitrate: "160k",
    label: "1080p HD (4.5 Mbps)",
  },
  "720p": {
    maxWidth: 1280,
    crf: "24",
    maxrate: "2200k",
    bufsize: "4400k",
    audioBitrate: "128k",
    label: "720p HD (2.2 Mbps)",
  },
  "480p": {
    maxWidth: 854,
    crf: "26",
    maxrate: "900k",
    bufsize: "1800k",
    audioBitrate: "96k",
    label: "480p SD (900 Kbps)",
  },
  "360p": {
    maxWidth: 640,
    crf: "28",
    maxrate: "450k",
    bufsize: "900k",
    audioBitrate: "64k",
    label: "360p Data Saver (450 Kbps)",
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId");
  const episodeId = searchParams.get("episodeId");
  const rawQuality = (searchParams.get("quality") || "original") as QualityPreset;
  const quality: QualityPreset =
    rawQuality in QUALITY_PROFILES ? rawQuality : "original";
  const forceTranscode =
    searchParams.get("transcode") === "1" || quality !== "original";
  const forceRemuxOnly = searchParams.get("remux") === "1";
  const startTime = Math.max(
    0,
    parseFloat(searchParams.get("start") || "0") || 0
  );

  let filePath: string | null = null;
  let remoteUrl: string | null = null;
  let totalDuration = 0;

  if (episodeId) {
    const ep = await prisma.episode.findUnique({ where: { id: episodeId } });
    if (!ep) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }
    filePath = ep.filePath;
    remoteUrl = ep.videoUrl;
    totalDuration = ep.duration || 0;
  } else if (mediaId) {
    const media = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    filePath = media.filePath;
    remoteUrl = media.videoUrl;
    totalDuration = media.duration || 0;
  } else {
    return NextResponse.json(
      { error: "Missing mediaId or episodeId" },
      { status: 400 }
    );
  }

  // If no local file path, check if we should transcode a remote stream or redirect
  if (!filePath) {
    if (remoteUrl && remoteUrl.startsWith("http")) {
      if (!forceTranscode) {
        return NextResponse.redirect(remoteUrl);
      }
      // Allow FFmpeg low-bandwidth transcoding even for remote HTTP streams
      filePath = remoteUrl;
    } else {
      return NextResponse.json(
        { error: "No media source associated with this item" },
        { status: 404 }
      );
    }
  } else if (!filePath.startsWith("http") && !fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `Local file not found on disk: ${filePath}` },
      { status: 404 }
    );
  }

  const isRemoteInput = filePath.startsWith("http");
  const ext = isRemoteInput ? ".mp4" : path.extname(filePath).toLowerCase();
  const needsFfmpegStream =
    forceTranscode ||
    isRemoteInput ||
    ext === ".mkv" ||
    ext === ".avi" ||
    ext === ".ts";

  if (needsFfmpegStream) {
    const args: string[] = [];
    if (startTime > 0) {
      args.push("-ss", String(startTime));
    }
    args.push("-i", filePath);

    const profile =
      quality !== "original" ? QUALITY_PROFILES[quality] : null;

    if (forceRemuxOnly && !forceTranscode && !profile) {
      args.push("-c:v", "copy");
    } else if (profile) {
      // Bandwidth-constrained transcode with resolution scaling & bitrate cap
      args.push(
        "-vf",
        `scale='min(${profile.maxWidth},iw)':-2`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-tune",
        "zerolatency",
        "-crf",
        profile.crf,
        "-maxrate",
        profile.maxrate,
        "-bufsize",
        profile.bufsize,
        "-pix_fmt",
        "yuv420p"
      );
    } else {
      // Original quality H.264 stream (for MKV/HEVC compatibility)
      args.push(
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "21",
        "-maxrate",
        "8000k",
        "-bufsize",
        "16000k",
        "-pix_fmt",
        "yuv420p"
      );
    }

    args.push(
      "-c:a",
      "aac",
      "-ac",
      "2",
      "-b:a",
      profile ? profile.audioBitrate : "192k",
      "-sn",
      "-movflags",
      "frag_keyframe+empty_moov+default_base_moof",
      "-f",
      "mp4",
      "pipe:1"
    );

    const ffmpegProc = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "ignore"],
    });

    const webStream = new ReadableStream({
      start(controller) {
        ffmpegProc.stdout.on("data", (chunk: Buffer) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch {
            ffmpegProc.kill("SIGKILL");
          }
        });
        ffmpegProc.stdout.on("end", () => {
          try {
            controller.close();
          } catch {
            // Ignore already closed
          }
        });
        ffmpegProc.on("error", (err) => {
          try {
            controller.error(err);
          } catch {
            // Ignore
          }
        });
      },
      cancel() {
        ffmpegProc.kill("SIGKILL");
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store",
        "X-OwnFlix-Stream-Mode": profile
          ? `ffmpeg-transcode-${quality}`
          : forceRemuxOnly
          ? "ffmpeg-remux"
          : "ffmpeg-transcode-original",
        "X-OwnFlix-Duration": String(totalDuration),
      },
    });
  }

  // Direct Play via HTTP 206 Byte-Range Streaming
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");
  const contentType = MIME_TYPES[ext] || "video/mp4";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? Math.min(parseInt(parts[1], 10), fileSize - 1)
      : Math.min(start + 4 * 1024 * 1024 - 1, fileSize - 1);

    if (start >= fileSize || start < 0) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileSize}`,
        },
      });
    }

    const chunkSize = end - start + 1;
    const nodeStream = fs.createReadStream(filePath, { start, end });

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer | string) => {
          const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          try {
            controller.enqueue(new Uint8Array(buf));
          } catch {
            nodeStream.destroy();
          }
        });
        nodeStream.on("end", () => {
          try {
            controller.close();
          } catch {
            // Ignore
          }
        });
        nodeStream.on("error", (err) => {
          try {
            controller.error(err);
          } catch {
            // Ignore
          }
        });
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
        "X-OwnFlix-Stream-Mode": "direct-range",
        "X-OwnFlix-Duration": String(totalDuration),
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer | string) => {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        try {
          controller.enqueue(new Uint8Array(buf));
        } catch {
          nodeStream.destroy();
        }
      });
      nodeStream.on("end", () => {
        try {
          controller.close();
        } catch {
          // Ignore
        }
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "Content-Type": contentType,
      "X-OwnFlix-Stream-Mode": "direct-full",
      "X-OwnFlix-Duration": String(totalDuration),
    },
  });
}
