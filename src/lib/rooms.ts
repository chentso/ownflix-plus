export type WatchTogetherMode = "ALL_PAUSE" | "PACE_SYNC";

export interface RoomParticipant {
  participantId: string;
  profileId: string;
  profileName: string;
  avatarColor: string;
  avatarIcon: string;
  positionSeconds: number;
  durationSeconds: number;
  isPaused: boolean;
  isBuffering: boolean;
  playbackRate: number;
  rank: number;
  updatedAt: number;
}

export interface RoomChatMessage {
  id: string;
  participantId: string;
  profileId: string;
  profileName: string;
  avatarColor: string;
  avatarIcon: string;
  text: string;
  videoTimestamp: number;
  createdAt: number;
}

export interface WatchRoom {
  id: string;
  mediaItemId: string;
  episodeId: string | null;
  mode: WatchTogetherMode;
  isPlaying: boolean;
  pausedByProfileName: string | null;
  bufferingProfileName: string | null;
  lastSeekSeq: number;
  lastSeekTime: number;
  createdAt: number;
  participants: Record<string, RoomParticipant>;
  messages: RoomChatMessage[];
}

const globalForRooms = globalThis as unknown as {
  __ownflixRooms?: Map<string, WatchRoom>;
};

export function getRoomsStore(): Map<string, WatchRoom> {
  if (!globalForRooms.__ownflixRooms) {
    globalForRooms.__ownflixRooms = new Map<string, WatchRoom>();
  }
  return globalForRooms.__ownflixRooms;
}

export function generateRoomCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function recomputeRoomState(room: WatchRoom): WatchRoom {
  const now = Date.now();
  // Prune stale participants (> 15s without heartbeat)
  for (const [pid, p] of Object.entries(room.participants)) {
    if (now - p.updatedAt > 15000) {
      delete room.participants[pid];
    }
  }

  const list = Object.values(room.participants);
  if (list.length === 0) {
    room.bufferingProfileName = null;
    return room;
  }

  // Sort by positionSeconds descending to assign viewer ranks (1st, 2nd, 3rd...)
  const sorted = [...list].sort(
    (a, b) => b.positionSeconds - a.positionSeconds
  );
  sorted.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  // Check if any participant is currently buffering
  const bufferingUser = list.find((p) => p.isBuffering);
  room.bufferingProfileName = bufferingUser ? bufferingUser.profileName : null;

  // Compute target playbackRate for each participant
  if (room.mode === "PACE_SYNC") {
    const activePlayable = list.filter((p) => !p.isPaused && !p.isBuffering);
    if (activePlayable.length >= 2) {
      const maxPos = Math.max(...activePlayable.map((p) => p.positionSeconds));
      const minPos = Math.min(...activePlayable.map((p) => p.positionSeconds));
      const spread = maxPos - minPos;

      // If spread > 2.0 seconds, engage elastic pace-matching:
      // Leader slows down to 1.0x, trailing users boost to 1.4x
      if (spread > 2.0) {
        for (const p of list) {
          if (maxPos - p.positionSeconds <= 1.0) {
            p.playbackRate = 1.0; // Fastest user slows down to 1.0x
          } else if (maxPos - p.positionSeconds > 2.0) {
            p.playbackRate = 1.4; // Slow user speeds up to 1.4x to catch up
          } else {
            p.playbackRate = 1.25; // Default cruise
          }
        }
      } else {
        for (const p of list) {
          p.playbackRate = 1.25;
        }
      }
    } else {
      for (const p of list) {
        p.playbackRate = 1.25;
      }
    }
  } else {
    // Mode 1: ALL_PAUSE plays at 1.0x normal speed
    for (const p of list) {
      p.playbackRate = 1.0;
    }
  }

  return room;
}
