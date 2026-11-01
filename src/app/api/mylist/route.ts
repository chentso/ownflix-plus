import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logProfileActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/localhost";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profileId, mediaItemId } = body;

  if (!profileId || !mediaItemId) {
    return NextResponse.json(
      { error: "profileId and mediaItemId are required" },
      { status: 400 }
    );
  }

  const [existing, mediaItem] = await Promise.all([
    prisma.myListItem.findUnique({
      where: {
        profileId_mediaItemId: {
          profileId,
          mediaItemId,
        },
      },
    }),
    prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
      select: { title: true },
    }),
  ]);

  const title = mediaItem?.title || "Media Item";

  if (existing) {
    await prisma.myListItem.delete({
      where: { id: existing.id },
    });
    await logProfileActivity({
      profileId,
      action: "MYLIST_REMOVE",
      details: `Removed "${title}" from My List`,
      mediaItemId,
      mediaTitle: title,
      ipAddress: getClientIp(req),
    });
    return NextResponse.json({ inMyList: false });
  } else {
    await prisma.myListItem.create({
      data: {
        profileId,
        mediaItemId,
      },
    });
    await logProfileActivity({
      profileId,
      action: "MYLIST_ADD",
      details: `Added "${title}" to My List`,
      mediaItemId,
      mediaTitle: title,
      ipAddress: getClientIp(req),
    });
    return NextResponse.json({ inMyList: true });
  }
}
