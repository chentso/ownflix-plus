import React from "react";
import {
  Smile,
  Crown,
  Zap,
  Rocket,
  Tv,
  Flame,
  Sparkles,
  Heart,
  Trophy,
  Award,
  Shield,
  Sword,
  Wand2,
  Compass,
  Film,
  Clapperboard,
  Popcorn,
  Drama,
  Music,
  Headphones,
  Ghost,
  Skull,
  Bot,
  Gamepad2,
  Glasses,
  Laugh,
  Cat,
  Dog,
  Rabbit,
  Bird,
  Fish,
  Sun,
  Moon,
  Coffee,
  Pizza,
  Cookie,
  Eye,
  Dice5,
  Radio,
  Disc,
  LucideIcon,
} from "lucide-react";

export type AvatarCategory =
  | "all"
  | "emblems"
  | "emojis"
  | "cinema"
  | "characters"
  | "creatures"
  | "fun";

export interface AvatarEmblemItem {
  type: "emblem";
  id: string;
  label: string;
  Icon: LucideIcon;
  categories: AvatarCategory[];
}

export interface AvatarEmojiItem {
  type: "emoji";
  id: string;
  label: string;
  emoji: string;
  categories: AvatarCategory[];
}

export type AvatarItem = AvatarEmblemItem | AvatarEmojiItem;

export const AVATAR_EMBLEMS: AvatarEmblemItem[] = [
  // Classic & General
  { type: "emblem", id: "smile", label: "Classic Smile", Icon: Smile, categories: ["emblems", "characters"] },
  { type: "emblem", id: "crown", label: "Crown", Icon: Crown, categories: ["emblems", "characters"] },
  { type: "emblem", id: "zap", label: "Lightning Bolt", Icon: Zap, categories: ["emblems", "fun"] },
  { type: "emblem", id: "rocket", label: "Rocket", Icon: Rocket, categories: ["emblems", "fun"] },
  { type: "emblem", id: "tv", label: "Retro TV", Icon: Tv, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "flame", label: "Flame", Icon: Flame, categories: ["emblems", "fun"] },
  { type: "emblem", id: "sparkles", label: "Sparkles", Icon: Sparkles, categories: ["emblems", "fun"] },
  { type: "emblem", id: "heart", label: "Heart", Icon: Heart, categories: ["emblems", "fun"] },
  { type: "emblem", id: "trophy", label: "Trophy", Icon: Trophy, categories: ["emblems", "fun"] },
  { type: "emblem", id: "award", label: "Medal Award", Icon: Award, categories: ["emblems", "fun"] },
  { type: "emblem", id: "shield", label: "Guardian Shield", Icon: Shield, categories: ["emblems", "fun"] },
  { type: "emblem", id: "sword", label: "Hero Sword", Icon: Sword, categories: ["emblems", "fun"] },
  { type: "emblem", id: "wand", label: "Magic Wand", Icon: Wand2, categories: ["emblems", "fun"] },
  { type: "emblem", id: "compass", label: "Compass", Icon: Compass, categories: ["emblems", "fun"] },

  // Cinema & Media
  { type: "emblem", id: "film", label: "Film Reel", Icon: Film, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "clapper", label: "Clapperboard", Icon: Clapperboard, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "popcorn", label: "Popcorn", Icon: Popcorn, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "drama", label: "Drama Masks", Icon: Drama, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "music", label: "Music Note", Icon: Music, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "headphones", label: "Headphones", Icon: Headphones, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "radio", label: "Radio Station", Icon: Radio, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "disc", label: "Vinyl Disc", Icon: Disc, categories: ["emblems", "cinema"] },

  // Characters & Fun
  { type: "emblem", id: "ghost", label: "Ghost", Icon: Ghost, categories: ["emblems", "characters"] },
  { type: "emblem", id: "skull", label: "Skull", Icon: Skull, categories: ["emblems", "characters"] },
  { type: "emblem", id: "bot", label: "Cyborg", Icon: Bot, categories: ["emblems", "characters"] },
  { type: "emblem", id: "gamepad", label: "Gamer", Icon: Gamepad2, categories: ["emblems", "fun"] },
  { type: "emblem", id: "glasses", label: "Spectacles", Icon: Glasses, categories: ["emblems", "characters"] },
  { type: "emblem", id: "laugh", label: "Laughing", Icon: Laugh, categories: ["emblems", "characters"] },
  { type: "emblem", id: "eye", label: "All Seeing Eye", Icon: Eye, categories: ["emblems", "characters"] },
  { type: "emblem", id: "dice", label: "Lucky Dice", Icon: Dice5, categories: ["emblems", "fun"] },

  // Creatures & Animals
  { type: "emblem", id: "cat", label: "Cat", Icon: Cat, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "dog", label: "Dog", Icon: Dog, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "rabbit", label: "Rabbit", Icon: Rabbit, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "bird", label: "Bird", Icon: Bird, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "fish", label: "Fish", Icon: Fish, categories: ["emblems", "creatures"] },

  // Vibes & Snacks
  { type: "emblem", id: "sun", label: "Golden Sun", Icon: Sun, categories: ["emblems", "fun"] },
  { type: "emblem", id: "moon", label: "Crescent Moon", Icon: Moon, categories: ["emblems", "fun"] },
  { type: "emblem", id: "coffee", label: "Espresso", Icon: Coffee, categories: ["emblems", "fun"] },
  { type: "emblem", id: "pizza", label: "Pizza", Icon: Pizza, categories: ["emblems", "fun"] },
  { type: "emblem", id: "cookie", label: "Cookie", Icon: Cookie, categories: ["emblems", "fun"] },
];

