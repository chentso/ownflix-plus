import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchImdbMetadata,
  fetchImdbById,
  searchImdbCandidates,
} from "@/lib/imdb";
import { cleanMediaTitle } from "@/lib/scanner";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const yearRaw = searchParams.get("year");
  const mode = searchParams.get("mode") || "";
  const year = yearRaw ? parseInt(yearRaw, 10) : undefined;

  if (!title.trim()) {
    return NextResponse.json(
      { error: "Missing title parameter" },
      { status: 400 }
    );
  }

  // Emby-style "Identify" multi-candidate search mode
  if (mode === "candidates") {
    const trimmed = title.trim();
    if (/^tt\d{5,}$/i.test(trimmed)) {
      const exact = await fetchImdbById(trimmed.toLowerCase());
      if (exact) {
        return NextResponse.json({
          candidates: [
            {
              imdbId: exact.imdbId,
              title: exact.title,
              year: exact.year,
              type: "Movie / Series",
              cast: exact.cast,
              posterUrl: exact.posterUrl,
            },
          ],
        });
      }
    }

    const suggestions = await searchImdbCandidates(trimmed, year);
    const candidates = suggestions.map((s) => ({
      imdbId: s.id,
      title: s.l,
      year: s.y || null,
      type: s.q || s.qid || "Feature",
      cast: s.s || "",
      posterUrl:
        s.i?.imageUrl ||
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80",
    }));
    return NextResponse.json({ candidates });
  }

  const metadata = await fetchImdbMetadata(title, year);
  if (!metadata) {
    return NextResponse.json(
      { error: `No IMDb match found for "${title}"` },
      { status: 404 }
    );
  }

  return NextResponse.json({ metadata });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mediaItemId, query, year, imdbId } = body;

  if (mediaItemId) {
    const item = await prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const searchTitle =
      imdbId ||
      query ||
      (item.filePath
        ? cleanMediaTitle(path.basename(item.filePath)).title
        : item.title);
    const searchYear =
      year ||
      (item.filePath
        ? cleanMediaTitle(path.basename(item.filePath)).year
        : item.releaseYear);

    const imdb = await fetchImdbMetadata(searchTitle, searchYear);
    if (!imdb) {
      return NextResponse.json(
        { error: `No IMDb match found for "${searchTitle}"` },
        { status: 404 }
      );
    }

    const updated = await prisma.mediaItem.update({
      where: { id: item.id },
      data: {
        title: imdb.title,
        overview: imdb.overview,
        tagline: imdb.tagline || item.tagline,
        releaseYear: imdb.year,
        maturityRating: imdb.maturityRating,
        genres: imdb.genres,
        cast: imdb.cast,
        director: imdb.director,
        posterUrl: imdb.posterUrl,
        backdropUrl: imdb.backdropUrl,
        matchScore: imdb.matchScore,
      },
    });

    return NextResponse.json({ item: updated, imdb });
  }

  // Sync all movies in the library with IMDb
  const allItems = await prisma.mediaItem.findMany();
  let updatedCount = 0;

  for (const item of allItems) {
    const parsedFromFile = item.filePath
      ? cleanMediaTitle(path.basename(item.filePath))
      : null;
    const searchTitle = parsedFromFile?.title || item.title;
    const searchYear = parsedFromFile?.year || item.releaseYear;

    const imdb = await fetchImdbMetadata(searchTitle, searchYear);
    if (imdb) {
      await prisma.mediaItem.update({
        where: { id: item.id },
        data: {
          title: imdb.title,
          overview: imdb.overview,
          tagline: imdb.tagline || item.tagline,
          releaseYear: imdb.year,
          maturityRating: imdb.maturityRating,
          genres: imdb.genres,
          cast: imdb.cast,
          director: imdb.director,
          posterUrl: imdb.posterUrl,
          backdropUrl: imdb.backdropUrl,
          matchScore: imdb.matchScore,
        },
      });
      updatedCount++;
    }
  }

  return NextResponse.json({ updatedCount, total: allItems.length });
}
