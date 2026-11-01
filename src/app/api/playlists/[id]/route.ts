import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logProfileActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
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
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error("Failed to fetch playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, description, isPublic, profileId } = body;

    const existing = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.playlist.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && title.trim() ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {}),
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

    if (profileId) {
      await logProfileActivity({
        profileId,
        action: "PLAYLIST_UPDATE",
        details: `Updated playlist "${updated.title}"`,
        mediaTitle: updated.title,
      });
    }

    return NextResponse.json({ playlist: updated });
  } catch (error) {
    console.error("Failed to update playlist:", error);
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    const existing = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    if (existing.title.toLowerCase() === "my list") {
      return NextResponse.json(
        { error: "The default 'My List' playlist cannot be deleted." },
        { status: 400 }
      );
    }

    await prisma.playlist.delete({
      where: { id: params.id },
    });

    if (profileId) {
      await logProfileActivity({
        profileId,
        action: "PLAYLIST_DELETE",
        details: `Deleted custom playlist "${existing.title}"`,
        mediaTitle: existing.title,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete playlist:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    );
  }
}
