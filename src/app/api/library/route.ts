import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanLibraryFolder } from "@/lib/scanner";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const folders = await prisma.libraryFolder.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, path: folderPath, mediaType } = body;

  if (!name || !folderPath) {
    return NextResponse.json(
      { error: "Folder name and path are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.libraryFolder.findUnique({
    where: { path: folderPath.trim() },
  });

  if (existing) {
    return NextResponse.json(
      { error: "This folder path is already registered in OwnFlix+" },
      { status: 400 }
    );
  }

  const folder = await prisma.libraryFolder.create({
    data: {
      name: name.trim(),
      path: folderPath.trim(),
      mediaType: mediaType || "MIXED",
    },
  });

  const scanResult = await scanLibraryFolder(folder.id);
  const updated = await prisma.libraryFolder.findUnique({
    where: { id: folder.id },
  });

  return NextResponse.json(
    { folder: updated, scanResult },
    { status: 201 }
  );
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { folderId } = body;

  if (folderId) {
    const scanResult = await scanLibraryFolder(folderId);
    const updated = await prisma.libraryFolder.findUnique({
      where: { id: folderId },
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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing folder id" }, { status: 400 });
  }

  await prisma.libraryFolder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
