import { prisma } from "./prisma";

export type ActivityAction =
  | "PROFILE_LOGIN"
  | "PLAY_START"
  | "PLAY_PROGRESS"
  | "PLAY_COMPLETE"
  | "MYLIST_ADD"
  | "MYLIST_REMOVE"
  | "ROOM_CREATE"
  | "ROOM_JOIN"
  | "STORAGE_UPDATE"
  | "METADATA_EDIT";

export async function logProfileActivity(params: {
  profileId: string;
  action: ActivityAction | string;
  details: string;
  mediaItemId?: string | null;
  mediaTitle?: string | null;
  ipAddress?: string | null;
}) {
  try {
    // Avoid flooding duplicate PLAY_PROGRESS logs within 45 seconds for the same profile & mediaItem
    if (params.action === "PLAY_PROGRESS" && params.mediaItemId) {
      const recent = await prisma.activityLog.findFirst({
        where: {
          profileId: params.profileId,
          mediaItemId: params.mediaItemId,
          action: "PLAY_PROGRESS",
          createdAt: {
            gte: new Date(Date.now() - 45 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recent) {
        await prisma.activityLog.update({
          where: { id: recent.id },
          data: {
            details: params.details,
            createdAt: new Date(),
          },
        });
        return;
      }
    }

    await prisma.activityLog.create({
      data: {
        profileId: params.profileId,
        action: params.action,
        details: params.details,
        mediaItemId: params.mediaItemId || null,
        mediaTitle: params.mediaTitle || null,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch {
    // Non-blocking activity log
  }
}

/**
 * Ensures the ActivityLog table has initial entries synthesized from existing
 * WatchProgress and MyListItem records if no activity logs exist yet.
 */
export async function ensureActivityLogsBackfilled() {
  const count = await prisma.activityLog.count();
  if (count > 0) return;

  const progresses = await prisma.watchProgress.findMany({
    include: {
      mediaItem: true,
      episode: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  for (const prog of progresses) {
    const pct =
      prog.durationSeconds > 0
        ? Math.round((prog.positionSeconds / prog.durationSeconds) * 100)
        : 0;
    const epLabel = prog.episode
      ? ` (S${prog.episode.seasonNumber}:E${prog.episode.episodeNumber} "${prog.episode.title}")`
      : "";
    await prisma.activityLog.create({
      data: {
        profileId: prog.profileId,
        action: prog.completed ? "PLAY_COMPLETE" : "PLAY_PROGRESS",
        details: prog.completed
          ? `Finished watching "${prog.mediaItem.title}"${epLabel}`
          : `Watched "${prog.mediaItem.title}"${epLabel} — ${pct}% complete (${Math.floor(
              prog.positionSeconds / 60
            )}m ${Math.floor(prog.positionSeconds % 60)}s)`,
        mediaItemId: prog.mediaItemId,
        mediaTitle: prog.mediaItem.title,
        ipAddress: "127.0.0.1",
        createdAt: prog.updatedAt,
      },
    });
  }

  const myListItems = await prisma.myListItem.findMany({
    include: { mediaItem: true },
    orderBy: { createdAt: "desc" },
  });

  for (const item of myListItems) {
    await prisma.activityLog.create({
      data: {
        profileId: item.profileId,
        action: "MYLIST_ADD",
        details: `Added "${item.mediaItem.title}" to My List`,
        mediaItemId: item.mediaItemId,
        mediaTitle: item.mediaItem.title,
        ipAddress: "127.0.0.1",
        createdAt: item.createdAt,
      },
    });
  }
}
