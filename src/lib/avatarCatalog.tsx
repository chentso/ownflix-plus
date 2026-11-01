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
  Video,
  CassetteTape,
  Camera,
  Projector,
  Mic,
  Megaphone,
  Ticket,
  ScreenShare,
  MonitorPlay,
  BoomBox,
  Anchor,
  Ship,
  Plane,
  Binoculars,
  Mountain,
  Tent,
  Key,
  Gem,
  Coins,
  Swords,
  Trees,
  Flower2,
  Bug,
  Snail,
  Apple,
  Cherry,
  Banana,
  Palmtree,
  Leaf,
  Sprout,
  CloudRain,
  Snowflake,
  Wind,
  Joystick,
  Medal,
  PartyPopper,
  Gift,
  Atom,
  Orbit,
  Infinity,
  Cpu,
  Laptop,
  RadioTower,
  Wifi,
  Disc3,
  IceCream2,
  Cake,
  Beer,
  Wine,
  Martini,
  UtensilsCrossed,
  CupSoda,
  Footprints,
  Feather,
  Target,
  Crosshair,
  SmilePlus,
  Baby,
  Siren,
  Flashlight,
  Radiation,
  Biohazard,
  ShieldAlert,
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
  // Classic & General Emblems
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
  { type: "emblem", id: "swords", label: "Crossed Swords", Icon: Swords, categories: ["emblems", "fun"] },
  { type: "emblem", id: "wand", label: "Magic Wand", Icon: Wand2, categories: ["emblems", "fun"] },
  { type: "emblem", id: "compass", label: "Compass", Icon: Compass, categories: ["emblems", "fun"] },
  { type: "emblem", id: "target", label: "Target Bullseye", Icon: Target, categories: ["emblems", "fun"] },
  { type: "emblem", id: "crosshair", label: "Sniper Crosshair", Icon: Crosshair, categories: ["emblems", "fun"] },
  { type: "emblem", id: "key", label: "Golden Key", Icon: Key, categories: ["emblems", "fun"] },
  { type: "emblem", id: "gem", label: "Precious Gem", Icon: Gem, categories: ["emblems", "fun"] },
  { type: "emblem", id: "coins", label: "Treasure Coins", Icon: Coins, categories: ["emblems", "fun"] },

  // Cinema, Film & Entertainment Emblems
  { type: "emblem", id: "film", label: "Film Reel", Icon: Film, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "clapper", label: "Clapperboard", Icon: Clapperboard, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "popcorn", label: "Popcorn", Icon: Popcorn, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "drama", label: "Drama Masks", Icon: Drama, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "music", label: "Music Note", Icon: Music, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "headphones", label: "Headphones", Icon: Headphones, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "radio", label: "Radio Station", Icon: Radio, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "disc", label: "Vinyl Disc", Icon: Disc, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "disc3", label: "Compact Disc", Icon: Disc3, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "video", label: "Video Cam", Icon: Video, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "cassette", label: "Cassette Tape", Icon: CassetteTape, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "camera", label: "Studio Camera", Icon: Camera, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "projector", label: "Home Projector", Icon: Projector, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "mic", label: "Stage Mic", Icon: Mic, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "megaphone", label: "Director Megaphone", Icon: Megaphone, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "ticket", label: "Cinema Ticket", Icon: Ticket, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "screen", label: "Monitor Player", Icon: MonitorPlay, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "screenshare", label: "Screen Broadcast", Icon: ScreenShare, categories: ["emblems", "cinema"] },
  { type: "emblem", id: "boombox", label: "Street BoomBox", Icon: BoomBox, categories: ["emblems", "cinema"] },

  // Characters, Faces & Personas
  { type: "emblem", id: "ghost", label: "Ghost", Icon: Ghost, categories: ["emblems", "characters"] },
  { type: "emblem", id: "skull", label: "Skull", Icon: Skull, categories: ["emblems", "characters"] },
  { type: "emblem", id: "bot", label: "Cyborg", Icon: Bot, categories: ["emblems", "characters"] },
  { type: "emblem", id: "gamepad", label: "Gamer", Icon: Gamepad2, categories: ["emblems", "fun"] },
  { type: "emblem", id: "joystick", label: "Arcade Joystick", Icon: Joystick, categories: ["emblems", "fun"] },
  { type: "emblem", id: "glasses", label: "Spectacles", Icon: Glasses, categories: ["emblems", "characters"] },
  { type: "emblem", id: "laugh", label: "Laughing", Icon: Laugh, categories: ["emblems", "characters"] },
  { type: "emblem", id: "smileplus", label: "Beaming Smile", Icon: SmilePlus, categories: ["emblems", "characters"] },
  { type: "emblem", id: "eye", label: "All Seeing Eye", Icon: Eye, categories: ["emblems", "characters"] },
  { type: "emblem", id: "baby", label: "Baby Junior", Icon: Baby, categories: ["emblems", "characters"] },
  { type: "emblem", id: "footprints", label: "Mystery Footprints", Icon: Footprints, categories: ["emblems", "characters"] },
  { type: "emblem", id: "feather", label: "Quill Feather", Icon: Feather, categories: ["emblems", "characters"] },

  // Animals & Nature Emblems
  { type: "emblem", id: "cat", label: "Cat", Icon: Cat, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "dog", label: "Dog", Icon: Dog, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "rabbit", label: "Rabbit", Icon: Rabbit, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "bird", label: "Bird", Icon: Bird, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "fish", label: "Fish", Icon: Fish, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "bug", label: "Ladybug", Icon: Bug, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "snail", label: "Slow Snail", Icon: Snail, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "trees", label: "Forest Pine", Icon: Trees, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "flower", label: "Flower Blossom", Icon: Flower2, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "palmtree", label: "Tropical Palm", Icon: Palmtree, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "leaf", label: "Autumn Leaf", Icon: Leaf, categories: ["emblems", "creatures"] },
  { type: "emblem", id: "sprout", label: "Green Sprout", Icon: Sprout, categories: ["emblems", "creatures"] },

  // Adventure, Travel & Elements
  { type: "emblem", id: "anchor", label: "Nautical Anchor", Icon: Anchor, categories: ["emblems", "fun"] },
  { type: "emblem", id: "ship", label: "Voyager Ship", Icon: Ship, categories: ["emblems", "fun"] },
  { type: "emblem", id: "plane", label: "Jet Airliner", Icon: Plane, categories: ["emblems", "fun"] },
  { type: "emblem", id: "binoculars", label: "Safari Binoculars", Icon: Binoculars, categories: ["emblems", "fun"] },
  { type: "emblem", id: "mountain", label: "Alpine Peak", Icon: Mountain, categories: ["emblems", "fun"] },
  { type: "emblem", id: "tent", label: "Campfire Tent", Icon: Tent, categories: ["emblems", "fun"] },
  { type: "emblem", id: "sun", label: "Golden Sun", Icon: Sun, categories: ["emblems", "fun"] },
  { type: "emblem", id: "moon", label: "Crescent Moon", Icon: Moon, categories: ["emblems", "fun"] },
  { type: "emblem", id: "rain", label: "Rain Cloud", Icon: CloudRain, categories: ["emblems", "fun"] },
  { type: "emblem", id: "snow", label: "Snowflake", Icon: Snowflake, categories: ["emblems", "fun"] },
  { type: "emblem", id: "wind", label: "Breeze Wind", Icon: Wind, categories: ["emblems", "fun"] },

  // Tech, Party & Science
  { type: "emblem", id: "dice", label: "Lucky Dice", Icon: Dice5, categories: ["emblems", "fun"] },
  { type: "emblem", id: "party", label: "Party Popper", Icon: PartyPopper, categories: ["emblems", "fun"] },
  { type: "emblem", id: "gift", label: "Present Box", Icon: Gift, categories: ["emblems", "fun"] },
  { type: "emblem", id: "medal", label: "Honor Medal", Icon: Medal, categories: ["emblems", "fun"] },
  { type: "emblem", id: "atom", label: "Nuclear Atom", Icon: Atom, categories: ["emblems", "fun"] },
  { type: "emblem", id: "orbit", label: "Cosmic Orbit", Icon: Orbit, categories: ["emblems", "fun"] },
  { type: "emblem", id: "infinity", label: "Infinity Loop", Icon: Infinity, categories: ["emblems", "fun"] },
  { type: "emblem", id: "cpu", label: "Silicon Microchip", Icon: Cpu, categories: ["emblems", "fun"] },
  { type: "emblem", id: "laptop", label: "Workstation", Icon: Laptop, categories: ["emblems", "fun"] },
  { type: "emblem", id: "radiotower", label: "Radio Tower", Icon: RadioTower, categories: ["emblems", "fun"] },
  { type: "emblem", id: "wifi", label: "Broadband Signal", Icon: Wifi, categories: ["emblems", "fun"] },
  { type: "emblem", id: "siren", label: "Police Siren", Icon: Siren, categories: ["emblems", "fun"] },
  { type: "emblem", id: "flashlight", label: "Torchlight", Icon: Flashlight, categories: ["emblems", "fun"] },
  { type: "emblem", id: "radiation", label: "Hazard Warning", Icon: Radiation, categories: ["emblems", "fun"] },
  { type: "emblem", id: "biohazard", label: "Biohazard", Icon: Biohazard, categories: ["emblems", "fun"] },
  { type: "emblem", id: "shieldalert", label: "Defensive Shield", Icon: ShieldAlert, categories: ["emblems", "fun"] },

  // Treats, Food & Drinks
  { type: "emblem", id: "coffee", label: "Espresso", Icon: Coffee, categories: ["emblems", "fun"] },
  { type: "emblem", id: "pizza", label: "Pizza", Icon: Pizza, categories: ["emblems", "fun"] },
  { type: "emblem", id: "cookie", label: "Cookie", Icon: Cookie, categories: ["emblems", "fun"] },
  { type: "emblem", id: "cake", label: "Celebration Cake", Icon: Cake, categories: ["emblems", "fun"] },
  { type: "emblem", id: "icecream", label: "Ice Cream Swirl", Icon: IceCream2, categories: ["emblems", "fun"] },
  { type: "emblem", id: "apple", label: "Red Apple", Icon: Apple, categories: ["emblems", "fun"] },
  { type: "emblem", id: "cherry", label: "Twin Cherries", Icon: Cherry, categories: ["emblems", "fun"] },
  { type: "emblem", id: "banana", label: "Banana", Icon: Banana, categories: ["emblems", "fun"] },
  { type: "emblem", id: "soda", label: "Fountain Soda", Icon: CupSoda, categories: ["emblems", "fun"] },
  { type: "emblem", id: "beer", label: "Frothy Mug", Icon: Beer, categories: ["emblems", "fun"] },
  { type: "emblem", id: "wine", label: "Vintage Wine", Icon: Wine, categories: ["emblems", "fun"] },
  { type: "emblem", id: "martini", label: "Cocktail Glass", Icon: Martini, categories: ["emblems", "fun"] },
  { type: "emblem", id: "utensils", label: "Gourmet Dining", Icon: UtensilsCrossed, categories: ["emblems", "fun"] },
];

