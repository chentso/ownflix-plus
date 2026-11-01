import path from "path";
import { prisma } from "./prisma";
import { scanLibraryFolder } from "./scanner";

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }
  seedPromise = runSeed().finally(() => {
    seedPromise = null;
  });
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const mediaCount = await prisma.mediaItem.count();
  if (mediaCount > 0) {
    return;
  }

  // 1. Seed Built-In Movies & Series (High-speed open streams + Intro/Credits markers)
  const tearsOfSteel = await prisma.mediaItem.create({
    data: {
      title: "Tears of Steel",
      tagline: "In a fractured future, one memory can rewrite humanity's fate.",
      overview:
        "In an apocalyptic future Amsterdam, a group of soldiers and scientists gather at the Oude Kerk to stage a desperate reenactment of the event that led to the robotic uprising—hoping to alter the past before sentinel machines breach their perimeter.",
      type: "MOVIE",
      releaseYear: 2024,
      maturityRating: "TV-MA",
      genres: "Sci-Fi, Action, Cyberpunk",
      cast: "Derek de Lint, Sergio Hasselbaink, Rogier Schipper, Vanja Rukavina",
      director: "Ian Hubert",
      posterUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85",
      backdropUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=85",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      duration: 734,
      introStart: 5,
      introEnd: 42,
      creditsStart: 680,
      matchScore: 99,
      isFeatured: true,
      resolution: "4K Ultra HD",
      audioTracks: "English (Dolby Atmos 5.1),English (Original Stereo),Deutsch (5.1)",
      subtitleTracks: "English [CC],Español,Français,日本語",
    },
  });

  const sintel = await prisma.mediaItem.create({
    data: {
      title: "Sintel: The Dragon's Oath",
      tagline: "Every journey begins with what was lost.",
      overview:
        "A lone warrior named Sintel traverses frozen peaks and ancient ruins in search of Scales, a fledgling dragon she rescued and lost to a ruthless guardian beast. What she uncovers at the end of her quest changes everything she believed.",
      type: "MOVIE",
      releaseYear: 2023,
      maturityRating: "PG-13",
      genres: "Fantasy, Adventure, Animation",
      cast: "Halina Reijn, Thom Hoffman",
      director: "Colin Levy",
      posterUrl:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=85",
      backdropUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      duration: 888,
      introStart: 8,
      introEnd: 45,
      creditsStart: 810,
      matchScore: 97,
      isFeatured: false,
      resolution: "4K Ultra HD",
      audioTracks: "English (5.1 Surround),English (Stereo)",
      subtitleTracks: "English [CC],Español,Français",
    },
  });

  await prisma.mediaItem.create({
    data: {
      title: "Big Buck Horizons",
      tagline: "Nature fights back.",
      overview:
        "Deep within an idyllic emerald forest, a gentle giant's peaceful morning is disrupted by a trio of relentless woodland provocateurs. Pushed beyond his limits, he devises an elaborate counter-operation.",
      type: "MOVIE",
      releaseYear: 2024,
      maturityRating: "PG",
      genres: "Animation, Comedy, Family",
      cast: "Sacha Goedegebure, Jan Morgenstern",
      director: "Sacha Goedegebure",
      posterUrl:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=85",
      backdropUrl:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: 596,
      introStart: 4,
      introEnd: 32,
      creditsStart: 550,
      matchScore: 94,
      isFeatured: false,
      resolution: "1080p HD",
    },
  });

  await prisma.mediaItem.create({
    data: {
      title: "Architects of the Machine",
      tagline: "Inside the labyrinth, reality is programmable.",
      overview:
        "Two travelers with conflicting visions explore a surreal, self-constructing mechanical super-structure that responds to their paranoia and desires, testing the fragile boundary between mentor and prisoner.",
      type: "MOVIE",
      releaseYear: 2022,
      maturityRating: "TV-14",
      genres: "Sci-Fi, Mystery, Thriller",
      cast: "Tygo Gernandt, Cas Jansen",
      director: "Bassam Kurdali",
      posterUrl:
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=85",
      backdropUrl:
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=85",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: 653,
      introStart: 6,
      introEnd: 38,
      creditsStart: 600,
      matchScore: 92,
      isFeatured: false,
      resolution: "1080p HD",
    },
  });

  await prisma.mediaItem.create({
    data: {
      title: "Apex Velocity: Alpine",
      tagline: "Zero traction. Maximum commitment.",
      overview:
        "Follow precision rally drivers as they push custom-built machines along razor-thin mountain passes, battling altitude, changing weather, and millisecond margins.",
      type: "MOVIE",
      releaseYear: 2025,
      maturityRating: "PG-13",
      genres: "Action, Documentary, Sports",
      cast: "Kenji Sato, Elena Vance, Marcus Reed",
      director: "Lukas Vance",
      posterUrl:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=85",
      backdropUrl:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
      duration: 60,
      introStart: 3,
      introEnd: 12,
      creditsStart: 50,
      matchScore: 95,
      isFeatured: false,
      resolution: "4K Ultra HD",
    },
  });

  // 3. Seed Multi-Episode TV Series ("Chronicles of the Grid")
  const chronicles = await prisma.mediaItem.create({
    data: {
      title: "Chronicles of the Grid",
      tagline: "Every node hides a secret.",
      overview:
        "An anthology cyber-thriller series following rogue network operatives, underground street racers, and AI researchers across four interconnected incidents that reshaped the global net.",
      type: "SERIES",
      releaseYear: 2025,
      maturityRating: "TV-MA",
      genres: "Sci-Fi, Thriller, Series",
      cast: "Nora K., Jin-Woo Park, David Morales, Aria Chen",
      director: "Vera Lindqvist",
      posterUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=85",
      backdropUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85",
      duration: 734,
      matchScore: 98,
      isFeatured: false,
      resolution: "4K Ultra HD",
      audioTracks: "English (Dolby Atmos),English (Stereo),Español",
      subtitleTracks: "English [CC],Español,Français",
    },
  });

  const ep1 = await prisma.episode.create({
    data: {
      mediaItemId: chronicles.id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: "Protocol One: Escape",
      overview:
        "When an encrypted courier packet triggers a city-wide lockdown, operative Kael must extract the payload before tactical units seal the sector.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      duration: 15,
      introStart: 1,
      introEnd: 5,
      creditsStart: 11,
    },
  });

  await prisma.episode.createMany({
    data: [
      {
        mediaItemId: chronicles.id,
        seasonNumber: 1,
        episodeNumber: 2,
        title: "Afterburn",
        overview:
          "With communications jammed, the crew hijacks a high-bandwidth relay tower in the industrial district to broadcast the decoded telemetry.",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 15,
        introStart: 1,
        introEnd: 5,
        creditsStart: 11,
      },
      {
        mediaItemId: chronicles.id,
        seasonNumber: 1,
        episodeNumber: 3,
        title: "Neon Joyride",
        overview:
          "Pursued across the coastal highway, Maya deploys an experimental EMP countermeasures rig during a midnight convoy intercept.",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: 15,
        introStart: 1,
        introEnd: 5,
        creditsStart: 11,
      },
      {
        mediaItemId: chronicles.id,
        seasonNumber: 1,
        episodeNumber: 4,
        title: "System Meltdown",
        overview:
          "In the season finale, the team infiltrates the core vault in Amsterdam to confront the architect behind the directive.",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: 15,
        introStart: 1,
        introEnd: 5,
        creditsStart: 11,
      },
    ],
  });

  // 4. Register & Scan Default Local Media Folders (`media/movies` and `media/series`)
  const localMoviesDir = path.join(process.cwd(), "media", "movies");
  const localSeriesDir = path.join(process.cwd(), "media", "series");

  const moviesFolder = await prisma.libraryFolder.create({
    data: {
      name: "Local Movies (./media/movies)",
      path: localMoviesDir,
      mediaType: "MOVIE",
    },
  });

  const seriesFolder = await prisma.libraryFolder.create({
    data: {
      name: "Local TV Shows (./media/series)",
      path: localSeriesDir,
      mediaType: "SERIES",
    },
  });

  try {
    await scanLibraryFolder(moviesFolder.id);
    await scanLibraryFolder(seriesFolder.id);
  } catch (err) {
    console.error("Initial folder scan warning:", err);
  }

  // 5. Seed initial Continue Watching & My List if a profile already exists
  const firstProfile = await prisma.profile.findFirst();
  if (firstProfile) {
    await prisma.watchProgress.createMany({
      data: [
        {
          profileId: firstProfile.id,
          mediaItemId: sintel.id,
          positionSeconds: 245,
          durationSeconds: 888,
          completed: false,
        },
        {
          profileId: firstProfile.id,
          mediaItemId: chronicles.id,
          episodeId: ep1.id,
          positionSeconds: 6,
          durationSeconds: 15,
          completed: false,
        },
      ],
    });

    await prisma.myListItem.createMany({
      data: [
        {
          profileId: firstProfile.id,
          mediaItemId: tearsOfSteel.id,
        },
        {
          profileId: firstProfile.id,
          mediaItemId: chronicles.id,
        },
      ],
    });
  }
}
