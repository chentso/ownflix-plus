import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { logProfileActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  const includePublic = searchParams.get("includePublic") === "true";

  try {
    let whereClause: any = {};

    if (profileId && includePublic) {
      whereClause = {
        OR: [{ profileId }, { isPublic: true }],
      };
    } else if (profileId) {
      whereClause = { profileId };
    } else if (includePublic) {
      whereClause = { isPublic: true };
    }

    const playlists = await prisma.playlist.findMany({
      where: whereClause,
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            avatarIcon: true,
          },
        },
        items: {
          include: {
            mediaItem: {
              include: {
                episodes: {
                  orderBy: [
                    { seasonNumber: "asc" },
                    { episodeNumber: "asc" },
                  ],
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error("Failed to fetch playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  try {
    const body = await req.json();
    const { title, description, isPublic = true, profileId, initialMediaItemId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Playlist title is required" },
        { status: 400 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Generate a readable or unique share code
    const baseCode = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 18);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const shareCode = `${baseCode || "list"}-${randomSuffix}`;

    const playlist = await prisma.playlist.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        isPublic: Boolean(isPublic),
        shareCode,
        profileId,
        ...(initialMediaItemId
          ? {
              items: {
                create: {
                  mediaItemId: initialMediaItemId,
                  order: 0,
                },
              },
            }
          : {}),
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            avatarIcon: true,
          },
        },
        items: {
          include: {
            mediaItem: {
              include: {
                episodes: {
                  orderBy: [
                    { seasonNumber: "asc" },
                    { episodeNumber: "asc" },
                  ],
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    await logProfileActivity({
      profileId,
      action: "PLAYLIST_CREATE",
      details: `Created custom playlist "${playlist.title}"`,
      mediaTitle: playlist.title,
    });

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error("Failed to create playlist:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
