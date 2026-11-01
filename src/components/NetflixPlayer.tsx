"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MediaItem, Episode, Profile } from "@/types/ownflix";
import { WatchRoom, WatchTogetherMode, RoomChatMessage } from "@/lib/rooms";
import { renderProfileIcon } from "./ProfileGate";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  Subtitles,
  Gauge,
  Layers,
  Check,
  Sparkles,
  Wifi,
  SlidersHorizontal,
  Users,
  Copy,
  Flame,
  X,
  MessageSquare,
  Send,
  Smile,
  Image as ImageIcon,
  Pencil,
  Trash2,
  AudioLines,
} from "lucide-react";

interface NetflixPlayerProps {
  item: MediaItem;
  initialEpisode?: Episode;
  startFromBeginning?: boolean;
  activeProfile: Profile;
  initialRoomId?: string | null;
  onClose: () => void;
  onProgressUpdated: () => void;
}

interface CueItem {
  start: number;
  end: number;
  text: string;
}

export type StreamQualityMode =
  | "auto"
  | "original"
  | "1080p"
  | "720p"
  | "480p"
  | "360p";

export type EffectiveQuality = "original" | "1080p" | "720p" | "480p" | "360p";

export type AudioNormMode = "off" | "voice_boost" | "night_mode" | "loudnorm";

const AUDIO_NORM_OPTIONS: {
  id: AudioNormMode;
  label: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: "off",
    label: "Original Audio Stream",
    badge: "Untouched",
    desc: "Direct theatre dynamic range without normalization",
  },
  {
    id: "voice_boost",
    label: "Smart Dialogue Boost",
    badge: "Voice +5.5dB",
    desc: "Boosts human speech (350Hz–3kHz), cuts sub-bass rumble, and normalizes loud music/effects via FFmpeg dynaudnorm",
  },
  {
    id: "night_mode",
    label: "Night Mode (Heavy Compression)",
    badge: "8:1 Compressor",
    desc: "Clamps loud explosions & music while lifting quiet whispers to a uniform volume",
  },
  {
    id: "loudnorm",
    label: "Broadcast Loudness Leveler",
    badge: "dynaudnorm",
    desc: "Smooth dynamic audio normalization across the entire movie or episode",
  },
];

