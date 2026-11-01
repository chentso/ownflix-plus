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

  // Find or create the default "My List" playlist for this profile
  let myListPlaylist = await prisma.playlist.findFirst({
    where: { profileId, title: "My List" },
  });
  if (!myListPlaylist) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    myListPlaylist = await prisma.playlist.create({
      data: {
        title: "My List",
        description: "Your default saved watchlist and favorites",
        isPublic: false,
        shareCode: `my-list-${randomSuffix}`,
        profileId,
      },
    });
  }

  if (existing) {
    await prisma.myListItem.delete({
      where: { id: existing.id },
    });
    // Remove from default playlist
    await prisma.playlistItem.deleteMany({
      where: {
        playlistId: myListPlaylist.id,
        mediaItemId,
      },
    });
    await prisma.playlist.update({
      where: { id: myListPlaylist.id },
      data: { updatedAt: new Date() },
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
    // Add to default playlist
    const orderCount = await prisma.playlistItem.count({
      where: { playlistId: myListPlaylist.id },
    });
    await prisma.playlistItem.upsert({
      where: {
        playlistId_mediaItemId: {
          playlistId: myListPlaylist.id,
          mediaItemId,
        },
      },
      create: {
        playlistId: myListPlaylist.id,
        mediaItemId,
        order: orderCount,
      },
      update: {},
    });
    await prisma.playlist.update({
      where: { id: myListPlaylist.id },
      data: { updatedAt: new Date() },
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
