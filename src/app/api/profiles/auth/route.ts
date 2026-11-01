import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profileId, name, password } = body;

  if (!profileId && (!name || !String(name).trim())) {
    return NextResponse.json(
      { error: "Profile name or ID is required" },
      { status: 400 }
    );
  }

  let profile = null;

  if (profileId) {
    profile = await prisma.profile.findUnique({
      where: { id: String(profileId) },
    });
  } else if (name) {
    const targetName = String(name).trim().toLowerCase();
    const allProfiles = await prisma.profile.findMany();
    profile =
      allProfiles.find((p) => p.name.trim().toLowerCase() === targetName) ||
      null;
  }

  if (!profile) {
    return NextResponse.json(
      { error: "No profile found with that name" },
      { status: 404 }
    );
  }

  if (profile.passwordHash) {
    if (!password || !verifyPassword(String(password), profile.passwordHash)) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: profile.id,
      name: profile.name,
      avatarColor: profile.avatarColor,
      avatarIcon: profile.avatarIcon,
      hasPassword: Boolean(profile.passwordHash),
      isKids: profile.isKids,
      isAdmin: profile.isAdmin,
    },
  });
}
