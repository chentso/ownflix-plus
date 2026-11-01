import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanLibraryFolder } from "@/lib/scanner";
import { ensureSeeded } from "@/lib/seed";
import { isLocalhostRequest, getClientIp } from "@/lib/localhost";
import { logProfileActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      {
        error:
          "Access denied: Storage location settings can only be accessed from localhost.",
      },
      { status: 403 }
    );
  }

  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  const folders = await prisma.libraryFolder.findMany({
    where: profileId ? { profileId } : undefined,
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
  });
  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      {
        error:
          "Access denied: Storage location settings can only be modified from localhost.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, path: folderPath, mediaType, profileId } = body;

  if (!name || !folderPath) {
    return NextResponse.json(
      { error: "Folder name and path are required" },
      { status: 400 }
    );
  }

  const normalizedProfileId =
    profileId && profileId !== "ALL" ? String(profileId) : null;

  const existing = await prisma.libraryFolder.findFirst({
    where: {
      path: folderPath.trim(),
      profileId: normalizedProfileId,
    },
  });

  if (existing) {
    return NextResponse.json(
      {
        error:
          "This storage path is already registered for the selected profile.",
      },
      { status: 400 }
    );
  }

  const folder = await prisma.libraryFolder.create({
    data: {
      name: name.trim(),
      path: folderPath.trim(),
      mediaType: mediaType || "MIXED",
      profileId: normalizedProfileId,
    },
  });

  const scanResult = await scanLibraryFolder(folder.id);
  const updated = await prisma.libraryFolder.findUnique({
    where: { id: folder.id },
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
  });

  if (normalizedProfileId) {
    await logProfileActivity({
      profileId: normalizedProfileId,
      action: "STORAGE_UPDATE",
      details: `Added storage location "${folder.name}" (${folder.path})`,
      ipAddress: getClientIp(req),
    });
  }

  return NextResponse.json(
    { folder: updated, scanResult },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      {
        error:
          "Access denied: Storage location settings can only be modified from localhost.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { id, name, path: folderPath, mediaType, profileId, rescan } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Missing storage location id" },
      { status: 400 }
    );
  }

  const existing = await prisma.libraryFolder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Storage location not found" },
      { status: 404 }
    );
  }

  const normalizedProfileId =
    profileId === undefined
      ? existing.profileId
      : profileId && profileId !== "ALL"
      ? String(profileId)
      : null;

  const nextPath = folderPath !== undefined ? folderPath.trim() : existing.path;
  const pathChanged = nextPath !== existing.path;

  const updatedFolder = await prisma.libraryFolder.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(folderPath !== undefined ? { path: nextPath } : {}),
      ...(mediaType !== undefined ? { mediaType } : {}),
      profileId: normalizedProfileId,
    },
  });

  let scanResult = null;
  if (pathChanged || rescan) {
    scanResult = await scanLibraryFolder(updatedFolder.id);
  }

  const finalFolder = await prisma.libraryFolder.findUnique({
    where: { id: updatedFolder.id },
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
  });

  if (normalizedProfileId) {
    await logProfileActivity({
      profileId: normalizedProfileId,
      action: "STORAGE_UPDATE",
      details: `Updated storage location "${updatedFolder.name}" → ${updatedFolder.path}`,
      ipAddress: getClientIp(req),
    });
  }

  return NextResponse.json({ folder: finalFolder, scanResult });
}

export async function PUT(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      {
        error:
          "Access denied: Storage location settings can only be modified from localhost.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { folderId } = body;

  if (folderId) {
    const scanResult = await scanLibraryFolder(folderId);
    const updated = await prisma.libraryFolder.findUnique({
      where: { id: folderId },
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
    });
    return NextResponse.json({ folder: updated, scanResult });
  }

  // Scan all folders
  const allFolders = await prisma.libraryFolder.findMany();
  let totalScanned = 0;
  let totalMovies = 0;
  let totalEpisodes = 0;

  for (const f of allFolders) {
    const res = await scanLibraryFolder(f.id);
    totalScanned += res.scannedFiles;
    totalMovies += res.addedMovies;
    totalEpisodes += res.addedEpisodes;
  }

  const updatedFolders = await prisma.libraryFolder.findMany({
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
  });

  return NextResponse.json({
    folders: updatedFolders,
    scanResult: {
      scannedFiles: totalScanned,
      addedMovies: totalMovies,
      addedEpisodes: totalEpisodes,
    },
  });
}

export async function DELETE(req: NextRequest) {
  if (!isLocalhostRequest(req)) {
    return NextResponse.json(
      {
        error:
          "Access denied: Storage location settings can only be modified from localhost.",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing folder id" }, { status: 400 });
  }

  await prisma.libraryFolder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