export const AVATAR_EMOJIS: AvatarEmojiItem[] = [
  // 1. Cinema, TV & Pop Culture
  { type: "emoji", id: "emoji:🍿", label: "Popcorn Tub", emoji: "🍿", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎬", label: "Director Clapperboard", emoji: "🎬", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎥", label: "Cinema Camera", emoji: "🎥", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎭", label: "Performing Arts Masks", emoji: "🎭", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎟️", label: "Movie Ticket", emoji: "🎟️", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎫", label: "Gold Admission", emoji: "🎫", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📺", label: "Retro Television", emoji: "📺", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📼", label: "VHS Tape", emoji: "📼", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📽️", label: "Film Projector", emoji: "📽️", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎞️", label: "Film Reel Frames", emoji: "🎞️", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📀", label: "DVD / BluRay", emoji: "📀", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎪", label: "Big Top Circus", emoji: "🎪", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎨", label: "Artist Palette", emoji: "🎨", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎙️", label: "Studio Microphone", emoji: "🎙️", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:📻", label: "Oldies Radio", emoji: "📻", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🎧", label: "Audio Headphones", emoji: "🎧", categories: ["emojis", "cinema"] },
  { type: "emoji", id: "emoji:🕶️", label: "3D Dark Glasses", emoji: "🕶️", categories: ["emojis", "cinema"] },

  // 2. Characters, Heroes & Faces
  { type: "emoji", id: "emoji:😎", label: "Cool Shades", emoji: "😎", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🥳", label: "Party Time", emoji: "🥳", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤠", label: "Cowboy", emoji: "🤠", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🥷", label: "Shadow Ninja", emoji: "🥷", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤖", label: "Cyborg Robot", emoji: "🤖", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👾", label: "8-bit Space Invader", emoji: "👾", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👻", label: "Friendly Ghost", emoji: "👻", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👽", label: "Alien Extra-terrestrial", emoji: "👽", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🦸", label: "Superhero Hero", emoji: "🦸", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🦹", label: "Master Supervillain", emoji: "🦹", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧙", label: "Sorcerer Wizard", emoji: "🧙", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧚", label: "Magic Pixie Fairy", emoji: "🧚", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧛", label: "Night Vampire", emoji: "🧛", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧜", label: "Deep Sea Mermaid", emoji: "🧜", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧝", label: "Elven Archer", emoji: "🧝", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧞", label: "Lamp Genie", emoji: "🧞", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧟", label: "Undead Zombie", emoji: "🧟", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👑", label: "Royalty Crown", emoji: "👑", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧐", label: "Fancy Monocle", emoji: "🧐", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🥸", label: "Incognito Disguise", emoji: "🥸", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤩", label: "Star Struck", emoji: "🤩", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤯", label: "Mind Blown", emoji: "🤯", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🥶", label: "Freezing Cold", emoji: "🥶", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🥵", label: "Hot & Spicy", emoji: "🥵", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:😈", label: "Mischievous Devil", emoji: "😈", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:💀", label: "Skull", emoji: "💀", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:☠️", label: "Pirate Jolly Roger", emoji: "☠️", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤡", label: "Circus Clown", emoji: "🤡", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧑‍🚀", label: "Astronaut Explorer", emoji: "🧑‍🚀", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧑‍🎤", label: "Rock Rockstar", emoji: "🧑‍🎤", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🧑‍🍳", label: "Master Chef", emoji: "🧑‍🍳", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🕵️", label: "Undercover Detective", emoji: "🕵️", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:💂", label: "Palace Guard", emoji: "💂", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👸", label: "Princess", emoji: "👸", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤴", label: "Prince", emoji: "🤴", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:👼", label: "Little Angel", emoji: "👼", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🫠", label: "Melting Smile", emoji: "🫠", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🫡", label: "Saluting Commander", emoji: "🫡", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🫣", label: "Peeking Eye", emoji: "🫣", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤫", label: "Secret Hush", emoji: "🤫", categories: ["emojis", "characters"] },
  { type: "emoji", id: "emoji:🤑", label: "Jackpot Rich", emoji: "🤑", categories: ["emojis", "characters"] },

  // 3. Creatures, Dinosaurs & Wildlife
  { type: "emoji", id: "emoji:🦖", label: "T-Rex Dinosaur", emoji: "🦖", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦕", label: "Brontosaurus", emoji: "🦕", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐲", label: "Dragon Face", emoji: "🐲", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐉", label: "Mythic Dragon", emoji: "🐉", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦁", label: "Lion King", emoji: "🦁", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐯", label: "Tiger", emoji: "🐯", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦊", label: "Clever Fox", emoji: "🦊", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐼", label: "Giant Panda", emoji: "🐼", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐨", label: "Koala Bear", emoji: "🐨", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦄", label: "Majestic Unicorn", emoji: "🦄", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐺", label: "Lone Wolf", emoji: "🐺", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐻", label: "Grizzly Bear", emoji: "🐻", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐻‍❄️", label: "Polar Bear", emoji: "🐻‍❄️", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐵", label: "Playful Monkey", emoji: "🐵", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦍", label: "Silverback Gorilla", emoji: "🦍", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦧", label: "Orangutan", emoji: "🦧", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐶", label: "Loyal Dog", emoji: "🐶", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐱", label: "Curious Cat", emoji: "🐱", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐆", label: "Speed Leopard", emoji: "🐆", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦓", label: "Striped Zebra", emoji: "🦓", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦛", label: "Heavy Hippo", emoji: "🦛", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦏", label: "Armored Rhino", emoji: "🦏", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐘", label: "Wise Elephant", emoji: "🐘", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦒", label: "Tall Giraffe", emoji: "🦒", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦔", label: "Sonic Hedgehog", emoji: "🦔", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦇", label: "Midnight Bat", emoji: "🦇", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦅", label: "Soaring Eagle", emoji: "🦅", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦉", label: "Wise Night Owl", emoji: "🦉", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦜", label: "Tropical Parrot", emoji: "🦜", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦚", label: "Royal Peacock", emoji: "🦚", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦩", label: "Pink Flamingo", emoji: "🦩", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐧", label: "Gentoo Penguin", emoji: "🐧", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦈", label: "Great Shark", emoji: "🦈", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐬", label: "Ocean Dolphin", emoji: "🐬", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐋", label: "Blue Whale", emoji: "🐋", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐙", label: "Kraken Octopus", emoji: "🐙", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦑", label: "Deep Squid", emoji: "🦑", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦞", label: "Sea Lobster", emoji: "🦞", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦀", label: "Beach Crab", emoji: "🦀", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐢", label: "Ancient Sea Turtle", emoji: "🐢", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐊", label: "Crocodile", emoji: "🐊", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐍", label: "Viper Snake", emoji: "🐍", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐸", label: "Poison Dart Frog", emoji: "🐸", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🐝", label: "Bumble Bee", emoji: "🐝", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦋", label: "Monarch Butterfly", emoji: "🦋", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🕷️", label: "Shadow Spider", emoji: "🕷️", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦂", label: "Desert Scorpion", emoji: "🦂", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦭", label: "Harbor Seal", emoji: "🦭", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦥", label: "Lazy Sloth", emoji: "🦥", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦦", label: "River Otter", emoji: "🦦", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦨", label: "Skunk", emoji: "🦨", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦝", label: "Trash Panda Raccoon", emoji: "🦝", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦡", label: "Honey Badger", emoji: "🦡", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦃", label: "Feathered Turkey", emoji: "🦃", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦆", label: "Mallard Duck", emoji: "🦆", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦤", label: "Ancient Dodo", emoji: "🦤", categories: ["emojis", "creatures"] },
  { type: "emoji", id: "emoji:🦫", label: "Timber Beaver", emoji: "🦫", categories: ["emojis", "creatures"] },

  // 4. Magic, Sci-Fi, Combat & Powers
  { type: "emoji", id: "emoji:🚀", label: "Rocket Launch", emoji: "🚀", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🛸", label: "Alien Flying Saucer", emoji: "🛸", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🛰️", label: "Orbital Satellite", emoji: "🛰️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:☄️", label: "Blazing Comet", emoji: "☄️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:⚡", label: "High Voltage Zap", emoji: "⚡", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🔥", label: "Inferno Flame", emoji: "🔥", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:✨", label: "Magic Sparkles", emoji: "✨", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🔮", label: "Crystal Ball", emoji: "🔮", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🪄", label: "Caster Wand", emoji: "🪄", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🗡️", label: "Shadow Dagger", emoji: "🗡️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:⚔️", label: "Battle Swords", emoji: "⚔️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🛡️", label: "Aegis Shield", emoji: "🛡️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🏹", label: "Bow & Quiver", emoji: "🏹", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:💣", label: "Ticking Bomb", emoji: "💣", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🧨", label: "Dynamite Fuse", emoji: "🧨", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:💥", label: "Action Explosion", emoji: "💥", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:💎", label: "Diamond Brilliant", emoji: "💎", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:💍", label: "Ring of Power", emoji: "💍", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🧿", label: "Protection Nazar", emoji: "🧿", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:⚗️", label: "Alchemy Alembic", emoji: "⚗️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🧪", label: "Lab Test Tube", emoji: "🧪", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🧬", label: "DNA Helix", emoji: "🧬", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🧲", label: "Attraction Magnet", emoji: "🧲", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🪓", label: "Viking Battleaxe", emoji: "🪓", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🪃", label: "Return Boomerang", emoji: "🪃", categories: ["emojis", "fun"] },

  // 5. Gaming, Vibes, Sports & Outerspace
  { type: "emoji", id: "emoji:🎮", label: "Video Game Controller", emoji: "🎮", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🕹️", label: "Retro Joystick", emoji: "🕹️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎲", label: "Lucky Rolling Dice", emoji: "🎲", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎳", label: "Strike Bowling", emoji: "🎳", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎯", label: "Direct Bullseye", emoji: "🎯", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🏆", label: "Victory Cup", emoji: "🏆", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🥇", label: "Gold First Place", emoji: "🥇", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎸", label: "Rocking Electric Guitar", emoji: "🎸", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🥁", label: "Heavy Bass Drums", emoji: "🥁", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎺", label: "Brass Trumpet", emoji: "🎺", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎹", label: "Grand Piano", emoji: "🎹", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🛹", label: "Halfpipe Skateboard", emoji: "🛹", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🏎️", label: "Grand Prix Racecar", emoji: "🏎️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🏍️", label: "Speed Motorcycle", emoji: "🏍️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:⛵", label: "Ocean Sailboat", emoji: "⛵", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🏄", label: "Wave Surfer", emoji: "🏄", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:⛷️", label: "Alpine Skier", emoji: "⛷️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:⛺", label: "Wilderness Camp", emoji: "⛺", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🏝️", label: "Tropical Island", emoji: "🏝️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌋", label: "Erupting Volcano", emoji: "🌋", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🪐", label: "Ringed Saturn", emoji: "🪐", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌌", label: "Cosmic Milky Way", emoji: "🌌", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌙", label: "Night Crescent Moon", emoji: "🌙", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:☀️", label: "Blazing Sun", emoji: "☀️", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌈", label: "Full Color Rainbow", emoji: "🌈", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎉", label: "Party Streamers", emoji: "🎉", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎊", label: "Confetti Ball", emoji: "🎊", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎈", label: "Red Balloon", emoji: "🎈", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🎁", label: "Mystery Gift", emoji: "🎁", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🪩", label: "Disco Mirror Ball", emoji: "🪩", categories: ["emojis", "fun"] },

  // 6. Food, Snacks & Sweet Treats
  { type: "emoji", id: "emoji:🍕", label: "Cheesy Pizza Slice", emoji: "🍕", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍔", label: "Double Cheeseburger", emoji: "🍔", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍟", label: "Crispy French Fries", emoji: "🍟", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌭", label: "Stadium Hot Dog", emoji: "🌭", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍿", label: "Popcorn Bucket", emoji: "🍿", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌮", label: "Crunchy Taco", emoji: "🌮", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🌯", label: "Loaded Burrito", emoji: "🌯", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍣", label: "Fresh Nigiri Sushi", emoji: "🍣", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍜", label: "Steaming Ramen Bowl", emoji: "🍜", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍩", label: "Glazed Donut", emoji: "🍩", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍪", label: "Chocolate Chip Cookie", emoji: "🍪", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍫", label: "Rich Chocolate Bar", emoji: "🍫", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍦", label: "Vanilla Ice Cream", emoji: "🍦", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍰", label: "Strawberry Shortcake", emoji: "🍰", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🧁", label: "Frosted Cupcake", emoji: "🧁", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🥞", label: "Stack of Pancakes", emoji: "🥞", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🥑", label: "Ripe Avocado", emoji: "🥑", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍉", label: "Sweet Watermelon", emoji: "🍉", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍓", label: "Juicy Strawberry", emoji: "🍓", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍒", label: "Twin Sweet Cherries", emoji: "🍒", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍍", label: "Golden Pineapple", emoji: "🍍", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:☕", label: "Steaming Hot Brew", emoji: "☕", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🧋", label: "Boba Bubble Tea", emoji: "🧋", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🥤", label: "Soda Cup with Straw", emoji: "🥤", categories: ["emojis", "fun"] },
  { type: "emoji", id: "emoji:🍺", label: "Cold Brew Beer", emoji: "🍺", categories: ["emojis", "fun"] },
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
 * Emojis are scaled generously so they fill the avatar box with full clarity and impact.
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
    // Determine prominent, high-impact font sizing based on target avatar box class
    let fontSize = "text-3xl";

    if (
      className.includes("w-28") ||
      className.includes("w-32") ||
      className.includes("w-36")
    ) {
      fontSize = "text-[5.5rem] leading-none";
    } else if (
      className.includes("md:w-20") ||
      className.includes("w-20") ||
      className.includes("w-24")
    ) {
      fontSize = "text-[4.5rem] md:text-[5.5rem] leading-none";
    } else if (
      className.includes("w-16") ||
      className.includes("w-14")
    ) {
      if (className.includes("md:w-16") || className.includes("md:w-20")) {
        fontSize = "text-[4rem] md:text-[5.25rem] leading-none";
      } else {
        fontSize = "text-[3.75rem] leading-none";
      }
    } else if (className.includes("w-12")) {
      fontSize = "text-[3rem] leading-none";
    } else if (className.includes("w-10")) {
      fontSize = "text-[2.25rem] leading-none";
    } else if (className.includes("w-8") || className.includes("w-9")) {
      fontSize = "text-[1.85rem] leading-none";
    } else if (className.includes("w-6") || className.includes("w-7")) {
      fontSize = "text-[1.4rem] leading-none";
    } else if (className.includes("w-5")) {
      fontSize = "text-[1.15rem] leading-none";
    } else if (className.includes("w-4")) {
      fontSize = "text-[0.95rem] leading-none";
    } else if (className.includes("w-3") || className.includes("w-2")) {
      fontSize = "text-[0.75rem] leading-none";
    }

    return (
      <span
        className={`inline-flex items-center justify-center select-none leading-none pointer-events-none transform hover:scale-105 transition-transform ${fontSize} ${className}`}
        role="img"
        aria-label="avatar emoji"
        style={{
          fontFamily:
            '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif',
          lineHeight: 1,
        }}
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
