import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, avatarColor, avatarIcon, isKids } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Profile name is required" },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.create({
    data: {
      name: name.trim(),
      avatarColor: avatarColor || "#E50914",
      avatarIcon: avatarIcon || "smile",
      isKids: Boolean(isKids),
      isAdmin: false,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, name, avatarColor, avatarIcon, isKids } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const profile = await prisma.profile.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(avatarColor !== undefined ? { avatarColor } : {}),
      ...(avatarIcon !== undefined ? { avatarIcon } : {}),
      ...(isKids !== undefined ? { isKids: Boolean(isKids) } : {}),
    },
  });

  return NextResponse.json({ profile });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const count = await prisma.profile.count();
  if (count <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last remaining profile" },
      { status: 400 }
    );
  }

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