export const AVATAR_EMOJIS: AvatarEmojiItem[] = [
  // Cinema & Shows
  { type: "emoji", id: "emoji:🍿", label: "Popcorn", emoji: "🍿", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎬", label: "Clapperboard", emoji: "🎬", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎥", label: "Cinema Camera", emoji: "🎥", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎭", label: "Performing Arts", emoji: "🎭", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎟️", label: "Movie Ticket", emoji: "🎟️", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📺", label: "Television", emoji: "📺", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📼", label: "VHS Tape", emoji: "📼", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📽️", label: "Film Projector", emoji: "📽️", categories: ["emojis", "cinema"] },

  // Characters & Faces
  { type: "emoji", id: "emoji:😎", label: "Cool Shades", emoji: "😎", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🥳", label: "Party Time", emoji: "🥳", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤠", label: "Cowboy", emoji: "🤠", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🥷", label: "Ninja", emoji: "🥷", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤖", label: "Robot", emoji: "🤖", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👾", label: "8-bit Alien", emoji: "👾", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👻", label: "Ghost", emoji: "👻", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👽", label: "Alien", emoji: "👽", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🦸", label: "Superhero", emoji: "🦸", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧙", label: "Wizard", emoji: "🧙", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👑", label: "Royalty Crown", emoji: "👑", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧐", label: "Fancy Monocle", emoji: "🧐", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧛", label: "Vampire", emoji: "🧛", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧟", label: "Zombie", emoji: "🧟", categories: ["emojis", "characters"] },

  // Creatures & Animals
  { type: "emoji", id: "emoji:🦄", label: "Unicorn", emoji: "🦄", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦁", label: "Lion", emoji: "🦁", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐯", label: "Tiger", emoji: "🐯", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦊", label: "Fox", emoji: "🦊", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐼", label: "Panda", emoji: "🐼", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐨", label: "Koala", emoji: "🐨", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐱", label: "Kitty", emoji: "🐱", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐶", label: "Puppy", emoji: "🐶", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐵", label: "Monkey", emoji: "🐵", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐙", label: "Octopus", emoji: "🐙", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦈", label: "Shark", emoji: "🦈", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦖", label: "T-Rex", emoji: "🦖", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐲", label: "Dragon", emoji: "🐲", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦉", label: "Owl", emoji: "🦉", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐸", label: "Frog", emoji: "🐸", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐺", label: "Wolf", emoji: "🐺", categories: ["emojis", "creatures"] },

  // Fun, Vibes & Snacks
  { type: "emoji", id: "emoji:🔥", label: "Fire", emoji: "🔥", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:⚡", label: "High Voltage", emoji: "⚡", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:✨", label: "Sparkles", emoji: "✨", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🚀", label: "Rocket Launch", emoji: "🚀", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🛸", label: "UFO", emoji: "🛸", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎮", label: "Controller", emoji: "🎮", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🕹️", label: "Arcade Stick", emoji: "🕹️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎲", label: "Dice", emoji: "🎲", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎸", label: "Rock Guitar", emoji: "🎸", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎧", label: "Headphones", emoji: "🎧", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🏆", label: "Trophy", emoji: "🏆", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:💎", label: "Diamond Gem", emoji: "💎", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍕", label: "Pizza Slice", emoji: "🍕", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍔", label: "Cheeseburger", emoji: "🍔", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌮", label: "Taco", emoji: "🌮", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍩", label: "Glazed Donut", emoji: "🍩", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🥑", label: "Avocado", emoji: "🥑", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:☕", label: "Hot Brew", emoji: "☕", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌈", label: "Rainbow", emoji: "🌈", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌙", label: "Night Moon", emoji: "🌙", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🪐", label: "Saturn Planet", emoji: "🪐", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:💣", label: "Bomb", emoji: "💣", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎯", label: "Bullseye", emoji: "🎯", categories: ["emojis", "fun"] },
];

export const ALL_AVATAR_ITEMS: AvatarItem[] = [
  ...AVATAR_EMBLEMS,
  ...AVATAR_EMOJIS,
];

// Preserves backward compatibility for files importing AVATAR_ICONS
export const AVATAR_ICONS = AVATAR_EMBLEMS;

function isRawEmoji(str: string): boolean {
  if (!str) return false;
  try {
    return new RegExp("\\p{Extended_Pictographic}", "u").test(str);
  } catch {
    return false;
  }
}

/**
 * Render any profile avatar icon (supports both Lucide vector emblems and full Unicode emojis).
 * Scales dynamically to match the container width/height specified in className.
 */
export function renderProfileIcon(iconId: string, className = "w-14 h-14") {
  if (!iconId) {
    return <Smile className={className} strokeWidth={1.8} />;
  }

  // 1. Check for Emoji
  let emojiChar: string | null = null;
  if (iconId.startsWith("emoji:")) {
    emojiChar = iconId.slice(6);
  } else {
    const match = AVATAR_EMOJIS.find((e) => e.id === iconId || e.emoji === iconId);
    if (match) {
      emojiChar = match.emoji;
    } else if (isRawEmoji(iconId)) {
      emojiChar = iconId;
    }
  }

  if (emojiChar) {
    let fontSize = "text-2xl";
    if (
      className.includes("w-14") ||
      className.includes("w-16") ||
      className.includes("w-20") ||
      className.includes("w-24")
    ) {
      fontSize = "text-4xl";
    } else if (className.includes("w-10") || className.includes("w-12")) {
      fontSize = "text-2xl";
    } else if (className.includes("w-8") || className.includes("w-9")) {
      fontSize = "text-xl";
    } else if (className.includes("w-5") || className.includes("w-6")) {
      fontSize = "text-base";
    } else if (className.includes("w-4")) {
      fontSize = "text-xs";
    } else if (className.includes("w-3")) {
      fontSize = "text-[10px]";
    }

    return (
      <span
        className={`inline-flex items-center justify-center select-none leading-none ${fontSize} ${className}`}
        role="img"
        aria-label="avatar emoji"
      >
        {emojiChar}
      </span>
    );
  }

  // 2. Check for Lucide Emblem
  const found = AVATAR_EMBLEMS.find((i) => i.id === iconId);
  const IconComponent = found ? found.Icon : Smile;
  return <IconComponent className={className} strokeWidth={1.8} />;
}
