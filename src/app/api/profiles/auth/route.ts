import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profileId, password } = body;

  if (!profileId) {
    return NextResponse.json(
      { error: "Missing profileId" },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  if (!profile.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  if (!password || !verifyPassword(String(password), profile.passwordHash)) {
    return NextResponse.json(
      { error: "Incorrect password. Please try again." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