const QUALITY_OPTIONS: {
  id: StreamQualityMode;
  label: string;
  bitrate: string;
  desc: string;
}[] = [
  {
    id: "auto",
    label: "Auto (Adaptive)",
    bitrate: "Dynamic",
    desc: "Automatically scales resolution for slower connections",
  },
  {
    id: "original",
    label: "Original / Direct",
    bitrate: "Max Quality",
    desc: "Uncompressed source or high-bitrate 1080p",
  },
  {
    id: "1080p",
    label: "1080p Full HD",
    bitrate: "~4.5 Mbps",
    desc: "Fast Wi-Fi or wired broadband",
  },
  {
    id: "720p",
    label: "720p HD",
    bitrate: "~2.2 Mbps",
    desc: "Balanced quality for moderate connections",
  },
  {
    id: "480p",
    label: "480p SD (Data Saver)",
    bitrate: "~900 Kbps",
    desc: "Smooth playback on slower connections",
  },
  {
    id: "360p",
    label: "360p Low Bandwidth",
    bitrate: "~450 Kbps",
    desc: "Fastest loading on weak Wi-Fi or mobile hotspots",
  },
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const EMOJI_CATEGORIES: {
  id: string;
  label: string;
  icon: string;
  emojis: { char: string; keywords: string }[];
}[] = [
  {
    id: "smileys",
    label: "Smileys & People",
    icon: "😀",
    emojis: [
      { char: "😀", keywords: "grinning happy smile" },
      { char: "😃", keywords: "smiley happy joy" },
      { char: "😄", keywords: "smile happy laugh" },
      { char: "😁", keywords: "grin happy teeth" },
      { char: "😆", keywords: "laughing squinting xd" },
      { char: "😅", keywords: "sweat smile relief" },
      { char: "🤣", keywords: "rofl rolling laughing floor" },
      { char: "😂", keywords: "joy tears laugh cry" },
      { char: "🙂", keywords: "slightly smiling" },
      { char: "🙃", keywords: "upside down silly" },
      { char: "🫠", keywords: "melting face" },
      { char: "😉", keywords: "wink" },
      { char: "😊", keywords: "blush warm smile" },
      { char: "😇", keywords: "innocent halo angel" },
      { char: "🥰", keywords: "smiling hearts love adore" },
      { char: "😍", keywords: "heart eyes love crush" },
      { char: "🤩", keywords: "star struck excited amazed" },
      { char: "😘", keywords: "kiss blow heart" },
      { char: "😗", keywords: "kissing" },
      { char: "😚", keywords: "kissing closed eyes" },
      { char: "😙", keywords: "kissing smiling" },
      { char: "🥲", keywords: "smiling tear proud grateful" },
      { char: "😋", keywords: "yum delicious tasty" },
      { char: "😛", keywords: "tongue out playful" },
      { char: "😜", keywords: "wink tongue crazy" },
      { char: "🤪", keywords: "zany goofy wild" },
      { char: "😝", keywords: "squinting tongue" },
      { char: "🤑", keywords: "money rich dollar" },
      { char: "🤗", keywords: "hugging hug warm" },
      { char: "🤭", keywords: "hand over mouth giggle oops" },
      { char: "🫢", keywords: "gasp shock" },
      { char: "🫣", keywords: "peeking shy" },
      { char: "🤫", keywords: "shush quiet secret" },
      { char: "🤔", keywords: "thinking hmm" },
      { char: "🫡", keywords: "salute respect" },
      { char: "🤐", keywords: "zipper mouth silent" },
      { char: "🤨", keywords: "raised eyebrow skeptical" },
      { char: "😐", keywords: "neutral straight face" },
      { char: "😑", keywords: "expressionless annoyed" },
      { char: "😶", keywords: "no mouth speechless" },
      { char: "🫥", keywords: "dotted line invisible" },
      { char: "😏", keywords: "smirk smug" },
      { char: "😒", keywords: "unamused side eye" },
      { char: "🙄", keywords: "eye roll whatever" },
      { char: "😬", keywords: "grimacing awkward" },
      { char: "😮‍💨", keywords: "exhale sigh phew" },
      { char: "🤥", keywords: "lying pinocchio" },
      { char: "😌", keywords: "relieved calm" },
      { char: "😔", keywords: "pensive sad down" },
      { char: "😪", keywords: "sleepy tired" },
      { char: "🤤", keywords: "drooling hungry" },
      { char: "😴", keywords: "sleeping zzz" },
      { char: "😷", keywords: "mask sick" },
      { char: "🤒", keywords: "thermometer fever ill" },
      { char: "🤕", keywords: "bandage hurt injured" },
      { char: "🤢", keywords: "nauseated gross sick" },
      { char: "🤮", keywords: "vomiting puke" },
      { char: "🤧", keywords: "sneezing achoo" },
      { char: "🥵", keywords: "hot sweat spicy" },
      { char: "🥶", keywords: "cold freezing ice" },
      { char: "🥴", keywords: "woozy dizzy drunk" },
      { char: "😵", keywords: "dizzy knocked out" },
      { char: "😵‍💫", keywords: "spiral eyes hypnosis" },
      { char: "🤯", keywords: "exploding head mind blown" },
      { char: "🤠", keywords: "cowboy hat yeehaw" },
      { char: "🥳", keywords: "partying celebrate birthday" },
      { char: "🥸", keywords: "disguised glasses incognito" },
      { char: "😎", keywords: "cool sunglasses" },
      { char: "🤓", keywords: "nerd geek glasses" },
      { char: "🧐", keywords: "monocle inspect classy" },
      { char: "😕", keywords: "confused" },
      { char: "🫤", keywords: "diagonal mouth unsure" },
      { char: "😟", keywords: "worried concerned" },
      { char: "🙁", keywords: "slightly frowning" },
      { char: "😮", keywords: "open mouth wow surprised" },
      { char: "😯", keywords: "hushed surprised" },
      { char: "😲", keywords: "astonished shocked" },
      { char: "😳", keywords: "flushed embarrassed" },
      { char: "🥺", keywords: "pleading puppy eyes" },
      { char: "🥹", keywords: "holding back tears touched" },
      { char: "😦", keywords: "frowning open mouth" },
      { char: "😧", keywords: "anguished" },
      { char: "😨", keywords: "fearful scared" },
      { char: "😰", keywords: "anxious cold sweat" },
      { char: "😥", keywords: "sad relieved" },
      { char: "😢", keywords: "crying tear sad" },
      { char: "😭", keywords: "sobbing loud crying bawling" },
      { char: "😱", keywords: "screaming fear horror" },
      { char: "😖", keywords: "confounded" },
      { char: "😣", keywords: "persevering struggle" },
      { char: "😞", keywords: "disappointed" },
      { char: "😓", keywords: "downcast sweat" },
      { char: "😩", keywords: "weary exhausted" },
      { char: "😫", keywords: "tired fed up" },
      { char: "🥱", keywords: "yawning bored" },
      { char: "😤", keywords: "triumph steam nose mad" },
      { char: "😡", keywords: "pouting angry rage red" },
      { char: "😠", keywords: "angry mad" },
      { char: "🤬", keywords: "cursing swearing symbols" },
      { char: "😈", keywords: "smiling devil horns" },
      { char: "👿", keywords: "angry devil" },
      { char: "💀", keywords: "skull dead im dead" },
      { char: "☠️", keywords: "skull crossbones danger" },
      { char: "💩", keywords: "poop pile" },
      { char: "🤡", keywords: "clown circus" },
      { char: "👹", keywords: "ogre monster" },
      { char: "👺", keywords: "goblin" },
      { char: "👻", keywords: "ghost boo spooky" },
      { char: "👽", keywords: "alien ufo" },
      { char: "👾", keywords: "alien monster arcade game" },
      { char: "🤖", keywords: "robot bot" },
    ],
  },
  {
    id: "gestures",
    label: "Hands & Gestures",
    icon: "👍",
    emojis: [
      { char: "👋", keywords: "wave hello bye" },
      { char: "🤚", keywords: "raised back hand" },
      { char: "🖐️", keywords: "hand five fingers" },
      { char: "✋", keywords: "stop high five" },
      { char: "🖖", keywords: "vulcan salute spock" },
      { char: "🫱", keywords: "rightwards hand" },
      { char: "🫲", keywords: "leftwards hand" },
      { char: "👌", keywords: "ok perfect" },
      { char: "🤌", keywords: "pinched fingers italian chef kiss" },
      { char: "🤏", keywords: "pinching small tiny" },
      { char: "✌️", keywords: "peace victory" },
      { char: "🤞", keywords: "crossed fingers luck" },
      { char: "🫰", keywords: "hand index thumb crossed finger heart" },
      { char: "🤟", keywords: "love you gesture" },
      { char: "🤘", keywords: "rock on metal horns" },
      { char: "🤙", keywords: "call me shaka" },
      { char: "👈", keywords: "point left" },
      { char: "👉", keywords: "point right" },
      { char: "👆", keywords: "point up" },
      { char: "🖕", keywords: "middle finger" },
      { char: "👇", keywords: "point down" },
      { char: "☝️", keywords: "index pointing up" },
      { char: "🫵", keywords: "index pointing at viewer you" },
      { char: "👍", keywords: "thumbs up like approve yes" },
      { char: "👎", keywords: "thumbs down dislike no" },
      { char: "✊", keywords: "raised fist power" },
      { char: "👊", keywords: "oncoming fist bump" },
      { char: "🤛", keywords: "left facing fist" },
      { char: "🤜", keywords: "right facing fist" },
      { char: "👏", keywords: "clapping applause bravo" },
      { char: "🙌", keywords: "raising hands hooray praise" },
      { char: "🫶", keywords: "heart hands love" },
      { char: "👐", keywords: "open hands" },
      { char: "🤲", keywords: "palms up together" },
      { char: "🤝", keywords: "handshake deal agree" },
      { char: "🙏", keywords: "folded hands pray please thank you" },
      { char: "✍️", keywords: "writing hand" },
      { char: "💅", keywords: "nail polish slay" },
      { char: "💪", keywords: "flexed biceps strong muscle" },
      { char: "👀", keywords: "eyes looking watching" },
      { char: "👁️", keywords: "eye" },
      { char: "🧠", keywords: "brain smart genius" },
      { char: "🗣️", keywords: "speaking head talk" },
      { char: "🫂", keywords: "people hugging comfort" },
      { char: "🤷", keywords: "shrug idk whatever" },
      { char: "🤦", keywords: "facepalm" },
      { char: "🙇", keywords: "bowing sorry" },
      { char: "💃", keywords: "woman dancing party" },
      { char: "🕺", keywords: "man dancing disco" },
    ],
  },
  {
    id: "hearts",
    label: "Hearts & Vibes",
    icon: "❤️",
    emojis: [
      { char: "❤️", keywords: "red heart love" },
      { char: "🧡", keywords: "orange heart" },
      { char: "💛", keywords: "yellow heart" },
      { char: "💚", keywords: "green heart" },
      { char: "💙", keywords: "blue heart" },
      { char: "💜", keywords: "purple heart" },
      { char: "🖤", keywords: "black heart" },
      { char: "🤍", keywords: "white heart" },
      { char: "🤎", keywords: "brown heart" },
      { char: "💔", keywords: "broken heart sad" },
      { char: "❤️‍🔥", keywords: "heart on fire passion" },
      { char: "❤️‍🩹", keywords: "mending heart healing" },
      { char: "❣️", keywords: "heart exclamation" },
      { char: "💕", keywords: "two hearts" },
      { char: "💞", keywords: "revolving hearts" },
      { char: "💓", keywords: "beating heart" },
      { char: "💗", keywords: "growing heart" },
      { char: "💖", keywords: "sparkling heart" },
      { char: "💘", keywords: "heart arrow cupid" },
      { char: "💝", keywords: "heart ribbon gift" },
      { char: "💋", keywords: "kiss mark lips" },
      { char: "💯", keywords: "hundred points 100" },
      { char: "💢", keywords: "anger symbol" },
      { char: "💥", keywords: "collision boom explosion" },
      { char: "💫", keywords: "dizzy star" },
      { char: "💦", keywords: "sweat droplets" },
      { char: "💨", keywords: "dashing away fast wind" },
      { char: "🔥", keywords: "fire lit hot flame" },
      { char: "✨", keywords: "sparkles magic shine" },
      { char: "🌟", keywords: "glowing star" },
      { char: "⭐", keywords: "star" },
      { char: "⚡", keywords: "high voltage lightning zap" },
      { char: "🌈", keywords: "rainbow" },
      { char: "☀️", keywords: "sun sunny" },
      { char: "🌙", keywords: "crescent moon night" },
      { char: "💤", keywords: "zzz sleep" },
    ],
  },
  {
    id: "movies",
    label: "Movies, Food & Party",
    icon: "🍿",
    emojis: [
      { char: "🍿", keywords: "popcorn movie cinema snack" },
      { char: "🎬", keywords: "clapper board movie film action" },
      { char: "🎥", keywords: "movie camera cinema" },
      { char: "📽️", keywords: "film projector" },
      { char: "🎞️", keywords: "film frames" },
      { char: "📺", keywords: "television tv show" },
      { char: "🎭", keywords: "performing arts drama masks" },
      { char: "🎟️", keywords: "admission tickets" },
      { char: "🎫", keywords: "ticket" },
      { char: "🏆", keywords: "trophy winner award oscar" },
      { char: "🥇", keywords: "first place medal gold" },
      { char: "👑", keywords: "crown king queen" },
      { char: "🎉", keywords: "party popper celebrate" },
      { char: "🎊", keywords: "confetti ball" },
      { char: "🎈", keywords: "balloon" },
      { char: "🎁", keywords: "wrapped gift present" },
      { char: "🎂", keywords: "birthday cake" },
      { char: "🍕", keywords: "pizza slice" },
      { char: "🍔", keywords: "hamburger burger" },
      { char: "🍟", keywords: "french fries" },
      { char: "🌭", keywords: "hot dog" },
      { char: "🌮", keywords: "taco" },
      { char: "🌯", keywords: "burrito" },
      { char: "🍣", keywords: "sushi" },
      { char: "🍜", keywords: "ramen noodles" },
      { char: "🍩", keywords: "doughnut donut" },
      { char: "🍪", keywords: "cookie" },
      { char: "🍫", keywords: "chocolate bar" },
      { char: "🍦", keywords: "ice cream" },
      { char: "☕", keywords: "hot beverage coffee tea" },
      { char: "🥤", keywords: "cup with straw soda" },
      { char: "🧋", keywords: "bubble tea boba" },
      { char: "🍺", keywords: "beer mug" },
      { char: "🍻", keywords: "clinking beer mugs cheers" },
      { char: "🥂", keywords: "clinking glasses champagne toast" },
      { char: "🍷", keywords: "wine glass" },
      { char: "🍸", keywords: "cocktail glass" },
      { char: "🎮", keywords: "video game controller" },
      { char: "🎧", keywords: "headphone audio music" },
      { char: "🎵", keywords: "musical note" },
      { char: "🎶", keywords: "musical notes" },
      { char: "🎤", keywords: "microphone" },
      { char: "🎸", keywords: "guitar rock" },
    ],
  },
  {
    id: "animals",
    label: "Animals & Objects",
    icon: "🚀",
    emojis: [
      { char: "🐶", keywords: "dog puppy" },
      { char: "🐱", keywords: "cat kitty" },
      { char: "🐭", keywords: "mouse" },
      { char: "🐹", keywords: "hamster" },
      { char: "🐰", keywords: "rabbit bunny" },
      { char: "🦊", keywords: "fox" },
      { char: "🐻", keywords: "bear" },
      { char: "🐼", keywords: "panda" },
      { char: "🐨", keywords: "koala" },
      { char: "🐯", keywords: "tiger" },
      { char: "🦁", keywords: "lion" },
      { char: "🐸", keywords: "frog" },
      { char: "🐵", keywords: "monkey" },
      { char: "🙈", keywords: "see no evil monkey" },
      { char: "🙉", keywords: "hear no evil monkey" },
      { char: "🙊", keywords: "speak no evil monkey" },
      { char: "🐧", keywords: "penguin" },
      { char: "🦄", keywords: "unicorn" },
      { char: "🐝", keywords: "bee" },
      { char: "🦋", keywords: "butterfly" },
      { char: "🐢", keywords: "turtle slow" },
      { char: "🐍", keywords: "snake" },
      { char: "🦖", keywords: "t-rex dinosaur" },
      { char: "🐙", keywords: "octopus" },
      { char: "🦈", keywords: "shark" },
      { char: "🐬", keywords: "dolphin" },
      { char: "🐳", keywords: "whale" },
      { char: "🐐", keywords: "goat greatest of all time" },
      { char: "🚀", keywords: "rocket launch space" },
      { char: "🛸", keywords: "flying saucer ufo" },
      { char: "🚗", keywords: "car automobile" },
      { char: "🏎️", keywords: "racing car fast" },
      { char: "✈️", keywords: "airplane flight" },
      { char: "💎", keywords: "gem stone diamond" },
      { char: "💰", keywords: "money bag" },
      { char: "💸", keywords: "money with wings" },
      { char: "💣", keywords: "bomb" },
      { char: "🛡️", keywords: "shield" },
      { char: "⚔️", keywords: "crossed swords fight" },
      { char: "🔮", keywords: "crystal ball magic" },
      { char: "💡", keywords: "light bulb idea" },
      { char: "🚨", keywords: "police car light alert siren" },
      { char: "🚩", keywords: "triangular flag red flag" },
      { char: "✅", keywords: "check mark button yes" },
      { char: "❌", keywords: "cross mark no" },
      { char: "❓", keywords: "question mark" },
      { char: "❗", keywords: "exclamation mark" },
    ],
  },
];

function detectInitialAutoQuality(): EffectiveQuality {
  if (typeof navigator !== "undefined" && "connection" in navigator) {
    const conn = (
      navigator as unknown as {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          saveData?: boolean;
        };
      }
    ).connection;
    if (conn) {
      if (conn.saveData) return "480p";
      if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
        return "360p";
      }
    }
  }
  return "original";
}

