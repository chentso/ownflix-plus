/**
 * Hilarious, quirky, and cinema/streaming-themed funny name generator
 */

const ADJECTIVES = [
  "Couch",
  "Popcorn",
  "Buffering",
  "Sneaky",
  "Spicy",
  "Caffeinated",
  "Crispy",
  "Snoozy",
  "Fluffy",
  "Chaotic",
  "Funky",
  "Glitchy",
  "Pixelated",
  "Turbo",
  "Supreme",
  "Dramatic",
  "Sleepy",
  "Buttery",
  "Midnight",
  "Quantum",
  "Zesty",
  "Groovy",
  "Wobbly",
  "Sassy",
  "Clueless",
  "Vintage",
  "Cosmic",
  "Sir",
  "Captain",
  "Doctor",
  "Professor",
  "Lord",
  "Grandma",
  "Detective",
];

const NOUNS = [
  "Bandit",
  "Goblin",
  "Wizard",
  "Gremlin",
  "TaterTot",
  "Burrito",
  "Sloth",
  "Capybara",
  "Koala",
  "Panda",
  "Potato",
  "Waffle",
  "Ninja",
  "Maestro",
  "Monster",
  "Commander",
  "Penguin",
  "Llama",
  "Donut",
  "Otter",
  "Badger",
  "Pickle",
  "Nugget",
  "Avocado",
];

const STREAMING_TROPE_NAMES = [
  "Intro Skipper",
  "Plot Twist",
  "Subtitle Reader",
  "Remote Hog",
  "Couch Goblin",
  "Popcorn Bandit",
  "Buffering Wizard",
  "Spoiler Alert",
  "Cliffhanger Carl",
  "Captain Rewind",
  "Binge Queen",
  "Binge King",
  "Screen Sloth",
  "Credits Dodger",
  "Tinfoil Theorist",
  "Chief Snack Officer",
  "Couch Commander",
  "Season Binger",
  "Subtitles Only",
  "Late Night Lurker",
  "Sir Snacks-a-Lot",
  "Lord of the Remotes",
  "Doctor Binge",
  "Detective Popcorn",
  "Cinema Gremlin",
  "Nacho Champion",
  "Darth Sloth",
  "The One Who Pauses",
  "Snack Whisperer",
  "Wi-Fi Warlock",
  "Pizza Philosopher",
  "Binge Watcher 9000",
  "Sleepy Streamer",
  "Audio Normalizer",
];

export function generateFunnyProfileName(): string {
  // 45% chance to pick a curated streaming/cinema trope name
  if (Math.random() < 0.45) {
    const idx = Math.floor(Math.random() * STREAMING_TROPE_NAMES.length);
    return STREAMING_TROPE_NAMES[idx];
  }

  // 55% chance to combine funny adjective + noun
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  if (adj === "Sir" || adj === "Captain" || adj === "Doctor" || adj === "Professor" || adj === "Lord") {
    return `${adj} ${noun}`;
  }

  return `${adj} ${noun}`;
}

export function generateFunnyNameSuggestions(count = 3): string[] {
  const set = new Set<string>();
  let attempts = 0;
  while (set.size < count && attempts < 40) {
    attempts++;
    set.add(generateFunnyProfileName());
  }
  return Array.from(set);
}

export const generateFunnyName = generateFunnyProfileName;

