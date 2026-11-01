import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logProfileActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

/**
 * POST /api/playlists/[id]/items
 * Add a media item to the playlist
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { mediaItemId, profileId } = body;

    if (!mediaItemId) {
      return NextResponse.json(
        { error: "mediaItemId is required" },
        { status: 400 }
      );
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Check if item already exists in playlist
    const existing = playlist.items.find(
      (item) => item.mediaItemId === mediaItemId
    );
    if (existing) {
      return NextResponse.json({
        message: "Item already in playlist",
        item: existing,
      });
    }

    // Next order index
    const nextOrder =
      playlist.items.length > 0
        ? Math.max(...playlist.items.map((i) => i.order)) + 1
        : 0;

    const newItem = await prisma.playlistItem.create({
      data: {
        playlistId: params.id,
        mediaItemId,
        order: nextOrder,
      },
      include: {
        mediaItem: true,
      },
    });

    // Touch playlist updatedAt
    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    if (playlist.title.toLowerCase() === "my list") {
      await prisma.myListItem.upsert({
        where: {
          profileId_mediaItemId: {
            profileId: playlist.profileId,
            mediaItemId,
          },
        },
        create: {
          profileId: playlist.profileId,
          mediaItemId,
        },
        update: {},
      });
    }

    if (profileId) {
      await logProfileActivity({
        profileId,
        action: "PLAYLIST_ADD",
        details: `Added "${newItem.mediaItem.title}" to playlist "${playlist.title}"`,
        mediaItemId,
        mediaTitle: newItem.mediaItem.title,
      });
    }

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Failed to add item to playlist:", error);
    return NextResponse.json(
      { error: "Failed to add item to playlist" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/playlists/[id]/items
 * Remove a media item from the playlist
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaItemId = searchParams.get("mediaItemId");
    const profileId = searchParams.get("profileId");

    if (!mediaItemId) {
      return NextResponse.json(
        { error: "mediaItemId is required" },
        { status: 400 }
      );
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    await prisma.playlistItem.deleteMany({
      where: {
        playlistId: params.id,
        mediaItemId,
      },
    });

    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    if (playlist.title.toLowerCase() === "my list") {
      await prisma.myListItem.deleteMany({
        where: {
          profileId: playlist.profileId,
          mediaItemId,
        },
      });
    }

    if (profileId) {
      await logProfileActivity({
        profileId,
        action: "PLAYLIST_REMOVE",
        details: `Removed item from playlist "${playlist.title}"`,
        mediaItemId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to remove item from playlist:", error);
    return NextResponse.json(
      { error: "Failed to remove item from playlist" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/playlists/[id]/items
 * Reorder items in the playlist
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { mediaItemIds } = body;

    if (!Array.isArray(mediaItemIds)) {
      return NextResponse.json(
        { error: "mediaItemIds array is required" },
        { status: 400 }
      );
    }

    // Update orders sequentially
    await prisma.$transaction(
      mediaItemIds.map((mediaId, idx) =>
        prisma.playlistItem.updateMany({
          where: {
            playlistId: params.id,
            mediaItemId: mediaId,
          },
          data: {
            order: idx,
          },
        })
      )
    );

    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reorder playlist items:", error);
    return NextResponse.json(
      { error: "Failed to reorder playlist items" },
      { status: 500 }
    );
  }
}
