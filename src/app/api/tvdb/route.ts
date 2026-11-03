import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchTvdbEpisode, fetchTvdbSeriesEpisodes } from "@/lib/tvdb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seriesTitle = searchParams.get("seriesTitle") || "";
  const seasonStr = searchParams.get("season");
  const episodeStr = searchParams.get("episode");

  if (!seriesTitle.trim()) {
    return NextResponse.json(
      { error: "Missing seriesTitle parameter" },
      { status: 400 }
    );
  }

  if (seasonStr && episodeStr) {
    const season = parseInt(seasonStr, 10);
    const episode = parseInt(episodeStr, 10);
    const ep = await fetchTvdbEpisode(seriesTitle, season, episode);
    if (!ep) {
      return NextResponse.json(
        { error: `No TVDB match found for ${seriesTitle} S${season}E${episode}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ episode: ep });
  }

  const episodes = await fetchTvdbSeriesEpisodes(seriesTitle);
  return NextResponse.json({ episodes });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { seriesId } = body;

  const targetSeries = seriesId
    ? await prisma.mediaItem.findMany({
        where: { id: seriesId, type: "SERIES" },
        include: { episodes: true },
      })
    : await prisma.mediaItem.findMany({
        where: { type: "SERIES" },
        include: { episodes: true },
      });

  let enrichedCount = 0;

  for (const series of targetSeries) {
    const episodes = await fetchTvdbSeriesEpisodes(series.title);
    if (episodes.length === 0) continue;

    for (const ep of series.episodes) {
      const match = episodes.find(
        (e) =>
          e.seasonNumber === ep.seasonNumber &&
          e.episodeNumber === ep.episodeNumber
      );
      if (match) {
        await prisma.episode.update({
          where: { id: ep.id },
          data: {
            title: match.title || ep.title,
            overview: match.overview || ep.overview,
            thumbnailUrl: match.thumbnailUrl || ep.thumbnailUrl,
          },
        });
        enrichedCount++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    enrichedCount,
    seriesCount: targetSeries.length,
  });
}
