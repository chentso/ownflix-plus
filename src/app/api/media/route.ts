import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { fetchImdbMetadata } from "@/lib/imdb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  const [items, allFolders] = await Promise.all([
    prisma.mediaItem.findMany({
      include: {
        episodes: {
          orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
        },
        watchProgress: profileId
          ? {
              where: { profileId },
              include: { episode: true },
            }
          : false,
        myList: profileId
          ? {
              where: { profileId },
            }
          : false,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.libraryFolder.findMany(),
  ]);

  // Filter local disk items by per-profile storage locations when profileId is provided
  const normalizePath = (p: string) =>
    p.replace(/\//g, "\\").toLowerCase().replace(/\\+$/, "");

  const visibleItems = profileId
    ? items.filter((item) => {
        const candidatePath =
          item.filePath ||
          item.episodes.find((ep) => Boolean(ep.filePath))?.filePath ||
          null;
        if (!candidatePath || allFolders.length === 0) return true;

        const normFile = normalizePath(candidatePath);
        const matchingFolders = allFolders.filter((f) => {
          const normFolder = normalizePath(f.path);
          return (
            normFile === normFolder || normFile.startsWith(normFolder + "\\")
          );
        });

        if (matchingFolders.length === 0) return true;
        return matchingFolders.some(
          (f) => f.profileId === null || f.profileId === profileId
        );
      })
    : items;

  const formatted = visibleItems.map((item) => {
    const progress =
      Array.isArray(item.watchProgress) && item.watchProgress.length > 0
        ? item.watchProgress[0]
        : null;
    const inMyList =
      Array.isArray(item.myList) && item.myList.length > 0;

    return {
      ...item,
      progress,
      inMyList,
    };
  });

  return NextResponse.json({ media: formatted });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title,
    overview,
    tagline,
    type,
    releaseYear,
    maturityRating,
    genres,
    cast,
    director,
    posterUrl,
    backdropUrl,
    videoUrl,
    filePath,
    duration,
    introStart,
    introEnd,
    creditsStart,
    isFeatured,
    resolution,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const imdb = await fetchImdbMetadata(
    title,
    releaseYear ? Number(releaseYear) : undefined
  );

  const created = await prisma.mediaItem.create({
    data: {
      title: imdb?.title || title,
      overview:
        overview ||
        imdb?.overview ||
        "Added to your OwnFlix+ media server.",
      tagline: tagline || imdb?.tagline || null,
      type: type === "SERIES" ? "SERIES" : "MOVIE",
      releaseYear: Number(releaseYear) || imdb?.year || 2025,
      maturityRating: maturityRating || imdb?.maturityRating || "TV-MA",
      genres: genres || imdb?.genres || "Drama, Action",
      cast: cast || imdb?.cast || "",
      director: director || imdb?.director || null,
      posterUrl:
        posterUrl && !posterUrl.includes("images.unsplash.com")
          ? posterUrl
          : imdb?.posterUrl ||
            posterUrl ||
            "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
      backdropUrl:
        backdropUrl && !backdropUrl.includes("images.unsplash.com")
          ? backdropUrl
          : imdb?.backdropUrl ||
            backdropUrl ||
            "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80",
      videoUrl: videoUrl || null,
      filePath: filePath || null,
      duration: Number(duration) || 600,
      introStart:
        introStart !== undefined && introStart !== ""
          ? Number(introStart)
          : 5,
      introEnd:
        introEnd !== undefined && introEnd !== "" ? Number(introEnd) : 35,
      creditsStart:
        creditsStart !== undefined && creditsStart !== ""
          ? Number(creditsStart)
          : null,
      matchScore: imdb?.matchScore || 96,
      isFeatured: Boolean(isFeatured),
      resolution: resolution || "1080p HD",
    },
  });

  if (created.filePath && !created.videoUrl) {
    await prisma.mediaItem.update({
      where: { id: created.id },
      data: { videoUrl: `/api/stream?mediaId=${created.id}` },
    });
  }

  return NextResponse.json({ item: created }, { status: 201 });
}
