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
    messageId,
    messageText,
    imageUrl,
    emoji,
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
      mode === "PACE_SYNC" ? "PACE_SYNC" : "ALL_PAUSE";

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
      messages: [],
    };

    if (participant && participant.participantId) {
      newRoom.participants[participant.participantId] = {
        participantId: participant.participantId,
        profileId: participant.profileId,
        profileName: participant.profileName,
        avatarColor: participant.avatarColor || "#2563EB",
        avatarIcon: participant.avatarIcon || "smile",
        positionSeconds: Number(participant.positionSeconds) || 0,
        durationSeconds: Number(participant.durationSeconds) || 600,
        isPaused: Boolean(participant.isPaused),
        isBuffering: Boolean(participant.isBuffering),
        playbackRate: initialMode === "PACE_SYNC" ? 1.25 : 1.0,
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
        participant.avatarColor || existing?.avatarColor || "#2563EB",
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
  if (action === "setMode" && (mode === "ALL_PAUSE" || mode === "PACE_SYNC")) {
    room.mode = mode;
    if (mode === "PACE_SYNC") {
      // In Pace Sync mode, unpause shared lock so everyone plays with elastic catch-up speeds
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
  } else if (action === "chat") {
    const trimmed = typeof messageText === "string" ? messageText.trim() : "";
    const validImage =
      typeof imageUrl === "string" && imageUrl.startsWith("data:image/")
        ? imageUrl
        : null;
    if (trimmed || validImage) {
      if (!room.messages) room.messages = [];
      room.messages.push({
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        participantId: participant?.participantId || "guest",
        profileId: participant?.profileId || "guest",
        profileName: participant?.profileName || "Guest",
        avatarColor: participant?.avatarColor || "#2563EB",
        avatarIcon: participant?.avatarIcon || "smile",
        text: trimmed.slice(0, 1000),
        imageUrl: validImage,
        reactions: {},
        editedAt: null,
        videoTimestamp: Number(participant?.positionSeconds) || 0,
        createdAt: Date.now(),
      });
      if (room.messages.length > 200) {
        room.messages = room.messages.slice(-200);
      }
    }
  } else if (action === "editChat" && typeof messageId === "string" && typeof messageText === "string") {
    if (room.messages) {
      const msg = room.messages.find((m) => m.id === messageId);
      if (
        msg &&
        (msg.participantId === participant?.participantId ||
          msg.profileId === participant?.profileId)
      ) {
        const nextText = messageText.trim().slice(0, 1000);
        if (nextText || msg.imageUrl) {
          msg.text = nextText;
          msg.editedAt = Date.now();
        }
      }
    }
  } else if (action === "deleteChat" && typeof messageId === "string") {
    if (room.messages) {
      room.messages = room.messages.filter(
        (m) =>
          m.id !== messageId ||
          (m.participantId !== participant?.participantId &&
            m.profileId !== participant?.profileId)
      );
    }
  } else if (
    action === "reactChat" &&
    typeof messageId === "string" &&
    typeof emoji === "string" &&
    emoji.trim()
  ) {
    if (room.messages) {
      const msg = room.messages.find((m) => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        const key = emoji.trim();
        const existingList = msg.reactions[key] || [];
        const pid = participant?.profileId || participant?.participantId || "guest";
        const pname = participant?.profileName || "Guest";
        const alreadyIdx = existingList.findIndex((r) => r.profileId === pid);
        if (alreadyIdx !== -1) {
          existingList.splice(alreadyIdx, 1);
          if (existingList.length === 0) {
            delete msg.reactions[key];
          } else {
            msg.reactions[key] = existingList;
          }
        } else {
          msg.reactions[key] = [...existingList, { profileId: pid, profileName: pname }];
        }
      }
    }
  }

  recomputeRoomState(room);
  return NextResponse.json({ room });
}