function parseTimeVtt(str: string): number {
  const clean = str.trim().split(/\s+/)[0];
  const parts = clean.split(":");
  if (parts.length === 3) {
    return (
      parseFloat(parts[0]) * 3600 +
      parseFloat(parts[1]) * 60 +
      parseFloat(parts[2])
    );
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

function parseVtt(vttText: string): CueItem[] {
  const blocks = vttText.replace(/\r\n/g, "\n").split("\n\n");
  const cues: CueItem[] = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const arrowIdx = lines.findIndex((l) => l.includes("-->"));
    if (arrowIdx !== -1) {
      const [startRaw, endRaw] = lines[arrowIdx].split("-->");
      const text = lines
        .slice(arrowIdx + 1)
        .join("\n")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (text) {
        cues.push({
          start: parseTimeVtt(startRaw),
          end: parseTimeVtt(endRaw),
          text,
        });
      }
    }
  }
  return cues;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(s).padStart(
      2,
      "0"
    )}`;
  }
  return `${mins}:${String(s).padStart(2, "0")}`;
}

function formatOrdinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export default function NetflixPlayer({
  item,
  initialEpisode,
  startFromBeginning = false,
  activeProfile,
  initialRoomId = null,
  onClose,
  onProgressUpdated,
}: NetflixPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const bufferingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Unique participant session ID per tab so multiple tabs can join the same room
  const participantIdRef = useRef<string>(
    `p-${Math.random().toString(36).slice(2, 9)}`
  );
  const isRemoteSyncActionRef = useRef<boolean>(false);
  const lastAppliedSeekSeqRef = useRef<number>(0);

  // Determine active episode if series
  const [currentEpisode, setCurrentEpisode] = useState<Episode | undefined>(
    () => {
      if (initialEpisode) return initialEpisode;
      if (item.type === "SERIES" && item.episodes.length > 0) {
        if (item.progress?.episodeId) {
          const matched = item.episodes.find(
            (e) => e.id === item.progress?.episodeId
          );
          if (matched) return matched;
        }
        return item.episodes[0];
      }
      return undefined;
    }
  );

  // Watch Together Room & Docked Chat State
  const [roomId, setRoomId] = useState<string | null>(initialRoomId);
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>("smileys");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<RoomChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  // Quality mode state
  const [qualityMode, setQualityMode] = useState<StreamQualityMode>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(
        "ownflix_quality_mode"
      ) as StreamQualityMode | null;
      if (saved && QUALITY_OPTIONS.some((o) => o.id === saved)) {
        return saved;
      }
    }
    return "auto";
  });

  const [autoEffectiveQuality, setAutoEffectiveQuality] =
    useState<EffectiveQuality>(() => detectInitialAutoQuality());
  const [adaptiveBanner, setAdaptiveBanner] = useState<string | null>(null);

  // Smart Audio Normalization Stream Mode
  const [audioNormMode, setAudioNormMode] = useState<AudioNormMode>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(
        "ownflix_audio_norm_mode"
      ) as AudioNormMode | null;
      if (saved && AUDIO_NORM_OPTIONS.some((o) => o.id === saved)) {
        return saved;
      }
    }
    return "off";
  });

  const effectiveQuality: EffectiveQuality =
    qualityMode === "auto" ? autoEffectiveQuality : qualityMode;

  const activeFilePath = currentEpisode?.filePath || item.filePath || null;
  const isLocalFile = Boolean(activeFilePath);
  const isContainerPiped = Boolean(
    activeFilePath && /\.(mkv|avi|ts)$/i.test(activeFilePath)
  );

  const isPipedStream =
    isContainerPiped ||
    effectiveQuality !== "original" ||
    audioNormMode !== "off";

  // Known duration from FFprobe in DB
  const knownDuration =
    (currentEpisode?.duration && currentEpisode.duration > 0
      ? currentEpisode.duration
      : item.duration && item.duration > 0
      ? item.duration
      : 0) || 600;

  // Initial resume timestamp
  const initialResumeSeconds = useMemo(() => {
    if (
      initialRoomId ||
      startFromBeginning ||
      !item.progress ||
      item.progress.completed
    ) {
      return 0;
    }
    const sameEp =
      !currentEpisode || item.progress.episodeId === currentEpisode.id;
    if (sameEp && item.progress.positionSeconds > 2) {
      return Math.floor(item.progress.positionSeconds);
    }
    return 0;
  }, [initialRoomId, startFromBeginning, item.progress, currentEpisode]);

  const [streamOffset, setStreamOffset] = useState<number>(() =>
    isPipedStream ? initialResumeSeconds : 0
  );

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(initialResumeSeconds);
  const [duration, setDuration] = useState<number>(knownDuration);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Interactive Scrubber Hover & Drag state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);

  useEffect(() => {
    setDuration(knownDuration);
  }, [knownDuration]);

  // Popovers: "none" | "audioSub" | "audioNorm" | "speed" | "episodes" | "quality" | "room"
  const [activePopover, setActivePopover] = useState<
    "none" | "audioSub" | "audioNorm" | "speed" | "episodes" | "quality" | "room"
  >("none");

  const audioOptions = useMemo(
    () =>
      item.audioTracks
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [item.audioTracks]
  );

  const subtitleOptions = useMemo(() => {
    const rawTracks = item.subtitleTracks
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const counts: Record<string, number> = {};
    const labeled = rawTracks.map((t) => {
      counts[t] = (counts[t] || 0) + 1;
      const totalSame = rawTracks.filter((x) => x === t).length;
      return totalSame > 1 ? `${t} #${counts[t]}` : t;
    });
    return ["Off", ...labeled];
  }, [item.subtitleTracks]);

  const [selectedAudio, setSelectedAudio] = useState(
    audioOptions[0] || "English (Original)"
  );
  const [selectedSubtitle, setSelectedSubtitle] = useState(
    subtitleOptions[1] || "Off"
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cues, setCues] = useState<CueItem[]>([]);
  const [creditsDismissed, setCreditsDismissed] = useState(false);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);

  // Build stream URL with quality preset, smart audio normalization & start offset
  const streamUrl = useMemo(() => {
    const apiBase = currentEpisode
      ? `/api/stream?episodeId=${currentEpisode.id}`
      : `/api/stream?mediaId=${item.id}`;

    const directUrl = currentEpisode
      ? currentEpisode.filePath
        ? apiBase
        : currentEpisode.videoUrl
      : item.filePath
      ? apiBase
      : item.videoUrl || "";

    const base =
      (effectiveQuality !== "original" || audioNormMode !== "off") &&
      !directUrl.startsWith("/api/stream")
        ? apiBase
        : directUrl;

    if (!base.startsWith("/api/stream")) {
      return base;
    }

    const params: string[] = [];
    if (effectiveQuality !== "original") {
      params.push(`quality=${effectiveQuality}`);
      params.push("transcode=1");
    }
    if (audioNormMode !== "off") {
      params.push(`audioNorm=${audioNormMode}`);
    }
    if (isPipedStream && streamOffset > 0) {
      params.push(`start=${Math.floor(streamOffset)}`);
    }
    return params.length > 0 ? `${base}&${params.join("&")}` : base;
  }, [
    currentEpisode,
    item,
    effectiveQuality,
    audioNormMode,
    isPipedStream,
    streamOffset,
  ]);

  // Unified seek function
  const seekTo = useCallback(
    (targetSec: number, broadcastToRoom = true) => {
      const clamped = Math.max(
        0,
        Math.min(duration || knownDuration, targetSec)
      );
      const v = videoRef.current;

      if (isPipedStream) {
        const relTarget = clamped - streamOffset;
        if (v && relTarget >= 0 && relTarget <= bufferedEnd - 0.5) {
          v.currentTime = relTarget;
          setCurrentTime(clamped);
        } else {
          setBufferedEnd(0);
          setStreamOffset(Math.floor(clamped));
          setCurrentTime(clamped);
        }
      } else {
        if (v) {
          v.currentTime = clamped;
        }
        setCurrentTime(clamped);
      }

      if (broadcastToRoom && roomId && room?.mode === "ALL_PAUSE") {
        fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "seek",
            roomId,
            seekTime: clamped,
            participant: {
              participantId: participantIdRef.current,
              profileId: activeProfile.id,
              profileName: activeProfile.name,
              avatarColor: activeProfile.avatarColor,
              avatarIcon: activeProfile.avatarIcon,
              positionSeconds: clamped,
              durationSeconds: duration || knownDuration,
              isPaused: !isPlaying,
              isBuffering,
            },
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.room) {
              lastAppliedSeekSeqRef.current = d.room.lastSeekSeq;
              setRoom(d.room);
            }
          })
          .catch(() => {});
      }
    },
    [
      duration,
      knownDuration,
      isPipedStream,
      streamOffset,
      bufferedEnd,
      roomId,
      room?.mode,
      activeProfile,
      isPlaying,
      isBuffering,
    ]
  );

  // Create Watch Together Room
  const handleCreateRoom = async (initialMode: WatchTogetherMode = "PACE_SYNC") => {
    setCreatingRoom(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          mediaItemId: item.id,
          episodeId: currentEpisode?.id || null,
          mode: initialMode,
          participant: {
            participantId: participantIdRef.current,
            profileId: activeProfile.id,
            profileName: activeProfile.name,
            avatarColor: activeProfile.avatarColor,
            avatarIcon: activeProfile.avatarIcon,
            positionSeconds: currentTime,
            durationSeconds: duration || knownDuration,
            isPaused: !isPlaying,
            isBuffering,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoomId(data.room.id);
        setRoom(data.room);
        lastAppliedSeekSeqRef.current = data.room.lastSeekSeq || 0;
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("room", data.room.id);
          window.history.replaceState({}, "", url.toString());
        }
      }
    } finally {
      setCreatingRoom(false);
    }
  };

  // Switch Watch Together Room Mode ("ALL_PAUSE" vs "PACE_SYNC")
  const handleSetRoomMode = async (newMode: WatchTogetherMode) => {
    if (!roomId) return;
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setMode",
        roomId,
        mode: newMode,
      }),
    });
    const data = await res.json();
    if (res.ok && data.room) {
      setRoom(data.room);
    }
  };

  // Leave Watch Together Room
  const handleLeaveRoom = async () => {
    const activeId = roomId;
    setRoomId(null);
    setRoom(null);
    setPlaybackSpeed(1);
    if (videoRef.current) videoRef.current.playbackRate = 1;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("room");
      window.history.replaceState({}, "", url.toString());
    }
    if (activeId) {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave",
          roomId: activeId,
          participant: { participantId: participantIdRef.current },
        }),
      }).catch(() => {});
    }
  };

  // Copy Share URL helper
  const handleCopyShareUrl = () => {
    if (!roomId || typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Compress & convert selected or pasted image to data URL
  const processChatImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
          setChatImagePreview(dataUrl);
        } else if (typeof reader.result === "string") {
          setChatImagePreview(reader.result);
        }
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Send Chat Message (in active room or local notes)
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatText.trim();
    const attachedImg = chatImagePreview;
    if (!trimmed && !attachedImg) return;
    setChatText("");
    setChatImagePreview(null);
    setShowEmojiPicker(false);

    if (roomId) {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          roomId,
          messageText: trimmed,
          imageUrl: attachedImg,
          participant: {
            participantId: participantIdRef.current,
            profileId: activeProfile.id,
            profileName: activeProfile.name,
            avatarColor: activeProfile.avatarColor,
            avatarIcon: activeProfile.avatarIcon,
            positionSeconds: currentTime,
            durationSeconds: duration || knownDuration,
            isPaused: !isPlaying,
            isBuffering,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } else {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          participantId: participantIdRef.current,
          profileId: activeProfile.id,
          profileName: activeProfile.name,
          avatarColor: activeProfile.avatarColor,
          avatarIcon: activeProfile.avatarIcon,
          text: trimmed,
          imageUrl: attachedImg,
          reactions: {},
          editedAt: null,
          videoTimestamp: currentTime,
          createdAt: Date.now(),
        },
      ]);
    }
  };

  // Toggle Emoji Reaction on a Message
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (roomId) {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reactChat",
          roomId,
          messageId,
          emoji,
          participant: {
            participantId: participantIdRef.current,
            profileId: activeProfile.id,
            profileName: activeProfile.name,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } else {
      setLocalMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const list = [...(reactions[emoji] || [])];
          const idx = list.findIndex((r) => r.profileId === activeProfile.id);
          if (idx !== -1) {
            list.splice(idx, 1);
            if (list.length === 0) delete reactions[emoji];
            else reactions[emoji] = list;
          } else {
            reactions[emoji] = [
              ...list,
              { profileId: activeProfile.id, profileName: activeProfile.name },
            ];
          }
          return { ...m, reactions };
        })
      );
    }
  };

  // Save Edited Message
  const handleSaveEditMessage = async (messageId: string) => {
    const trimmed = editingText.trim();
    if (roomId) {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "editChat",
          roomId,
          messageId,
          messageText: trimmed,
          participant: {
            participantId: participantIdRef.current,
            profileId: activeProfile.id,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } else {
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && (trimmed || m.imageUrl)
            ? { ...m, text: trimmed, editedAt: Date.now() }
            : m
        )
      );
    }
    setEditingMessageId(null);
    setEditingText("");
  };

  // Delete Own Message
  const handleDeleteMessage = async (messageId: string) => {
    if (roomId) {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteChat",
          roomId,
          messageId,
          participant: {
            participantId: participantIdRef.current,
            profileId: activeProfile.id,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } else {
      setLocalMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const displayedMessages = useMemo(
    () => (room ? room.messages || [] : localMessages),
    [room, localMessages]
  );

  // Auto-scroll chat sidebar on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [displayedMessages.length]);

  // Real-time Watch Together Room Heartbeat & Sync Loop (every 800ms)
  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    const syncTick = async () => {
      const v = videoRef.current;
      const pos = v
        ? isPipedStream
          ? streamOffset + v.currentTime
          : v.currentTime
        : currentTime;

      try {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "heartbeat",
            roomId,
            participant: {
              participantId: participantIdRef.current,
              profileId: activeProfile.id,
              profileName: activeProfile.name,
              avatarColor: activeProfile.avatarColor,
              avatarIcon: activeProfile.avatarIcon,
              positionSeconds: pos,
              durationSeconds: duration || knownDuration,
              isPaused: v ? v.paused : !isPlaying,
              isBuffering,
            },
          }),
        });

        if (!res.ok || cancelled) return;
        const data = await res.json();
        const updatedRoom: WatchRoom = data.room;
        if (!updatedRoom || cancelled) return;

        setRoom(updatedRoom);

        // Apply Mode 1 (ALL_PAUSE) synchronization
        if (updatedRoom.mode === "ALL_PAUSE") {
          // 1. Sync shared seek events
          if (updatedRoom.lastSeekSeq > lastAppliedSeekSeqRef.current) {
            lastAppliedSeekSeqRef.current = updatedRoom.lastSeekSeq;
            if (Math.abs(pos - updatedRoom.lastSeekTime) > 2.5) {
              seekTo(updatedRoom.lastSeekTime, false);
            }
          }

          // 2. Pause everyone if anyone paused or is buffering
          const shouldPause =
            !updatedRoom.isPlaying || Boolean(updatedRoom.bufferingProfileName);
          if (v) {
            if (v.playbackRate !== 1) {
              v.playbackRate = 1;
              setPlaybackSpeed(1);
            }
            if (shouldPause && !v.paused) {
              isRemoteSyncActionRef.current = true;
              v.pause();
              setIsPlaying(false);
            } else if (!shouldPause && v.paused) {
              isRemoteSyncActionRef.current = true;
              v.play().catch(() => {});
              setIsPlaying(true);
            }
          }
        } else if (updatedRoom.mode === "PACE_SYNC") {
          // Mode 2 (PACE_SYNC): Apply elastic catch-up playback speed (1.25x default, 1.4x catch-up, 1.0x leader slow-down)
          const me = updatedRoom.participants[participantIdRef.current];
          const targetSpeed = me?.playbackRate || 1.25;
          if (v && Math.abs(v.playbackRate - targetSpeed) > 0.01) {
            v.playbackRate = targetSpeed;
            setPlaybackSpeed(targetSpeed);
          }
        }
      } catch {
        // Ignore transient poll errors
      }
    };

    syncTick();
    const timer = setInterval(syncTick, 800);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    roomId,
    activeProfile,
    currentTime,
    duration,
    knownDuration,
    isPlaying,
    isBuffering,
    isPipedStream,
    streamOffset,
    seekTo,
  ]);

  // Switch quality mode while preserving exact playback timestamp
  const handleSelectQuality = useCallback(
    (newMode: StreamQualityMode) => {
      const targetEffective: EffectiveQuality =
        newMode === "auto" ? detectInitialAutoQuality() : newMode;
      const nextWillBePiped =
        isContainerPiped ||
        targetEffective !== "original" ||
        audioNormMode !== "off";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ownflix_quality_mode", newMode);
      }

      setBufferedEnd(0);
      if (nextWillBePiped) {
        setStreamOffset(Math.floor(currentTime));
      } else {
        setStreamOffset(0);
      }

      if (newMode === "auto") {
        setAutoEffectiveQuality(targetEffective);
      }
      setQualityMode(newMode);
      setActivePopover("none");
    },
    [currentTime, isContainerPiped, audioNormMode]
  );

  // Switch Smart Audio Normalization stream mode while preserving exact playback timestamp
  const handleSelectAudioNorm = useCallback(
    (newNorm: AudioNormMode) => {
      const nextWillBePiped =
        isContainerPiped ||
        effectiveQuality !== "original" ||
        newNorm !== "off";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ownflix_audio_norm_mode", newNorm);
      }

      setBufferedEnd(0);
      if (nextWillBePiped) {
        setStreamOffset(Math.floor(currentTime));
      } else {
        setStreamOffset(0);
      }

      setAudioNormMode(newNorm);
      setActivePopover("none");
    },
    [currentTime, isContainerPiped, effectiveQuality]
  );

  // Debounced buffering indicator without restarting the video stream
  const clearBufferingState = useCallback(() => {
    if (bufferingTimerRef.current) {
      clearTimeout(bufferingTimerRef.current);
      bufferingTimerRef.current = null;
    }
    setIsBuffering(false);
  }, []);

  const handleVideoWaiting = useCallback(() => {
    if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
    bufferingTimerRef.current = setTimeout(() => {
      setIsBuffering(true);
    }, 280);
  }, []);

  // Intro & Credits timestamps
  const introStart = currentEpisode
    ? currentEpisode.introStart ?? 2
    : item.introStart ?? 5;
  const introEnd = currentEpisode
    ? currentEpisode.introEnd ?? 15
    : item.introEnd ?? 40;
  const creditsStart = currentEpisode
    ? currentEpisode.creditsStart ?? Math.max(duration - 8, 10)
    : item.creditsStart ?? Math.max(duration - 35, 30);

  // Next episode in series
  const nextEpisode = useMemo(() => {
    if (item.type !== "SERIES" || !currentEpisode) return undefined;
    const idx = item.episodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx !== -1 && idx + 1 < item.episodes.length) {
      return item.episodes[idx + 1];
    }
    return undefined;
  }, [item, currentEpisode]);

  // Load WebVTT captions
  useEffect(() => {
    if (selectedSubtitle === "Off") {
      setCues([]);
      return;
    }
    const subIdx = Math.max(0, subtitleOptions.indexOf(selectedSubtitle) - 1);
    const controller = new AbortController();
    fetch(
      `/api/subtitles?mediaId=${item.id}${
        currentEpisode ? `&episodeId=${currentEpisode.id}` : ""
      }&trackIndex=${subIdx}&lang=${encodeURIComponent(
        selectedSubtitle
      )}&title=${encodeURIComponent(item.title)}`,
      { signal: controller.signal }
    )
      .then((r) => r.text())
      .then((text) => {
        setCues(parseVtt(text));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [
    item.id,
    item.title,
    currentEpisode,
    selectedSubtitle,
    subtitleOptions,
  ]);

  // Save watch progress helper
  const saveProgress = useCallback(
    async (pos: number, dur: number, completed = false) => {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId: activeProfile.id,
            mediaItemId: item.id,
            episodeId: currentEpisode?.id || null,
            positionSeconds: pos,
            durationSeconds: dur || duration || knownDuration,
            completed,
          }),
        });
      } catch {
        // Ignore
      }
    },
    [activeProfile.id, item.id, currentEpisode?.id, duration, knownDuration]
  );

  const seekBy = useCallback(
    (delta: number) => {
      seekTo(currentTime + delta);
    },
    [currentTime, seekTo]
  );

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;

    if (
      !isPipedStream &&
      v.duration &&
      isFinite(v.duration) &&
      v.duration >= Math.max(5, knownDuration * 0.5)
    ) {
      setDuration(v.duration);
    } else {
      setDuration(knownDuration);
    }

    const initialRate =
      room?.mode === "PACE_SYNC"
        ? room.participants[participantIdRef.current]?.playbackRate || 1.25
        : playbackSpeed;
    v.playbackRate = initialRate;
    setPlaybackSpeed(initialRate);
    v.volume = volume;
    v.muted = isMuted;

    if (!isPipedStream && currentTime > 2 && v.currentTime < 1) {
      v.currentTime = currentTime;
    }

    v.play().catch(() => setIsPlaying(false));
  };

  // Periodic progress save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (v && !v.paused) {
        const realTime = isPipedStream
          ? streamOffset + v.currentTime
          : v.currentTime;
        if (realTime > 1) {
          saveProgress(realTime, duration || knownDuration);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [saveProgress, duration, knownDuration, isPipedStream, streamOffset]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (activePopover === "none" && !isScrubbing) {
        setShowControls(false);
      }
    }, 3200);
  }, [activePopover, isScrubbing]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [revealControls]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const realTime = isPipedStream
      ? streamOffset + v.currentTime
      : v.currentTime;

    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
      if (roomId && room?.mode === "ALL_PAUSE") {
        fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "play",
            roomId,
            participant: {
              participantId: participantIdRef.current,
              profileId: activeProfile.id,
              profileName: activeProfile.name,
              avatarColor: activeProfile.avatarColor,
              avatarIcon: activeProfile.avatarIcon,
              positionSeconds: realTime,
              durationSeconds: duration || knownDuration,
              isPaused: false,
              isBuffering: false,
            },
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.room) setRoom(d.room);
          })
          .catch(() => {});
      }
    } else {
      v.pause();
      setIsPlaying(false);
      saveProgress(realTime, duration || knownDuration);
      if (roomId && room?.mode === "ALL_PAUSE") {
        fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "pause",
            roomId,
            participant: {
              participantId: participantIdRef.current,
              profileId: activeProfile.id,
              profileName: activeProfile.name,
              avatarColor: activeProfile.avatarColor,
              avatarIcon: activeProfile.avatarIcon,
              positionSeconds: realTime,
              durationSeconds: duration || knownDuration,
              isPaused: true,
              isBuffering,
            },
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.room) {
              lastAppliedSeekSeqRef.current = d.room.lastSeekSeq;
              setRoom(d.room);
            }
          })
          .catch(() => {});
      }
    }
  }, [
    saveProgress,
    duration,
    knownDuration,
    isPipedStream,
    streamOffset,
    roomId,
    room?.mode,
    activeProfile,
    isBuffering,
  ]);

  const handleSkipIntro = useCallback(() => {
    seekTo(introEnd);
  }, [introEnd, seekTo]);

  const handlePlayEpisode = useCallback((ep: Episode) => {
    setCreditsDismissed(false);
    setNextCountdown(null);
    setStreamOffset(0);
    setBufferedEnd(0);
    setCurrentEpisode(ep);
    setCurrentTime(0);
    setDuration(ep.duration || 600);
    setActivePopover("none");
  }, []);

  // Mouse drag scrubbing support
  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrubBarRef.current) return;
      const rect = scrubBarRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const target = ratio * (duration || knownDuration);
      setScrubPreviewTime(target);
      setHoverTime(target);
      setHoverPercent(ratio * 100);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (scrubBarRef.current) {
        const rect = scrubBarRef.current.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width)
        );
        const target = ratio * (duration || knownDuration);
        seekTo(target);
      }
      setIsScrubbing(false);
      setScrubPreviewTime(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, duration, knownDuration, seekTo]);

  // Next Episode Countdown trigger
  const inCreditsWindow =
    Boolean(nextEpisode) &&
    !creditsDismissed &&
    duration > 10 &&
    currentTime >= creditsStart;

  useEffect(() => {
    if (!inCreditsWindow || !nextEpisode) {
      setNextCountdown(null);
      return;
    }
    setNextCountdown(5);
    const timer = setInterval(() => {
      setNextCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          handlePlayEpisode(nextEpisode);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [inCreditsWindow, nextEpisode, handlePlayEpisode]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        if (activePopover !== "none") {
          setActivePopover("none");
        } else {
          saveProgress(currentTime, duration || knownDuration);
          onProgressUpdated();
          onClose();
        }
      } else if (e.key === " " || e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        seekBy(-10);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "l") {
        e.preventDefault();
        seekBy(10);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
        }
      } else if (e.key.toLowerCase() === "s") {
        handleSkipIntro();
      }
      revealControls();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activePopover,
    currentTime,
    duration,
    knownDuration,
    handleSkipIntro,
    isMuted,
    onClose,
    onProgressUpdated,
    revealControls,
    saveProgress,
    seekBy,
    toggleFullscreen,
    togglePlay,
  ]);

  const handleExit = async () => {
    if (roomId) {
      await handleLeaveRoom();
    }
    if (currentTime > 1) {
      await saveProgress(currentTime, duration || knownDuration);
    }
    onProgressUpdated();
    onClose();
  };

  // Active subtitle cue
  const activeCue = useMemo(() => {
    if (selectedSubtitle === "Off" || cues.length === 0) return null;
    const lookupTime =
      cues.length > 10 || isLocalFile ? currentTime : currentTime % 65;
    return (
      cues.find((c) => lookupTime >= c.start && lookupTime <= c.end) || null
    );
  }, [cues, currentTime, selectedSubtitle, isLocalFile]);

  const showSkipIntroButton =
    currentTime >= introStart && currentTime <= introEnd;

  const displayedTime =
    isScrubbing && scrubPreviewTime !== null ? scrubPreviewTime : currentTime;

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (displayedTime / duration) * 100))
      : 0;

  const totalBufferedSec = isPipedStream
    ? streamOffset + bufferedEnd
    : bufferedEnd;
  const bufferedPercent =
    duration > 0
      ? Math.min(
          100,
          Math.max(progressPercent, (totalBufferedSec / duration) * 100)
        )
      : 0;

  const qualityBadgeLabel =
    qualityMode === "auto"
      ? `Auto (${
          effectiveQuality === "original"
            ? isContainerPiped
              ? "1080p"
              : "Direct"
            : effectiveQuality
        })`
      : effectiveQuality === "original"
      ? isContainerPiped
        ? "1080p Transcode"
        : "Direct Play"
      : `${effectiveQuality} Transcode`;

  const roomParticipants = useMemo(() => {
    if (!room) return [];
    return Object.values(room.participants).sort((a, b) => a.rank - b.rank);
  }, [room]);

  return (
    <div
      ref={containerRef}
      onMouseMove={revealControls}
      className="fixed inset-0 z-50 bg-black flex overflow-hidden select-none"
    >
      {/* Left / Main Video Area */}
      <div className="relative flex-1 h-full flex flex-col justify-between overflow-hidden bg-black">
        {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        key={`${streamUrl}-${currentEpisode?.id || "movie"}`}
        src={streamUrl}
        onClick={() => {
          if (activePopover !== "none") {
            setActivePopover("none");
          } else {
            togglePlay();
          }
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleVideoWaiting}
        onPlaying={clearBufferingState}
        onCanPlay={clearBufferingState}
        onCanPlayThrough={clearBufferingState}
        onTimeUpdate={(e) => {
          if (isBuffering) clearBufferingState();
          if (isScrubbing) return;
          const v = e.currentTarget;
          const actual = isPipedStream
            ? streamOffset + v.currentTime
            : v.currentTime;
          setCurrentTime(actual);
          if (v.buffered.length > 0) {
            setBufferedEnd(v.buffered.end(v.buffered.length - 1));
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          clearBufferingState();
          if (isRemoteSyncActionRef.current) {
            isRemoteSyncActionRef.current = false;
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          if (isRemoteSyncActionRef.current) {
            isRemoteSyncActionRef.current = false;
          }
        }}
        onEnded={() => {
          if (isPipedStream && currentTime < duration - 15) {
            return;
          }
          saveProgress(duration, duration, true);
          if (nextEpisode) {
            handlePlayEpisode(nextEpisode);
          } else {
            setIsPlaying(false);
          }
        }}
        className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
        playsInline
        autoPlay
      />

      {/* Top Bar Overlay */}
      <div
        className={`relative z-20 flex items-center justify-between px-6 md:px-10 py-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={handleExit}
          className="flex items-center gap-3 text-white hover:text-zinc-300 transition-colors group"
        >
          <ArrowLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
          <div className="text-left">
            <div className="text-lg md:text-xl font-bold leading-tight">
              {item.title}
            </div>
            {currentEpisode && (
              <div className="text-xs md:text-sm text-zinc-300">
                Season {currentEpisode.seasonNumber} • Episode{" "}
                {currentEpisode.episodeNumber}: &ldquo;{currentEpisode.title}
                &rdquo;
              </div>
            )}
          </div>
        </button>

        {/* Right Top: Watch Together Button & Stream Quality Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Current Playback Speed Badge */}
          <button
            onClick={() =>
              setActivePopover((p) => (p === "speed" ? "none" : "speed"))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border bg-black/60 border-zinc-600 text-zinc-100 hover:border-white transition-colors"
            title="Current Playback Speed"
          >
            <Gauge className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Speed: {playbackSpeed}x</span>
          </button>

          <button
            onClick={() =>
              setActivePopover((p) => (p === "quality" ? "none" : "quality"))
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
              effectiveQuality !== "original"
                ? "bg-[#2563EB] border-[#2563EB] text-white"
                : "bg-black/60 border-zinc-600 text-zinc-200 hover:border-white"
            }`}
            title="Change Transcoding Quality for Slower Connections"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quality:</span>
            <span>{qualityBadgeLabel}</span>
          </button>

          {!showSkipIntroButton && currentTime < introEnd && (
            <button
              onClick={handleSkipIntro}
              className="hidden md:flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 text-xs text-zinc-200 px-3 py-1.5 rounded transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Jump Intro</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact Modern Buffering Pill & Watch Together Status */}
      {isBuffering && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#141414] border border-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
            <div className="relative w-3.5 h-3.5 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-[#3B82F6]/25" />
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#3B82F6] animate-spin" />
            </div>
            <span className="text-[11px] font-semibold tracking-wide text-zinc-200">
              Buffering...
            </span>
          </div>
        </div>
      )}

      {/* Watch Together All-Pause Status Banner */}
      {room &&
        room.mode === "ALL_PAUSE" &&
        (!room.isPlaying || room.bufferingProfileName) && (
          <div className="relative z-20 mx-auto px-4 pointer-events-none">
            <div className="bg-[#141414] border border-zinc-700 text-zinc-200 text-xs font-medium px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              {room.bufferingProfileName ? (
                <span className="w-3 h-3 rounded-full border-2 border-zinc-500 border-t-[#3B82F6] animate-spin" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-[#3B82F6] fill-[#3B82F6]" />
              )}
              <span>
                {room.bufferingProfileName
                  ? `Waiting for ${room.bufferingProfileName}...`
                  : `Paused by ${room.pausedByProfileName || "viewer"}`}
              </span>
            </div>
          </div>
        )}

      {/* Auto-Adaptive Slow Connection Toast */}
      {adaptiveBanner && (
        <div className="relative z-30 mx-auto bg-black/85 border border-amber-500/60 text-amber-200 text-xs sm:text-sm px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
          <Wifi className="w-4 h-4 text-amber-400" />
          <span>{adaptiveBanner}</span>
        </div>
      )}

      {/* Active Subtitle Overlay */}
      {activeCue && (
        <div className="relative z-10 mt-auto mb-32 px-6 text-center pointer-events-none">
          <span className="inline-block bg-black/75 text-white text-base sm:text-xl md:text-2xl font-medium px-4 py-1.5 rounded shadow-lg whitespace-pre-line leading-snug">
            {activeCue.text}
          </span>
        </div>
      )}

      {/* Floating Netflix "Skip Intro" Button */}
      {showSkipIntroButton && (
        <div className="absolute right-8 md:right-12 bottom-36 z-30">
          <button
            onClick={handleSkipIntro}
            className="bg-white/95 hover:bg-white text-black font-bold text-sm md:text-base px-6 py-2.5 rounded shadow-2xl border-2 border-white flex items-center gap-2 transition-transform hover:scale-105"
          >
            <span>Skip Intro</span>
            <SkipForward className="w-4 h-4 fill-black" />
          </button>
        </div>
      )}

      {/* Floating Netflix "Next Episode" Countdown Overlay */}
      {inCreditsWindow && nextEpisode && (
        <div className="absolute right-8 md:right-12 bottom-36 z-30 bg-[#181818] border border-zinc-700 rounded-lg p-4 shadow-2xl w-80 md:w-96">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1">
            Up Next in {nextCountdown ?? 5}s
          </div>
          <div className="text-sm font-bold text-white truncate mb-3">
            S{nextEpisode.seasonNumber}:E{nextEpisode.episodeNumber} &ldquo;
            {nextEpisode.title}&rdquo;
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCreditsDismissed(true)}
              className="flex-1 py-2 text-xs font-semibold border border-zinc-600 hover:border-white text-zinc-200 rounded transition-colors"
            >
              Watch Credits
            </button>
            <button
              onClick={() => handlePlayEpisode(nextEpisode)}
              className="flex-1 py-2 text-xs font-bold bg-white hover:bg-zinc-200 text-black rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Next Episode</span>
            </button>
          </div>
        </div>
      )}

      {/* Watch Together Room Popover */}
      {activePopover === "room" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 md:right-12 bottom-28 z-40 bg-[#181818] border border-zinc-700 rounded-xl p-5 shadow-2xl w-[350px] sm:w-[430px]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-base text-white">
                Watch Together Room
              </h3>
            </div>
            <button
              onClick={() => setActivePopover("none")}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!room ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Start a Watch Together room and share the invite URL with
                friends. Choose between synchronized pause mode or elastic
                Pace Sync catch-up mode!
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleCreateRoom("PACE_SYNC")}
                  disabled={creatingRoom}
                  className="w-full p-3 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-left transition-colors"
                >
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Flame className="w-4 h-4 fill-white" />
                    <span>Start Pace Sync Room (1.25x / 1.4x / 1.0x)</span>
                  </div>
                  <p className="text-xs text-white/85 mt-0.5">
                    Default 1.25x • Slow users boost to 1.4x • Fastest slows to
                    1.0x
                  </p>
                </button>

                <button
                  onClick={() => handleCreateRoom("ALL_PAUSE")}
                  disabled={creatingRoom}
                  className="w-full p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-left transition-colors"
                >
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Pause className="w-4 h-4" />
                    <span>Start All-Pause Sync Room</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Everyone pauses automatically when any viewer pauses or
                    buffers
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Share URL Box */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Share Invite URL</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Room #{room.id.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/?room=${room.id}`
                        : `/?room=${room.id}`
                    }
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-none"
                  />
                  <button
                    onClick={handleCopyShareUrl}
                    className="bg-white hover:bg-zinc-200 text-black font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mode Switcher */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Watch Together Mode
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSetRoomMode("ALL_PAUSE")}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      room.mode === "ALL_PAUSE"
                        ? "bg-zinc-800 border-[#2563EB] text-white"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Pause className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>All-Pause Sync</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                      All pause when one pauses or buffers
                    </p>
                  </button>

                  <button
                    onClick={() => handleSetRoomMode("PACE_SYNC")}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      room.mode === "PACE_SYNC"
                        ? "bg-zinc-800 border-[#2563EB] text-white"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pace Sync (Catch-Up)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                      1.25x default • 1.4x catch-up • 1.0x leader
                    </p>
                  </button>
                </div>
              </div>

              {/* Active Viewers in Room */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  <span>Active Viewers ({roomParticipants.length})</span>
                  {room.mode === "PACE_SYNC" && (
                    <button
                      onClick={() => seekBy(-15)}
                      className="text-[11px] text-amber-400 hover:underline font-normal normal-case"
                      title="Jump back 15s to test 1.4x catch-up boost"
                    >
                      Test -15s Lag Boost
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {roomParticipants.map((p) => {
                    const isMe = p.participantId === participantIdRef.current;
                    return (
                      <div
                        key={p.participantId}
                        className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-black text-amber-400 w-6">
                            {formatOrdinal(p.rank)}
                          </span>
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                            style={{
                              background: `linear-gradient(145deg, ${p.avatarColor}, #111111 150%)`,
                            }}
                          >
                            {renderProfileIcon(
                              p.avatarIcon,
                              "w-3.5 h-3.5 text-white"
                            )}
                          </div>
                          <span className="font-bold text-white truncate">
                            {p.profileName}
                            {isMe ? " (You)" : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-zinc-400">
                            {formatTime(p.positionSeconds)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              p.isBuffering
                                ? "bg-amber-950 text-amber-300"
                                : p.isPaused
                                ? "bg-zinc-800 text-zinc-400"
                                : p.playbackRate > 1.3
                                ? "bg-red-950 text-red-300 border border-red-700/50"
                                : p.playbackRate < 1.1 &&
                                  room.mode === "PACE_SYNC"
                                ? "bg-sky-950 text-sky-300 border border-sky-700/50"
                                : "bg-emerald-950 text-emerald-300"
                            }`}
                          >
                            {p.isBuffering
                              ? "BUFFER"
                              : p.isPaused
                              ? "PAUSED"
                              : `${p.playbackRate}x`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={handleLeaveRoom}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5"
                >
                  Leave Watch Room
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other Popovers (Quality/Bandwidth, Audio/Subtitles, Playback Speed, Episodes List) */}
      {activePopover === "quality" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 md:right-12 bottom-28 z-40 bg-[#181818] border border-zinc-700 rounded-lg p-4 shadow-2xl w-80 sm:w-96"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Video Quality & Data Saver
            </h4>
            <span className="text-[11px] text-emerald-400 font-semibold">
              FFmpeg Real-Time Transcoder
            </span>
          </div>

          <div className="space-y-1.5">
            {QUALITY_OPTIONS.map((opt) => {
              const selected = qualityMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectQuality(opt.id)}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start justify-between gap-3 transition-colors ${
                    selected
                      ? "bg-zinc-800 border border-zinc-600 text-white"
                      : "hover:bg-zinc-800/60 text-zinc-300 border border-transparent"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{opt.label}</span>
                      <span className="text-[11px] bg-zinc-900 border border-zinc-700 text-zinc-300 px-1.5 py-0.2 rounded">
                        {opt.bitrate}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {selected && (
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activePopover === "audioNorm" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 md:right-12 bottom-28 z-40 bg-[#181818] border border-zinc-700 rounded-lg p-4 shadow-2xl w-80 sm:w-96"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Smart Audio Normalization
            </h4>
            <span className="text-[11px] text-emerald-400 font-semibold">
              FFmpeg dynaudnorm + Voice EQ
            </span>
          </div>

          <div className="space-y-1.5">
            {AUDIO_NORM_OPTIONS.map((opt) => {
              const selected = audioNormMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectAudioNorm(opt.id)}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start justify-between gap-3 transition-colors ${
                    selected
                      ? "bg-zinc-800 border border-zinc-600 text-white"
                      : "hover:bg-zinc-800/60 text-zinc-300 border border-transparent"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{opt.label}</span>
                      <span className="text-[11px] bg-zinc-900 border border-zinc-700 text-zinc-300 px-1.5 py-0.2 rounded">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {selected && (
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activePopover === "audioSub" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 md:right-12 bottom-28 z-40 bg-[#181818] border border-zinc-700 rounded-lg p-5 shadow-2xl w-[340px] sm:w-[440px] grid grid-cols-2 gap-6"
        >
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Audio
            </h4>
            <div className="space-y-1.5">
              {audioOptions.map((aud) => (
                <button
                  key={aud}
                  onClick={() => setSelectedAudio(aud)}
                  className={`w-full text-left text-xs sm:text-sm py-1.5 px-2 rounded flex items-center gap-2 ${
                    selectedAudio === aud
                      ? "text-white font-bold bg-zinc-800"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Check
                    className={`w-4 h-4 shrink-0 ${
                      selectedAudio === aud ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span className="truncate">{aud}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Subtitles
            </h4>
            <div className="space-y-1.5">
              {subtitleOptions.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubtitle(sub)}
                  className={`w-full text-left text-xs sm:text-sm py-1.5 px-2 rounded flex items-center gap-2 ${
                    selectedSubtitle === sub
                      ? "text-white font-bold bg-zinc-800"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Check
                    className={`w-4 h-4 shrink-0 ${
                      selectedSubtitle === sub ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span className="truncate">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activePopover === "speed" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 md:right-12 bottom-28 z-40 bg-[#181818] border border-zinc-700 rounded-lg p-4 shadow-2xl w-56"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Playback Speed
          </h4>
          <div className="space-y-1">
            {[0.5, 0.75, 1, 1.25, 1.4, 1.5, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  setPlaybackSpeed(spd);
                  if (videoRef.current) videoRef.current.playbackRate = spd;
                  setActivePopover("none");
                }}
                className={`w-full text-left text-sm py-1.5 px-2.5 rounded flex items-center justify-between ${
                  Math.abs(playbackSpeed - spd) < 0.02
                    ? "text-white font-bold bg-zinc-800"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>{spd === 1 ? "1x (Normal)" : `${spd}x`}</span>
                {Math.abs(playbackSpeed - spd) < 0.02 && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {activePopover === "episodes" && item.type === "SERIES" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 md:right-12 bottom-28 z-40 bg-[#181818] border border-zinc-700 rounded-lg p-4 shadow-2xl w-80 sm:w-96 max-h-[380px] overflow-y-auto"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            {item.title} • Episodes
          </h4>
          <div className="space-y-2">
            {item.episodes.map((ep) => {
              const active = currentEpisode?.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep)}
                  className={`w-full text-left p-2.5 rounded flex items-center gap-3 transition-colors ${
                    active
                      ? "bg-zinc-800 border border-zinc-600"
                      : "hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="w-7 text-center font-bold text-sm text-zinc-400">
                    {ep.episodeNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {ep.title}
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-1">
                      {ep.overview}
                    </div>
                  </div>
                  {active && (
                    <span className="text-[10px] font-bold bg-[#2563EB] text-white px-1.5 py-0.5 rounded">
                      NOW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`relative z-20 px-6 md:px-10 pb-6 pt-12 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Netflix Red Timeline Scrubber */}
        <div className="flex items-center gap-4 mb-4">
          <div
            ref={scrubBarRef}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(
                0,
                Math.min(1, (e.clientX - rect.left) / rect.width)
              );
              setHoverPercent(ratio * 100);
              setHoverTime(ratio * (duration || knownDuration));
            }}
            onMouseLeave={() => {
              if (!isScrubbing) setHoverTime(null);
            }}
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(
                0,
                Math.min(1, (e.clientX - rect.left) / rect.width)
              );
              const target = ratio * (duration || knownDuration);
              setIsScrubbing(true);
              setScrubPreviewTime(target);
              setHoverPercent(ratio * 100);
              setHoverTime(target);
            }}
            className="group/scrub relative flex-1 py-2 cursor-pointer"
          >
            {/* Hover Time Preview Tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-8 -translate-x-1/2 bg-black/90 border border-zinc-700 text-white text-xs font-mono font-semibold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap"
                style={{
                  left: `${Math.max(3, Math.min(97, hoverPercent))}%`,
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}

            {/* Track Background */}
            <div className="relative w-full h-1.5 group-hover/scrub:h-2.5 bg-zinc-700/80 rounded-full transition-all overflow-visible">
              <div
                className="absolute inset-y-0 left-0 bg-zinc-500/60 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-[#2563EB] rounded-full"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Other Room Players' Short Tick Lines on Seek Bar */}
              {room &&
                roomParticipants
                  .filter((p) => p.participantId !== participantIdRef.current)
                  .map((p) => {
                    const dur = duration || knownDuration || 600;
                    const pct = Math.min(
                      100,
                      Math.max(0, (p.positionSeconds / dur) * 100)
                    );
                    return (
                      <div
                        key={p.participantId}
                        className="group/tick absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-1.5 py-2 z-20 cursor-pointer"
                        style={{ left: `${pct}%` }}
                      >
                        {/* Short Vertical Tick Line */}
                        <div
                          className="w-0.5 h-3.5 group-hover/tick:h-4 group-hover/tick:w-1 rounded-full shadow transition-all"
                          style={{
                            backgroundColor: p.avatarColor || "#ffffff",
                          }}
                        />
                        {/* Hover Username & Speed Tooltip */}
                        <div className="opacity-0 group-hover/tick:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded bg-black/95 border border-zinc-700 text-xs font-semibold text-white whitespace-nowrap pointer-events-none shadow-lg z-30 flex items-center gap-1.5">
                          <span>{p.profileName}</span>
                          <span className="text-emerald-400 font-mono">
                            {p.playbackRate}x
                          </span>
                        </div>
                      </div>
                    );
                  })}

              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#2563EB] shadow-lg transition-transform ${
                  isScrubbing
                    ? "scale-125"
                    : "scale-0 group-hover/scrub:scale-100"
                }`}
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          <span className="text-xs sm:text-sm font-mono text-zinc-200 min-w-[110px] sm:min-w-[130px] text-right shrink-0">
            {formatTime(displayedTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={togglePlay}
              className="text-white hover:text-zinc-300 transition-transform hover:scale-110"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-white" />
              ) : (
                <Play className="w-7 h-7 fill-white" />
              )}
            </button>

            <button
              onClick={() => seekBy(-10)}
              className="text-white hover:text-zinc-300 transition-transform hover:scale-110"
              title="Rewind 10s (Left Arrow)"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            <button
              onClick={() => seekBy(10)}
              className="text-white hover:text-zinc-300 transition-transform hover:scale-110"
              title="Forward 10s (Right Arrow)"
            >
              <RotateCw className="w-6 h-6" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }}
                className="text-white hover:text-zinc-300"
                title="Mute (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  if (videoRef.current) {
                    videoRef.current.volume = val;
                    videoRef.current.muted = val === 0;
                  }
                }}
                className="hidden sm:block w-20 accent-[#2563EB] cursor-pointer"
              />
            </div>

            {/* Center Title Label */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-zinc-200 pl-2">
              <span className="font-bold">{item.title}</span>
              {currentEpisode && (
                <span className="text-zinc-400">
                  S{currentEpisode.seasonNumber}:E
                  {currentEpisode.episodeNumber} {currentEpisode.title}
                </span>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4 md:gap-5">
            {nextEpisode && (
              <button
                onClick={() => handlePlayEpisode(nextEpisode)}
                className="text-white hover:text-zinc-300 flex items-center gap-1.5 text-xs font-semibold"
                title={`Next Episode: ${nextEpisode.title}`}
              >
                <SkipForward className="w-6 h-6" />
                <span className="hidden md:inline">Next Ep</span>
              </button>
            )}

            {item.type === "SERIES" && item.episodes.length > 0 && (
              <button
                onClick={() =>
                  setActivePopover((p) =>
                    p === "episodes" ? "none" : "episodes"
                  )
                }
                className={`hover:text-white transition-colors ${
                  activePopover === "episodes"
                    ? "text-[#2563EB]"
                    : "text-white"
                }`}
                title="Episodes"
              >
                <Layers className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={() =>
                setActivePopover((p) => (p === "room" ? "none" : "room"))
              }
              className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                activePopover === "room" || room
                  ? "text-emerald-400"
                  : "text-white"
              }`}
              title="Watch Together Room"
            >
              <Users className="w-6 h-6" />
              {room && (
                <span className="text-xs font-bold">
                  #{room.id.toUpperCase()} ({roomParticipants.length})
                </span>
              )}
            </button>

            <button
              onClick={() =>
                setActivePopover((p) =>
                  p === "audioNorm" ? "none" : "audioNorm"
                )
              }
              className={`hover:text-white transition-colors flex items-center gap-1 ${
                activePopover === "audioNorm" || audioNormMode !== "off"
                  ? "text-[#2563EB]"
                  : "text-white"
              }`}
              title="Smart Audio Normalization & Dialogue Boost"
            >
              <AudioLines className="w-6 h-6" />
              {audioNormMode !== "off" && (
                <span className="text-xs font-bold">
                  {audioNormMode === "voice_boost"
                    ? "Voice"
                    : audioNormMode === "night_mode"
                    ? "Night"
                    : "Norm"}
                </span>
              )}
            </button>

            <button
              onClick={() =>
                setActivePopover((p) =>
                  p === "audioSub" ? "none" : "audioSub"
                )
              }
              className={`hover:text-white transition-colors ${
                activePopover === "audioSub" ? "text-[#2563EB]" : "text-white"
              }`}
              title="Audio & Subtitles"
            >
              <Subtitles className="w-6 h-6" />
            </button>

            <button
              onClick={() =>
                setActivePopover((p) =>
                  p === "quality" ? "none" : "quality"
                )
              }
              className={`hover:text-white transition-colors flex items-center gap-1 ${
                activePopover === "quality" ? "text-[#2563EB]" : "text-white"
              }`}
              title="Video Quality & Data Saver"
            >
              <SlidersHorizontal className="w-6 h-6" />
              {effectiveQuality !== "original" && (
                <span className="text-xs font-bold">{effectiveQuality}</span>
              )}
            </button>

            <button
              onClick={() =>
                setActivePopover((p) => (p === "speed" ? "none" : "speed"))
              }
              className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                activePopover === "speed" ? "text-[#2563EB]" : "text-white"
              }`}
              title="Playback Speed"
            >
              <Gauge className="w-6 h-6" />
              <span className="text-xs sm:text-sm font-bold font-mono">
                {playbackSpeed}x
              </span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-zinc-300"
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Docked Right Chat Sidebar — Only visible in Watch Together Mode */}
      {room && (
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-88 md:w-96 lg:w-[420px] h-full bg-[#121212] border-l border-zinc-800 flex flex-col shrink-0 z-30 select-text"
      >
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-zinc-800 bg-[#161616] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <MessageSquare className="w-5 h-5 text-[#2563EB] shrink-0" />
            <span className="font-bold text-base text-white truncate">
              {room ? `Room #${room.id.toUpperCase()} Chat` : "Live Stream Chat"}
            </span>
          </div>

          {room ? (
            <button
              onClick={handleCopyShareUrl}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-semibold text-emerald-400 px-3 py-1.5 rounded transition-colors shrink-0"
              title="Copy Watch Together Invite Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Invite</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleCreateRoom("PACE_SYNC")}
              disabled={creatingRoom}
              className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-bold px-3 py-1.5 rounded transition-colors shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>Start Room</span>
            </button>
          )}
        </div>

        {/* Active Room Mode, Compact Avatar Minimap & Participants Strip */}
        {room && (
          <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">
                Mode:{" "}
                <strong className="text-white">
                  {room.mode === "PACE_SYNC"
                    ? "Pace Sync (1.25x)"
                    : "All-Pause Sync"}
                </strong>
              </span>
              <button
                onClick={() =>
                  handleSetRoomMode(
                    room.mode === "PACE_SYNC" ? "ALL_PAUSE" : "PACE_SYNC"
                  )
                }
                className="text-[#2563EB] hover:underline font-semibold"
              >
                Switch Mode
              </button>
            </div>

            {/* Compact Avatar Minimap Track inside Chat Sidebar */}
            <div className="relative h-6 bg-zinc-950 border border-zinc-800 rounded-full flex items-center px-2.5 overflow-visible">
              {/* Dashed center track line */}
              <div className="w-full border-t border-dashed border-zinc-700/70" />

              {/* Participant Avatars along the mini track */}
              {roomParticipants.map((p) => {
                const dur = duration || knownDuration || 600;
                const pct = Math.min(
                  96,
                  Math.max(4, (p.positionSeconds / dur) * 100)
                );
                const isMe = p.participantId === participantIdRef.current;

                return (
                  <div
                    key={`chat-minimap-${p.participantId}`}
                    className="group/mini absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 flex items-center justify-center cursor-pointer"
                    style={{
                      left: `${pct}%`,
                      zIndex: isMe ? 30 : 20 - p.rank,
                    }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-transform group-hover/mini:scale-125 ${
                        isMe
                          ? "ring-2 ring-white scale-110"
                          : "ring-1 ring-zinc-400"
                      }`}
                      style={{
                        background: `linear-gradient(145deg, ${p.avatarColor}, #111111 150%)`,
                      }}
                    >
                      {renderProfileIcon(p.avatarIcon, "w-3 h-3 text-white")}
                    </div>

                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover/mini:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-black/95 border border-zinc-700 text-[11px] font-semibold text-white whitespace-nowrap pointer-events-none shadow-lg z-40">
                      {p.profileName} • {formatTime(p.positionSeconds)} (
                      {p.playbackRate}x)
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {roomParticipants.map((p) => (
                <div
                  key={p.participantId}
                  className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-full pl-1.5 pr-2.5 py-1 text-xs shrink-0"
                  title={`${p.profileName} @ ${formatTime(p.positionSeconds)} (${p.playbackRate}x)`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(145deg, ${p.avatarColor}, #111111 150%)`,
                    }}
                  >
                    {renderProfileIcon(p.avatarIcon, "w-3 h-3 text-white")}
                  </div>
                  <span className="text-zinc-200 font-medium max-w-[85px] truncate">
                    {p.profileName}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    {p.playbackRate}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 text-zinc-500">
              <MessageSquare className="w-10 h-10 mb-2.5 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400 mb-1">
                No messages yet
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {room
                  ? "Send emojis, react to messages, or share pictures with everyone watching!"
                  : "Send a message, emoji, or picture, or click 'Start Room' above to invite friends."}
              </p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isOwn =
                msg.participantId === participantIdRef.current ||
                msg.profileId === activeProfile.id;
              const isEditing = editingMessageId === msg.id;
              const reactionEntries = Object.entries(msg.reactions || {}).filter(
                ([, list]) => list && list.length > 0
              );

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isOwn ? "items-end" : "items-start"
                  } text-sm`}
                >
                  <div
                    className={`flex items-end gap-2.5 max-w-[90%] ${
                      isOwn ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Profile Avatar (shown on left for other users, right for own) */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 shadow"
                      style={{
                        background: `linear-gradient(145deg, ${msg.avatarColor}, #111111 150%)`,
                      }}
                    >
                      {renderProfileIcon(msg.avatarIcon, "w-4 h-4 text-white")}
                    </div>

                    {/* Teams Chat Bubble */}
                    <div
                      className={`group/msg relative rounded-2xl px-4 py-3 shadow-md transition-colors border ${
                        isOwn
                          ? "bg-[#2b2d42] hover:bg-[#32354d] border-indigo-500/30 rounded-br-sm text-white"
                          : "bg-[#1f1f23] hover:bg-[#26262b] border-zinc-800 rounded-bl-sm text-zinc-100"
                      }`}
                    >
                      {/* Microsoft Teams Floating Hover Reaction & Action Toolbar */}
                      {!isEditing && (
                        <div
                          className={`opacity-0 group-hover/msg:opacity-100 transition-opacity absolute -top-5 ${
                            isOwn ? "right-2" : "left-2"
                          } z-20 flex items-center gap-1 bg-[#1a1a1d] border border-zinc-700 rounded-full px-2.5 py-1 shadow-xl`}
                        >
                          {QUICK_REACTIONS.map((emo) => (
                            <button
                              key={emo}
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, emo)}
                              className="hover:scale-125 transition-transform px-1 py-0.5 text-lg leading-none"
                              title={`React ${emo}`}
                            >
                              {emo}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setReactionPickerMsgId((prev) =>
                                prev === msg.id ? null : msg.id
                              )
                            }
                            className="p-1 text-zinc-400 hover:text-white rounded"
                            title="More reactions"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                          {isOwn && (
                            <>
                              <div className="w-px h-4 bg-zinc-700 mx-0.5" />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditingText(msg.text);
                                }}
                                className="p-1 text-zinc-400 hover:text-white rounded"
                                title="Edit message"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 text-zinc-400 hover:text-red-400 rounded"
                                title="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Header Row: Sender Name + Timestamp */}
                      <div
                        className={`flex items-baseline gap-2 mb-1 ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="font-bold text-sm text-zinc-300 truncate">
                          {isOwn ? "You" : msg.profileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => seekTo(msg.videoTimestamp)}
                          className="text-xs font-mono text-zinc-400 hover:text-[#2563EB] transition-colors"
                          title="Jump to this video timestamp"
                        >
                          {formatTime(msg.videoTimestamp)}
                        </button>
                        {msg.editedAt && (
                          <span className="text-xs text-zinc-400 italic">
                            Edited
                          </span>
                        )}
                      </div>

                      {/* Expanded Reaction Emoji Picker for this Message */}
                      {reactionPickerMsgId === msg.id && (
                        <div className="mt-2 mb-2 bg-[#161618] border border-zinc-700 rounded-xl p-3 shadow-2xl z-30 w-72">
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            <span>React with any emoji</span>
                            <button
                              type="button"
                              onClick={() => setReactionPickerMsgId(null)}
                              className="text-zinc-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto pr-1">
                            {EMOJI_CATEGORIES.flatMap((c) => c.emojis).map(
                              (item) => (
                                <button
                                  key={`react-${msg.id}-${item.char}`}
                                  type="button"
                                  onClick={() => {
                                    handleToggleReaction(msg.id, item.char);
                                    setReactionPickerMsgId(null);
                                  }}
                                  className="h-9 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-2xl transition-transform hover:scale-125"
                                >
                                  {item.char}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Inline Edit Form OR Message Content */}
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveEditMessage(msg.id);
                          }}
                          className="mt-1.5 space-y-2 min-w-[240px]"
                        >
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            autoFocus
                            className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#2563EB] rounded px-3 py-2 text-base text-white outline-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingText("");
                              }}
                              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white rounded border border-zinc-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1 text-xs bg-[#2563EB] hover:bg-[#3B82F6] text-white font-semibold rounded"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {msg.text &&
                            (() => {
                              const trimmedMsg = msg.text.trim();
                              const isEmojiOnly =
                                trimmedMsg.length <= 14 &&
                                !/[a-zA-Z0-9]/.test(trimmedMsg);
                              return (
                                <p
                                  className={`${
                                    isEmojiOnly
                                      ? "text-4xl leading-tight py-1"
                                      : "text-[17px] leading-relaxed"
                                  } text-zinc-100 break-words whitespace-pre-wrap`}
                                >
                                  {msg.text}
                                </p>
                              );
                            })()}

                          {/* Attached Picture */}
                          {msg.imageUrl && (
                            <div className="mt-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={msg.imageUrl}
                                alt="Chat attachment"
                                onClick={() =>
                                  setLightboxImage(msg.imageUrl || null)
                                }
                                className="max-h-52 w-auto rounded-lg border border-zinc-700/80 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reactions Pill Row below Bubble */}
                  {reactionEntries.length > 0 && (
                    <div
                      className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${
                        isOwn ? "pr-10 justify-end" : "pl-10 justify-start"
                      }`}
                    >
                      {reactionEntries.map(([emo, users]) => {
                        const hasMine = users.some(
                          (u) => u.profileId === activeProfile.id
                        );
                        const names = users
                          .map((u) => u.profileName)
                          .join(", ");
                        return (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emo)}
                            title={`Reacted by: ${names}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-colors ${
                              hasMine
                                ? "bg-indigo-500/25 border-indigo-400 text-white font-semibold"
                                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                            }`}
                          >
                            <span className="text-base leading-none">{emo}</span>
                            <span className="text-xs">{users.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Compose Area (Teams-style with Image Preview, Emoji Picker, Picture Upload) */}
        <div className="relative border-t border-zinc-800 bg-[#161616] p-3">
          {/* Emoji Picker Popover (Full Categorized + Searchable Teams Style) */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1e1e1e] border border-zinc-700 rounded-xl p-3.5 shadow-2xl z-40 flex flex-col max-h-96">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                <span>Emoji Picker</span>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Input */}
              <input
                type="text"
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                placeholder="Search emojis (e.g. laugh, fire, popcorn, heart)..."
                className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none mb-2"
              />

              {/* Category Tabs */}
              {!emojiSearch.trim() && (
                <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 mb-2">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveEmojiCategory(cat.id)}
                      title={cat.label}
                      className={`flex-1 py-1.5 rounded text-xl transition-colors ${
                        activeEmojiCategory === cat.id
                          ? "bg-zinc-800 border-b-2 border-[#2563EB]"
                          : "hover:bg-zinc-800/50 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {cat.icon}
                    </button>
                  ))}
                </div>
              )}

              {/* Scrollable Emoji Grid */}
              <div className="overflow-y-auto flex-1 pr-1">
                {emojiSearch.trim() ? (
                  <div className="grid grid-cols-6 gap-1.5">
                    {EMOJI_CATEGORIES.flatMap((c) => c.emojis)
                      .filter((e) =>
                        e.keywords
                          .toLowerCase()
                          .includes(emojiSearch.trim().toLowerCase())
                      )
                      .map((item, idx) => (
                        <button
                          key={`search-${item.char}-${idx}`}
                          type="button"
                          onClick={() =>
                            setChatText((prev) => prev + item.char)
                          }
                          title={item.keywords}
                          className="h-11 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-2xl transition-transform hover:scale-125"
                        >
                          {item.char}
                        </button>
                      ))}
                  </div>
                ) : (
                  (() => {
                    const currentCat =
                      EMOJI_CATEGORIES.find(
                        (c) => c.id === activeEmojiCategory
                      ) || EMOJI_CATEGORIES[0];
                    return (
                      <div>
                        <div className="text-xs font-semibold text-zinc-400 mb-2">
                          {currentCat.label} ({currentCat.emojis.length})
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {currentCat.emojis.map((item, idx) => (
                            <button
                              key={`${currentCat.id}-${item.char}-${idx}`}
                              type="button"
                              onClick={() =>
                                setChatText((prev) => prev + item.char)
                              }
                              title={item.keywords}
                              className="h-11 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-2xl transition-transform hover:scale-125"
                            >
                              {item.char}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* Staged Image Attachment Preview */}
          {chatImagePreview && (
            <div className="mb-2.5 relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chatImagePreview}
                alt="Upload preview"
                className="h-20 w-auto rounded-lg border border-zinc-700 object-cover"
              />
              <button
                type="button"
                onClick={() => setChatImagePreview(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black border border-zinc-600 text-white flex items-center justify-center hover:bg-red-600"
                title="Remove picture"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Hidden File Input for Pictures */}
          <input
            ref={chatImageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processChatImageFile(file);
              e.target.value = "";
            }}
            className="hidden"
          />

          <form
            onSubmit={handleSendChat}
            className="bg-zinc-900 border border-zinc-700/80 focus-within:border-[#2563EB] rounded-xl px-3.5 py-2.5 transition-colors"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.startsWith("image/")) {
                    const file = items[i].getAsFile();
                    if (file) {
                      e.preventDefault();
                      processChatImageFile(file);
                      break;
                    }
                  }
                }
              }}
              placeholder={
                room
                  ? "Type a message or paste a picture..."
                  : "Type a message..."
              }
              className="w-full bg-transparent text-base text-white placeholder-zinc-500 outline-none mb-2"
            />

            <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
                    showEmojiPicker
                      ? "text-[#2563EB] bg-zinc-800"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => chatImageInputRef.current?.click()}
                  className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title="Attach picture"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!chatText.trim() && !chatImagePreview}
                className="px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-40 text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
                title="Send Message"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </aside>
      )}

      {/* Fullscreen Lightbox for Clicked Chat Pictures */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImage}
            alt="Full size attachment"
            className="max-w-full max-h-full rounded-lg shadow-2xl border border-zinc-800 object-contain"
          />
        </div>
      )}
    </div>
  );
}
