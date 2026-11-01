import { NextRequest, NextResponse } from "next/server";
import {
  getRoomsStore,
  generateRoomCode,
  recomputeRoomState,
  WatchRoom,
  WatchTogetherMode,
} from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = (searchParams.get("roomId") || "").trim().toLowerCase();

  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const store = getRoomsStore();
  const room = store.get(roomId);
  if (!room) {
    return NextResponse.json(
      { error: "Watch Together room not found or expired" },
      { status: 404 }
    );
  }

  recomputeRoomState(room);
  return NextResponse.json({ room });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    action,
    roomId: rawRoomId,
    mediaItemId,
    episodeId,
    mode,
    participant,
    seekTime,
  } = body;

  const store = getRoomsStore();

  // 1. Create a new Watch Together Room
  if (action === "create") {
    if (!mediaItemId) {
      return NextResponse.json(
        { error: "mediaItemId is required to create a room" },
        { status: 400 }
      );
    }

    let code = generateRoomCode();
    while (store.has(code)) {
      code = generateRoomCode();
    }

    const initialMode: WatchTogetherMode =
      mode === "MARIO_KART" ? "MARIO_KART" : "ALL_PAUSE";

    const newRoom: WatchRoom = {
      id: code,
      mediaItemId,
      episodeId: episodeId || null,
      mode: initialMode,
      isPlaying: true,
      pausedByProfileName: null,
      bufferingProfileName: null,
      lastSeekSeq: 0,
      lastSeekTime: 0,
      createdAt: Date.now(),
      participants: {},
    };

    if (participant && participant.participantId) {
      newRoom.participants[participant.participantId] = {
        participantId: participant.participantId,
        profileId: participant.profileId,
        profileName: participant.profileName,
        avatarColor: participant.avatarColor || "#E50914",
        avatarIcon: participant.avatarIcon || "smile",
        positionSeconds: Number(participant.positionSeconds) || 0,
        durationSeconds: Number(participant.durationSeconds) || 600,
        isPaused: Boolean(participant.isPaused),
        isBuffering: Boolean(participant.isBuffering),
        playbackRate: initialMode === "MARIO_KART" ? 1.25 : 1.0,
        rank: 1,
        updatedAt: Date.now(),
      };
    }

    recomputeRoomState(newRoom);
    store.set(code, newRoom);
    return NextResponse.json({ room: newRoom }, { status: 201 });
  }

  const roomId = (rawRoomId || "").trim().toLowerCase();
  const room = store.get(roomId);
  if (!room) {
    return NextResponse.json(
      { error: "Watch Together room not found" },
      { status: 404 }
    );
  }

  // 2. Leave room
  if (action === "leave" && participant?.participantId) {
    delete room.participants[participant.participantId];
    recomputeRoomState(room);
    return NextResponse.json({ room });
  }

  // 3. Upsert participant state on heartbeat / action
  if (participant && participant.participantId) {
    const existing = room.participants[participant.participantId];
    room.participants[participant.participantId] = {
      participantId: participant.participantId,
      profileId: participant.profileId || existing?.profileId || "guest",
      profileName: participant.profileName || existing?.profileName || "Guest",
      avatarColor:
        participant.avatarColor || existing?.avatarColor || "#E50914",
      avatarIcon: participant.avatarIcon || existing?.avatarIcon || "smile",
      positionSeconds:
        participant.positionSeconds !== undefined
          ? Number(participant.positionSeconds)
          : existing?.positionSeconds || 0,
      durationSeconds:
        participant.durationSeconds !== undefined
          ? Number(participant.durationSeconds)
          : existing?.durationSeconds || 600,
      isPaused:
        participant.isPaused !== undefined
          ? Boolean(participant.isPaused)
          : existing?.isPaused || false,
      isBuffering:
        participant.isBuffering !== undefined
          ? Boolean(participant.isBuffering)
          : existing?.isBuffering || false,
      playbackRate: existing?.playbackRate || 1.0,
      rank: existing?.rank || 1,
      updatedAt: Date.now(),
    };
  }

  // 4. Handle Room Mode Switch
  if (action === "setMode" && (mode === "ALL_PAUSE" || mode === "MARIO_KART")) {
    room.mode = mode;
    if (mode === "MARIO_KART") {
      // In Mario Kart mode, unpause shared lock so everyone races with rubber-band speeds
      room.isPlaying = true;
      room.pausedByProfileName = null;
    }
  }

  // 5. Handle Shared Pause / Play / Seek in Mode 1 (ALL_PAUSE) or explicit Seek
  if (action === "pause") {
    if (room.mode === "ALL_PAUSE") {
      room.isPlaying = false;
      room.pausedByProfileName = participant?.profileName || "Someone";
      if (participant?.positionSeconds !== undefined) {
        room.lastSeekSeq += 1;
        room.lastSeekTime = Number(participant.positionSeconds);
      }
    }
  } else if (action === "play") {
    if (room.mode === "ALL_PAUSE") {
      room.isPlaying = true;
      room.pausedByProfileName = null;
    }
  } else if (action === "seek" && typeof seekTime === "number") {
    if (room.mode === "ALL_PAUSE") {
      room.lastSeekSeq += 1;
      room.lastSeekTime = seekTime;
    }
  }

  recomputeRoomState(room);
  return NextResponse.json({ room });
}
