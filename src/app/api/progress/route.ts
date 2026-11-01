import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logProfileActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/localhost";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    profileId,
    mediaItemId,
    episodeId,
    positionSeconds,
    durationSeconds,
    completed,
  } = body;

  if (!profileId || !mediaItemId) {
    return NextResponse.json(
      { error: "profileId and mediaItemId are required" },
      { status: 400 }
    );
  }

  const pos = Math.max(0, Number(positionSeconds) || 0);
  const dur = Math.max(1, Number(durationSeconds) || 1);
  const isCompleted =
    completed !== undefined ? Boolean(completed) : pos / dur >= 0.95;

  const progress = await prisma.watchProgress.upsert({
    where: {
      profileId_mediaItemId: {
        profileId,
        mediaItemId,
      },
    },
    update: {
      episodeId: episodeId || null,
      positionSeconds: pos,
      durationSeconds: dur,
      completed: isCompleted,
    },
    create: {
      profileId,
      mediaItemId,
      episodeId: episodeId || null,
      positionSeconds: pos,
      durationSeconds: dur,
      completed: isCompleted,
    },
    include: {
      mediaItem: { select: { title: true } },
      episode: {
        select: { seasonNumber: true, episodeNumber: true, title: true },
      },
    },
  });

  const pct = Math.min(100, Math.round((pos / dur) * 100));
  const epText = progress.episode
    ? ` (S${progress.episode.seasonNumber}:E${progress.episode.episodeNumber} "${progress.episode.title}")`
    : "";
  await logProfileActivity({
    profileId,
    action: isCompleted ? "PLAY_COMPLETE" : "PLAY_PROGRESS",
    details: isCompleted
      ? `Finished watching "${progress.mediaItem.title}"${epText}`
      : `Watching "${progress.mediaItem.title}"${epText} at ${Math.floor(
          pos / 60
        )}m ${Math.floor(pos % 60)}s (${pct}%)`,
    mediaItemId,
    mediaTitle: progress.mediaItem.title,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ progress });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  const mediaItemId = searchParams.get("mediaItemId");

  if (!profileId || !mediaItemId) {
    return NextResponse.json(
      { error: "profileId and mediaItemId are required" },
      { status: 400 }
    );
  }

  await prisma.watchProgress.deleteMany({
    where: { profileId, mediaItemId },
  });

  return NextResponse.json({ ok: true });
}
