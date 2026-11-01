import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { isLocalhostRequest, getClientIp } from "@/lib/localhost";
import {
  ensureActivityLogsBackfilled,
  logProfileActivity,
} from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      {
        isLocalhost: false,
        error:
          "Access Restricted: The OwnFlix+ Admin Settings Dashboard can only be accessed from localhost (127.0.0.1 / ::1).",
      },
      { status: 403 }
    );
  }

  await ensureSeeded();
  await ensureActivityLogsBackfilled();

  const { searchParams } = new URL(req.url);
  const filterProfileId = searchParams.get("profileId");
  const filterAction = searchParams.get("action");

  const [profiles, folders, activityLogs] = await Promise.all([
    prisma.profile.findMany({
      include: {
        libraryFolders: {
          orderBy: { createdAt: "asc" },
        },
        watchProgress: {
          include: {
            mediaItem: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
                backdropUrl: true,
                type: true,
                releaseYear: true,
              },
            },
            episode: {
              select: {
                id: true,
                seasonNumber: true,
                episodeNumber: true,
                title: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        myList: {
          include: {
            mediaItem: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            activityLogs: true,
            watchProgress: true,
            myList: true,
            libraryFolders: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.libraryFolder.findMany({
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            avatarIcon: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.activityLog.findMany({
      where: {
        ...(filterProfileId && filterProfileId !== "ALL"
          ? { profileId: filterProfileId }
          : {}),
        ...(filterAction && filterAction !== "ALL"
          ? { action: filterAction }
          : {}),
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            avatarIcon: true,
            isKids: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);

  const sanitizedProfiles = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor,
    avatarIcon: p.avatarIcon,
    hasPassword: Boolean(p.passwordHash),
    isKids: p.isKids,
    isAdmin: p.isAdmin,
    createdAt: p.createdAt,
    libraryFolders: p.libraryFolders,
    watchProgress: p.watchProgress,
    myList: p.myList,
    counts: p._count,
  }));

  return NextResponse.json({
    isLocalhost: true,
    profiles: sanitizedProfiles,
    folders,
    activityLogs,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profileId, action, details, mediaItemId, mediaTitle } = body;

  if (!profileId || !action || !details) {
    return NextResponse.json(
      { error: "profileId, action, and details are required" },
      { status: 400 }
    );
  }

  await logProfileActivity({
    profileId,
    action,
    details,
    mediaItemId: mediaItemId || null,
    mediaTitle: mediaTitle || null,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      {
        error:
          "Access Restricted: Activity logs can only be cleared from localhost.",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  await prisma.activityLog.deleteMany({
    where: profileId && profileId !== "ALL" ? { profileId } : undefined,
  });

  return NextResponse.json({ ok: true });
}
