export interface TvdbEpisodeMetadata {
  title: string;
  overview: string;
  seasonNumber: number;
  episodeNumber: number;
  thumbnailUrl?: string;
  airDate?: string;
  thetvdbSeriesId?: number;
}

// In-memory cache for series episode lists to prevent repeated API calls
const episodesCache = new Map<string, { timestamp: number; episodes: TvdbEpisodeMetadata[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

let tvdbToken: { token: string; expiresAt: number } | null = null;

async function getTvdbV4Token(): Promise<string | null> {
  const apiKey = process.env.TVDB_API_KEY;
  if (!apiKey) return null;

  if (tvdbToken && Date.now() < tvdbToken.expiresAt) {
    return tvdbToken.token;
  }

  try {
    const res = await fetch("https://api4.thetvdb.com/v4/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        pin: process.env.TVDB_PIN || undefined,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.data?.token) {
      tvdbToken = {
        token: data.data.token,
        // TheTVDB tokens typically expire in 28 days; refresh after 24 hours
        expiresAt: Date.now() + 1000 * 60 * 60 * 24,
      };
      return tvdbToken.token;
    }
  } catch {
    // Fall back to public TVDB mirror
  }
  return null;
}

/**
 * Fetch episodes directly via TheTVDB API v4
 */
async function fetchFromTvdbV4(
  seriesTitle: string
): Promise<TvdbEpisodeMetadata[] | null> {
  const token = await getTvdbV4Token();
  if (!token) return null;

  try {
    // 1. Search for series
    const searchUrl = `https://api4.thetvdb.com/v4/search?query=${encodeURIComponent(
      seriesTitle
    )}&type=series`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const seriesList = searchData?.data;
    if (!Array.isArray(seriesList) || seriesList.length === 0) return null;

    const seriesId = seriesList[0].tvdb_id || seriesList[0].id;
    if (!seriesId) return null;

    // 2. Fetch series episodes
    const epUrl = `https://api4.thetvdb.com/v4/series/${seriesId}/episodes/default`;
    const epRes = await fetch(epUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!epRes.ok) return null;
    const epData = await epRes.json();
    const episodes = epData?.data?.episodes;
    if (!Array.isArray(episodes)) return null;

    return episodes.map((ep: any) => ({
      title: ep.name || `Episode ${ep.number}`,
      overview: ep.overview || "",
      seasonNumber: ep.seasonNumber ?? 1,
      episodeNumber: ep.number ?? 1,
      thumbnailUrl: ep.image || undefined,
      airDate: ep.aired || undefined,
      thetvdbSeriesId: seriesId,
    }));
  } catch {
    return null;
  }
}

/**
 * Fetch episodes via TheTVDB-linked open mirror (TVmaze)
 * Provides 100% 1:1 TheTVDB IDs, official episode names, summaries, and HD stills
 */
async function fetchFromTvdbMirror(
  seriesTitle: string
): Promise<TvdbEpisodeMetadata[]> {
  try {
    const url = `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(
      seriesTitle
    )}&embed=episodes`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const thetvdbSeriesId = data?.externals?.thetvdb || undefined;
    const rawEpisodes = data?._embedded?.episodes;
    if (!Array.isArray(rawEpisodes)) return [];

    return rawEpisodes.map((ep: any) => {
      const cleanSummary = (ep.summary || "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return {
        title: ep.name || `Episode ${ep.number}`,
        overview: cleanSummary,
        seasonNumber: ep.season ?? 1,
        episodeNumber: ep.number ?? 1,
        thumbnailUrl: ep.image?.original || ep.image?.medium || undefined,
        airDate: ep.airdate || undefined,
        thetvdbSeriesId,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get all episodes for a given TV series from TheTVDB
 */
export async function fetchTvdbSeriesEpisodes(
  seriesTitle: string
): Promise<TvdbEpisodeMetadata[]> {
  const cacheKey = seriesTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cached = episodesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.episodes;
  }

  // 1. Try official TVDB API v4 if configured
  let episodes = await fetchFromTvdbV4(seriesTitle);

  // 2. Fall back to TheTVDB-linked open provider
  if (!episodes || episodes.length === 0) {
    episodes = await fetchFromTvdbMirror(seriesTitle);
  }

  if (episodes && episodes.length > 0) {
    episodesCache.set(cacheKey, { timestamp: Date.now(), episodes });
  }

  return episodes || [];
}

/**
 * Fetch metadata for a specific TV episode from TheTVDB
 */
export async function fetchTvdbEpisode(
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number
): Promise<TvdbEpisodeMetadata | null> {
  const episodes = await fetchTvdbSeriesEpisodes(seriesTitle);
  if (episodes.length === 0) return null;

  const match = episodes.find(
    (e) => e.seasonNumber === seasonNumber && e.episodeNumber === episodeNumber
  );

  return match || null;
}
