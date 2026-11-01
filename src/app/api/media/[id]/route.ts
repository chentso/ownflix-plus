import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logProfileActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  const item = await prisma.mediaItem.findUnique({
    where: { id: params.id },
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
  });

  if (!item) {
    return NextResponse.json({ error: "Media item not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...item,
      progress:
        Array.isArray(item.watchProgress) && item.watchProgress.length > 0
          ? item.watchProgress[0]
          : null,
      inMyList: Array.isArray(item.myList) && item.myList.length > 0,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  if (body.isFeatured === true) {
    await prisma.mediaItem.updateMany({
      where: { id: { not: params.id } },
      data: { isFeatured: false },
    });
  }

  const updated = await prisma.mediaItem.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.overview !== undefined ? { overview: body.overview } : {}),
      ...(body.tagline !== undefined ? { tagline: body.tagline } : {}),
      ...(body.releaseYear !== undefined
        ? { releaseYear: Number(body.releaseYear) }
        : {}),
      ...(body.maturityRating !== undefined
        ? { maturityRating: body.maturityRating }
        : {}),
      ...(body.genres !== undefined ? { genres: body.genres } : {}),
      ...(body.cast !== undefined ? { cast: body.cast } : {}),
      ...(body.director !== undefined ? { director: body.director } : {}),
      ...(body.posterUrl !== undefined ? { posterUrl: body.posterUrl } : {}),
      ...(body.backdropUrl !== undefined
        ? { backdropUrl: body.backdropUrl }
        : {}),
      ...(body.videoUrl !== undefined ? { videoUrl: body.videoUrl } : {}),
      ...(body.introStart !== undefined
        ? {
            introStart:
              body.introStart === "" || body.introStart === null
                ? null
                : Number(body.introStart),
          }
        : {}),
      ...(body.introEnd !== undefined
        ? {
            introEnd:
              body.introEnd === "" || body.introEnd === null
                ? null
                : Number(body.introEnd),
          }
        : {}),
      ...(body.creditsStart !== undefined
        ? {
            creditsStart:
              body.creditsStart === "" || body.creditsStart === null
                ? null
                : Number(body.creditsStart),
          }
        : {}),
      ...(body.isFeatured !== undefined
        ? { isFeatured: Boolean(body.isFeatured) }
        : {}),
      ...(body.resolution !== undefined ? { resolution: body.resolution } : {}),
      ...(body.markedForDeletion !== undefined
        ? {
            markedForDeletion: Boolean(body.markedForDeletion),
            markedForDeletionAt: body.markedForDeletion ? new Date() : null,
            markedForDeletionBy: body.markedForDeletion
              ? body.markedForDeletionBy || "User"
              : null,
          }
        : {}),
    },
  });

  if (body.markedForDeletion !== undefined && body.profileId) {
    await logProfileActivity({
      profileId: body.profileId,
      action: body.markedForDeletion
        ? "MEDIA_MARK_DELETION"
        : "MEDIA_UNMARK_DELETION",
      details: body.markedForDeletion
        ? `Marked "${updated.title}" for deletion after watching`
        : `Unmarked "${updated.title}" from deletion`,
      mediaItemId: updated.id,
      mediaTitle: updated.title,
    }).catch(() => {});
  }

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.mediaItem.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ ok: true });
}
