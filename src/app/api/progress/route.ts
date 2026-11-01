import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
