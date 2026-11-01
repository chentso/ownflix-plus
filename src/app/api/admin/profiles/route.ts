import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLocalhostRequest, getClientIp } from "@/lib/localhost";
import { hashPassword } from "@/lib/password";
import { logProfileActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

function sanitizeAdminProfile(p: {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon: string;
  passwordHash: string | null;
  isKids: boolean;
  isAdmin: boolean;
  createdAt: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor,
    avatarIcon: p.avatarIcon,
    hasPassword: Boolean(p.passwordHash),
    isKids: p.isKids,
    isAdmin: p.isAdmin,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      { error: "Access Restricted: Admin profile actions are restricted to localhost." },
      { status: 403 }
    );
  }

  const profiles = await prisma.profile.findMany({
    include: {
      _count: {
        select: {
          watchProgress: true,
          myList: true,
          libraryFolders: true,
          activityLogs: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    profiles: profiles.map((p) => ({
      ...sanitizeAdminProfile(p),
      counts: p._count,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      { error: "Access Restricted: Admin profile actions are restricted to localhost." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, avatarColor, avatarIcon, isAdmin, isKids, password } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Profile name is required." },
      { status: 400 }
    );
  }

  const trimmedPass = typeof password === "string" ? password.trim() : "";
  const existingCount = await prisma.profile.count();
  const shouldBeAdmin = existingCount === 0 ? true : Boolean(isAdmin);

  const profile = await prisma.profile.create({
    data: {
      name: name.trim(),
      avatarColor: avatarColor || "#2563EB",
      avatarIcon: avatarIcon || (shouldBeAdmin ? "crown" : "smile"),
      passwordHash: trimmedPass ? hashPassword(trimmedPass) : null,
      isAdmin: shouldBeAdmin,
      isKids: shouldBeAdmin ? false : Boolean(isKids),
    },
  });

  await logProfileActivity({
    profileId: profile.id,
    action: "PROFILE_CREATE",
    details: `Admin created profile "${profile.name}" (Role: ${profile.isAdmin ? "Admin" : "Standard"}, Password: ${profile.passwordHash ? "Yes" : "None"})`,
    ipAddress: getClientIp(req),
  }).catch(() => {});

  return NextResponse.json({ profile: sanitizeAdminProfile(profile) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      { error: "Access Restricted: Admin profile actions are restricted to localhost." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    id,
    name,
    avatarColor,
    avatarIcon,
    isAdmin,
    isKids,
    newPassword,
    removePassword,
  } = body;

  if (!id) {
    return NextResponse.json({ error: "Profile id is required." }, { status: 400 });
  }

  const existing = await prisma.profile.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // Safeguard: Cannot revoke admin rights if this is the only admin
  if (existing.isAdmin && isAdmin === false) {
    const adminCount = await prisma.profile.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot revoke admin role from the server's sole administrator." },
        { status: 400 }
      );
    }
  }

  let nextPasswordHash: string | null | undefined = undefined;
  if (removePassword) {
    nextPasswordHash = null;
  } else if (typeof newPassword === "string" && newPassword.trim().length > 0) {
    nextPasswordHash = hashPassword(newPassword.trim());
  }

  const updated = await prisma.profile.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(avatarColor !== undefined ? { avatarColor } : {}),
      ...(avatarIcon !== undefined ? { avatarIcon } : {}),
      ...(isAdmin !== undefined ? { isAdmin: Boolean(isAdmin) } : {}),
      ...(isKids !== undefined
        ? { isKids: (isAdmin !== undefined ? Boolean(isAdmin) : existing.isAdmin) ? false : Boolean(isKids) }
        : {}),
      ...(nextPasswordHash !== undefined ? { passwordHash: nextPasswordHash } : {}),
    },
  });

  await logProfileActivity({
    profileId: updated.id,
    action: "PROFILE_UPDATE",
    details: `Admin updated profile settings for "${updated.name}"`,
    ipAddress: getClientIp(req),
  }).catch(() => {});

  return NextResponse.json({ profile: sanitizeAdminProfile(updated) });
}

export async function DELETE(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      { error: "Access Restricted: Admin profile actions are restricted to localhost." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Profile id is required." }, { status: 400 });
  }

  const totalCount = await prisma.profile.count();
  if (totalCount <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last remaining profile on the server." },
      { status: 400 }
    );
  }

  const existing = await prisma.profile.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (existing.isAdmin) {
    const adminCount = await prisma.profile.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      return NextResponse.json(
        {
          error:
            "Cannot delete the sole administrator profile. Please promote another profile to administrator first.",
        },
        { status: 400 }
      );
    }
  }

  // Delete profile (cascades or sets null per Prisma schema relations)
  await prisma.profile.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
