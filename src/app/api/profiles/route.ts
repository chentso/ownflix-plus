import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, verifyPassword } from "@/lib/password";
import { logProfileActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/localhost";

export const dynamic = "force-dynamic";

function sanitizeProfile(p: {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon: string;
  passwordHash: string | null;
  isKids: boolean;
  isAdmin: boolean;
}) {
  return {
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor,
    avatarIcon: p.avatarIcon,
    hasPassword: Boolean(p.passwordHash),
    isKids: p.isKids,
    isAdmin: p.isAdmin,
  };
}

export async function GET() {
  await ensureSeeded();
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    profiles: profiles.map(sanitizeProfile),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, avatarColor, avatarIcon, isKids, password, isAdmin } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Profile name is required" },
      { status: 400 }
    );
  }

  const existingCount = await prisma.profile.count();
  const isFirstProfile = existingCount === 0;

  const trimmedPass = typeof password === "string" ? password.trim() : "";

  // On first setup on the server where a profile is not available, password is required
  if (isFirstProfile && trimmedPass.length < 3) {
    return NextResponse.json(
      {
        error:
          "A password (minimum 3 characters) is required to secure the primary administrator profile.",
      },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.create({
    data: {
      name: name.trim(),
      avatarColor: avatarColor || "#2563EB",
      avatarIcon: avatarIcon || (isFirstProfile ? "crown" : "smile"),
      passwordHash: trimmedPass ? hashPassword(trimmedPass) : null,
      isKids: isFirstProfile ? false : Boolean(isKids),
      isAdmin: isFirstProfile ? true : Boolean(isAdmin),
    },
  });

  await logProfileActivity({
    profileId: profile.id,
    action: "PROFILE_CREATE",
    details: isFirstProfile
      ? `Initial server setup: created primary administrator profile "${profile.name}"`
      : `Created profile "${profile.name}" (${profile.isAdmin ? "Admin" : "Standard"})`,
    ipAddress: getClientIp(req),
  }).catch(() => {});

  return NextResponse.json(
    { profile: sanitizeProfile(profile) },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const {
    id,
    name,
    avatarColor,
    avatarIcon,
    isKids,
    currentPassword,
    newPassword,
    removePassword,
  } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const existing = await prisma.profile.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // If the profile currently has a password and the user is changing or removing it
  const wantsPasswordChange =
    newPassword !== undefined || Boolean(removePassword);

  if (existing.passwordHash && wantsPasswordChange) {
    if (
      !currentPassword ||
      !verifyPassword(String(currentPassword), existing.passwordHash)
    ) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }
  }

  let nextPasswordHash: string | null | undefined = undefined;
  if (removePassword) {
    nextPasswordHash = null;
  } else if (typeof newPassword === "string" && newPassword.trim().length > 0) {
    nextPasswordHash = hashPassword(newPassword.trim());
  }

  const profile = await prisma.profile.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(avatarColor !== undefined ? { avatarColor } : {}),
      ...(avatarIcon !== undefined ? { avatarIcon } : {}),
      ...(isKids !== undefined ? { isKids: Boolean(isKids) } : {}),
      ...(nextPasswordHash !== undefined
        ? { passwordHash: nextPasswordHash }
        : {}),
    },
  });

  return NextResponse.json({ profile: sanitizeProfile(profile) });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const password = searchParams.get("password") || "";

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

  const existing = await prisma.profile.findUnique({ where: { id } });
  if (existing?.passwordHash) {
    if (!password || !verifyPassword(password, existing.passwordHash)) {
      return NextResponse.json(
        { error: "Incorrect profile password" },
        { status: 401 }
      );
    }
  }

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
