import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const existing = await prisma.myListItem.findUnique({
    where: {
      profileId_mediaItemId: {
        profileId,
        mediaItemId,
      },
    },
  });

  if (existing) {
    await prisma.myListItem.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ inMyList: false });
  } else {
    await prisma.myListItem.create({
      data: {
        profileId,
        mediaItemId,
      },
    });
    return NextResponse.json({ inMyList: true });
  }
}
