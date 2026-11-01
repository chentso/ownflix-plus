import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { logProfileActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

/**
 * GET /api/playlists/share/[shareCode]
 * Retrieve a shared playlist by its unique shareCode
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { shareCode: string } }
) {
  await ensureSeeded();
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { shareCode: params.shareCode },
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

    if (!playlist) {
      return NextResponse.json(
        { error: "Shared playlist not found or has been removed." },
        { status: 404 }
      );
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error("Failed to fetch shared playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared playlist" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/playlists/share/[shareCode]
 * Clone / Save a shared playlist to the user's profile
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { shareCode: string } }
) {
  await ensureSeeded();
  try {
    const body = await req.json();
    const { profileId, newTitle } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required to save playlist" },
        { status: 400 }
      );
    }

    const source = await prisma.playlist.findUnique({
      where: { shareCode: params.shareCode },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Source playlist not found." },
        { status: 404 }
      );
    }

    // Generate new shareCode for the cloned playlist
    const baseCode = (newTitle || source.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 18);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const newShareCode = `${baseCode || "list"}-${randomSuffix}`;

    const cloned = await prisma.playlist.create({
      data: {
        title: newTitle?.trim() || `${source.title} (Shared)`,
        description: source.description,
        isPublic: true,
        shareCode: newShareCode,
        profileId,
        items: {
          create: source.items.map((item, idx) => ({
            mediaItemId: item.mediaItemId,
            order: idx,
          })),
        },
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
            mediaItem: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    await logProfileActivity({
      profileId,
      action: "PLAYLIST_IMPORT",
      details: `Saved shared playlist "${source.title}" to library`,
      mediaTitle: cloned.title,
    });

    return NextResponse.json({ playlist: cloned }, { status: 201 });
  } catch (error) {
    console.error("Failed to clone shared playlist:", error);
    return NextResponse.json(
      { error: "Failed to clone shared playlist" },
      { status: 500 }
    );
  }
}
