export interface Profile {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon: string;
  hasPassword: boolean;
  isKids: boolean;
  isAdmin: boolean;
}

export interface Episode {
  id: string;
  mediaItemId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview: string;
  thumbnailUrl: string;
  videoUrl: string;
  filePath: string | null;
  fileSignature?: string | null;
  duration: number;
  introStart: number | null;
  introEnd: number | null;
  creditsStart: number | null;
}

export interface WatchProgress {
  id: string;
  profileId: string;
  mediaItemId: string;
  episodeId: string | null;
  episode?: Episode | null;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  title: string;
  overview: string;
  tagline: string | null;
  type: "MOVIE" | "SERIES";
  releaseYear: number;
  maturityRating: string;
  genres: string;
  cast: string;
  director: string | null;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string | null;
  filePath: string | null;
  fileSignature?: string | null;
  duration: number;
  introStart: number | null;
  introEnd: number | null;
  creditsStart: number | null;
  matchScore: number;
  isFeatured: boolean;
  audioTracks: string;
  subtitleTracks: string;
  resolution: string;
  episodes: Episode[];
  progress: WatchProgress | null;
  inMyList: boolean;
}

export interface LibraryFolder {
  id: string;
  name: string;
  path: string;
  mediaType: "MOVIE" | "SERIES" | "MIXED";
  profileId: string | null;
  profile?: {
    id: string;
    name: string;
    avatarColor: string;
    avatarIcon: string;
  } | null;
  lastScannedAt: string | null;
  itemCount: number;
}

export interface ActivityLogItem {
  id: string;
  profileId: string;
  profile: {
    id: string;
    name: string;
    avatarColor: string;
    avatarIcon: string;
    isKids: boolean;
  };
  action: string;
  details: string;
  mediaItemId: string | null;
  mediaTitle: string | null;
  ipAddress: string | null;
  createdAt: string;
}
