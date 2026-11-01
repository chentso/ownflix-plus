import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";

function srtToVtt(srtContent: string): string {
  const normalized = srtContent
    .replace(/\r\n/g, "\n")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${normalized}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId");
  const episodeId = searchParams.get("episodeId");
  const trackIdx = Math.max(
    0,
    parseInt(searchParams.get("trackIndex") || "0", 10) || 0
  );
  const lang = searchParams.get("lang") || "English [CC]";
  const title = searchParams.get("title") || "OwnFlix+ Presentation";

  let localFilePath: string | null = null;
  if (episodeId) {
    const ep = await prisma.episode.findUnique({ where: { id: episodeId } });
    localFilePath = ep?.filePath || null;
  } else if (mediaId) {
    const media = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
    localFilePath = media?.filePath || null;
  }

  // 1. Check for sidecar .vtt or .srt file or embedded subtitle streams in MKV/MP4
  if (localFilePath && fs.existsSync(localFilePath)) {
    const base = localFilePath.replace(/\.[^/.]+$/, "");
    const vttPath = `${base}.vtt`;
    const srtPath = `${base}.srt`;
    if (fs.existsSync(vttPath)) {
      const content = fs.readFileSync(vttPath, "utf-8");
      return new NextResponse(content, {
        headers: { "Content-Type": "text/vtt; charset=utf-8" },
      });
    }
    if (fs.existsSync(srtPath)) {
      const content = fs.readFileSync(srtPath, "utf-8");
      return new NextResponse(srtToVtt(content), {
        headers: { "Content-Type": "text/vtt; charset=utf-8" },
      });
    }

    // Extract embedded subtitle stream directly using ffmpeg
    try {
      const { stdout } = await execFileAsync(
        "ffmpeg",
        [
          "-v",
          "error",
          "-i",
          localFilePath,
          "-map",
          `0:s:${trackIdx}`,
          "-f",
          "webvtt",
          "-",
        ],
        { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
      );
      if (stdout && stdout.includes("WEBVTT")) {
        return new NextResponse(stdout, {
          headers: {
            "Content-Type": "text/vtt; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } catch {
      // No embedded text subtitle track at this index; fall through
    }
  }

  // 2. Fallback captions for built-in demo streams
  const isSpanish = lang.toLowerCase().includes("espa");
  const isFrench = lang.toLowerCase().includes("fran");

  const lines = isSpanish
    ? [
        ["00:00:01.000", "00:00:05.000", `♪ [Música cinemática de apertura - ${title}] ♪`],
        ["00:00:05.500", "00:00:11.000", "[Secuencia de introducción en curso — Puedes saltar la intro]"],
        ["00:00:12.000", "00:00:18.000", "Todos los sistemas están conectados. Iniciando transmisión segura."],
        ["00:00:19.000", "00:00:26.000", "No tenemos mucho tiempo antes de que cierren el sector principal."],
        ["00:00:27.000", "00:00:35.000", "Mantén la frecuencia estable. La señal viene desde dentro de la red."],
        ["00:00:36.000", "00:00:45.000", "♪ [Tensión instrumental en aumento] ♪"],
        ["00:00:46.000", "00:01:05.000", "Recuerda por qué empezamos esta misión. No hay vuelta atrás."],
      ]
    : isFrench
    ? [
        ["00:00:01.000", "00:00:05.000", `♪ [Musique cinématographique d'ouverture - ${title}] ♪`],
        ["00:00:05.500", "00:00:11.000", "[Séquence d'introduction en cours]"],
        ["00:00:12.000", "00:00:18.000", "Tous les systèmes sont en ligne. Transmission sécurisée activée."],
        ["00:00:19.000", "00:00:26.000", "Il nous reste peu de temps avant le verrouillage du secteur."],
        ["00:00:27.000", "00:00:35.000", "Gardez la fréquence stable. Le signal provient du réseau central."],
        ["00:00:36.000", "00:00:45.000", "♪ [Musique intense] ♪"],
        ["00:00:46.000", "00:01:05.000", "N'oubliez pas pourquoi nous avons commencé cette mission."],
      ]
    : [
        ["00:00:01.000", "00:00:05.000", `♪ [Atmospheric synth score playing — ${title}] ♪`],
        ["00:00:05.500", "00:00:11.500", "[Opening title sequence — Press 'Skip Intro' to jump ahead]"],
        ["00:00:12.000", "00:00:18.000", "All perimeter nodes are online. Establishing direct stream link."],
        ["00:00:19.000", "00:00:26.000", "We only have one window before the grid locks down this sector."],
        ["00:00:27.000", "00:00:35.000", "Hold the frequency steady—the telemetry is coming from inside the vault."],
        ["00:00:36.000", "00:00:45.000", "♪ [Swelling orchestral tension] ♪"],
        ["00:00:46.000", "00:01:05.000", "Whatever happens next, make sure the archive survives."],
      ];

  const vttBody = lines
    .map(([start, end, text], idx) => `${idx + 1}\n${start} --> ${end}\n${text}`)
    .join("\n\n");

  return new NextResponse(`WEBVTT\n\n${vttBody}\n`, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
