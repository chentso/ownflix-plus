import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { prisma } from "./prisma";
import { fetchImdbMetadata } from "./imdb";
import { computeFileSignature, detectVideoIntro } from "./introDetector";

const execFileAsync = promisify(execFile);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mkv",
  ".webm",
  ".mov",
  ".avi",
  ".m4v",
  ".ts",
]);

interface ProbeInfo {
  duration: number;
  resolution: string;
  audioTracks: string;
  subtitleTracks: string;
}

const FALLBACK_BACKDROPS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
];

const FALLBACK_POSTERS = [
  "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function probeMediaFile(filePath: string): Promise<ProbeInfo> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        filePath,
      ],
      { timeout: 8000 }
    );
    const data = JSON.parse(stdout);
    const duration = Math.round(parseFloat(data?.format?.duration || "0")) || 0;

    let resolution = "1080p HD";
    const audioList: string[] = [];
    const subList: string[] = [];

    if (Array.isArray(data?.streams)) {
      for (const stream of data.streams) {
        if (stream.codec_type === "video") {
          const width = Number(stream.width || 0);
          if (width >= 3800) resolution = "4K Ultra HD";
          else if (width >= 1900) resolution = "1080p HD";
          else if (width >= 1200) resolution = "720p HD";
          else if (width > 0) resolution = "SD";
        } else if (stream.codec_type === "audio") {
          const lang =
            stream.tags?.language?.toUpperCase() ||
            `Track ${audioList.length + 1}`;
          const channels = stream.channels >= 6 ? "5.1 Surround" : "Stereo";
          const codec = (stream.codec_name || "Audio").toUpperCase();
          audioList.push(`${lang} (${codec} ${channels})`);
        } else if (stream.codec_type === "subtitle") {
          const lang =
            stream.tags?.language?.toUpperCase() ||
            stream.tags?.title ||
            `Subtitle ${subList.length + 1}`;
          subList.push(lang);
        }
      }
    }

    return {
      duration,
      resolution,
      audioTracks:
        audioList.length > 0 ? audioList.join(",") : "English (Stereo)",
      subtitleTracks: subList.length > 0 ? subList.join(",") : "English [CC]",
    };
  } catch {
    return {
      duration: 600,
      resolution: "1080p HD",
      audioTracks: "English (Stereo)",
      subtitleTracks: "English [CC]",
    };
  }
}

function toTitleCase(str: string): string {
  const minorWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "but",
    "or",
    "for",
    "nor",
    "on",
    "at",
    "to",
    "from",
    "by",
    "of",
    "in",
    "vs",
    "vs.",
  ]);
  return str
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function normalizeContractions(text: string): string {
  return text
    .replace(/\b([a-zA-Z]+)[._]s\b/gi, "$1's")
    .replace(/\b([a-zA-Z]+)[._]t\b/gi, "$1't")
    .replace(/\b([a-zA-Z]+)[._]re\b/gi, "$1're")
    .replace(/\b([a-zA-Z]+)[._]ve\b/gi, "$1've")
    .replace(/\b([a-zA-Z]+)[._]ll\b/gi, "$1'll")
    .replace(/\b([a-zA-Z]+)[._]d\b/gi, "$1'd");
}

export function normalizeTitleKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function cleanMediaTitle(rawName: string): {
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  episodeTitle?: string;
} {
  const withoutExt = rawName.replace(/\.[^/.]+$/, "");

  // Check for S01E01 or 1x01 pattern
  const tvMatch = withoutExt.match(
    /^(.*?)[.\s_-]*[Ss](\d{1,2})[Ee](\d{1,3})(?:[.\s_-]+(.*))?$/
  );
  if (tvMatch) {
    const rawShow = normalizeContractions(tvMatch[1]);
    const showTitle = toTitleCase(
      rawShow
        .replace(/[._]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );
    const season = parseInt(tvMatch[2], 10);
    const episode = parseInt(tvMatch[3], 10);

    const rawEp = (tvMatch[4] || "").replace(/[._]/g, " ").trim();
    const epCleaned = rawEp
      .replace(
        /\b(1080p|720p|2160p|4k|x264|x265|hevc|10bit|bluray|web-dl|webrip|web|hdtv|6ch|5\.1|aac|dts|rmteam|psa|rapidmoviez|eztv|yify|yts)\b.*/i,
        ""
      )
      .replace(/www\.[a-z0-9-]+\.[a-z]+/gi, "")
      .trim();

    const epTitle = epCleaned ? toTitleCase(epCleaned) : `Episode ${episode}`;

    const showYearMatch = showTitle.match(/\b((?:19|20)\d{2})\b/);
    const year = showYearMatch ? parseInt(showYearMatch[1], 10) : undefined;

    return {
      title: showTitle || "Unknown Series",
      year,
      season,
      episode,
      episodeTitle: epTitle,
    };
  }

  // Movie pattern: Title (2022) or Title.2022.1080p or Title_2025
  const yearMatch = withoutExt.match(
    /^(.*?)[.\s([_-]+((?:19|20)\d{2})(?:[\]).\s_-]|$)/
  );
  if (yearMatch) {
    const rawTitle = normalizeContractions(yearMatch[1]);
    const clean = toTitleCase(
      rawTitle.replace(/[._]/g, " ").replace(/\s+/g, " ").trim()
    );
    return {
      title: clean || withoutExt,
      year: parseInt(yearMatch[2], 10),
    };
  }

  const rawTitle = normalizeContractions(withoutExt);
  const stripped = toTitleCase(
    rawTitle
      .replace(
        /\b(1080p|720p|2160p|4k|x264|x265|hevc|10bit|bluray|web-dl|webrip|web|hdtv|hdr)\b.*/i,
        ""
      )
      .replace(/www\.[a-z0-9-]+\.[a-z]+/gi, "")
      .replace(/[._]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  return {
    title: stripped || withoutExt,
    year: undefined,
  };
}

function walkVideoFiles(
  dirPath: string,
  maxDepth = 4,
  currentDepth = 0
): string[] {
  if (currentDepth > maxDepth || !fs.existsSync(dirPath)) return [];
  const results: string[] = [];
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkVideoFiles(fullPath, maxDepth, currentDepth + 1));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VIDEO_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export async function scanLibraryFolder(folderId: string): Promise<{
  scannedFiles: number;
  addedMovies: number;
  addedEpisodes: number;
}> {
  const folder = await prisma.libraryFolder.findUnique({
    where: { id: folderId },
  });
  if (!folder) {
    throw new Error("Library folder not found");
  }

  if (!fs.existsSync(folder.path)) {
    fs.mkdirSync(folder.path, { recursive: true });
  }

  const videoFiles = walkVideoFiles(folder.path);
  let addedMovies = 0;
  let addedEpisodes = 0;

  for (const filePath of videoFiles) {
    const fileName = path.basename(filePath);
    const parsed = cleanMediaTitle(fileName);
    const isEpisode =
      folder.mediaType === "SERIES" ||
      (folder.mediaType === "MIXED" &&
        parsed.season !== undefined &&
        parsed.episode !== undefined);

    const currentSig = computeFileSignature(filePath);
    const idx = hashString(parsed.title);
    const defaultPoster = FALLBACK_POSTERS[idx % FALLBACK_POSTERS.length];
    const defaultBackdrop = FALLBACK_BACKDROPS[idx % FALLBACK_BACKDROPS.length];

    if (isEpisode) {
      const seasonNum = parsed.season ?? 1;
      const episodeNum = parsed.episode ?? 1;

      // Extract show directory and folder-based series title
      const relPath = path.relative(folder.path, filePath);
      const pathParts = relPath.split(path.sep);
      let seriesDir: string | undefined;
      let effectiveSeriesTitle = parsed.title;

      if (pathParts.length > 1) {
        seriesDir = path.join(folder.path, pathParts[0]);
        const cleanedFolderName = toTitleCase(
          normalizeContractions(pathParts[0])
            .replace(/[._]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        );
        if (cleanedFolderName) {
          effectiveSeriesTitle = cleanedFolderName;
        }
      }

      let series: any = null;

      // 1. Check if any sibling episode in the same show directory is already attached to a series
      if (seriesDir) {
        const existingSibling = await prisma.episode.findFirst({
          where: {
            filePath: {
              startsWith: seriesDir,
            },
          },
          include: {
            mediaItem: true,
          },
        });
        if (existingSibling?.mediaItem) {
          series = existingSibling.mediaItem;
        }
      }

      // 2. Exact title match
      if (!series) {
        series = await prisma.mediaItem.findFirst({
          where: {
            title: effectiveSeriesTitle,
            type: "SERIES",
          },
        });
      }

      // 3. Fuzzy normalized title match against existing SERIES in DB
      if (!series) {
        const allSeries = await prisma.mediaItem.findMany({
          where: { type: "SERIES" },
        });
        const targetKey = normalizeTitleKey(effectiveSeriesTitle);
        series =
          allSeries.find((s) => normalizeTitleKey(s.title) === targetKey) ||
          null;
      }

      // 4. Create new series if none found
      if (!series) {
        const probe = await probeMediaFile(filePath);
        const imdb = await fetchImdbMetadata(
          effectiveSeriesTitle,
          parsed.year,
          "SERIES"
        );
        series = await prisma.mediaItem.create({
          data: {
            title: imdb?.title || effectiveSeriesTitle,
            overview:
              imdb?.overview ||
              `Local series scanned from ${folder.name} (${path.dirname(
                filePath
              )}). Streamed directly from your disk.`,
            tagline: imdb?.tagline || `Local Series • ${probe.resolution}`,
            type: "SERIES",
            releaseYear: imdb?.year || parsed.year || new Date().getFullYear(),
            maturityRating: imdb?.maturityRating || "TV-14",
            genres: imdb?.genres || "Local Library, Drama, Series",
            cast: imdb?.cast || "Local Media Collection",
            director: imdb?.director || null,
            posterUrl: imdb?.posterUrl || defaultPoster,
            backdropUrl: imdb?.backdropUrl || defaultBackdrop,
            duration: probe.duration,
            resolution: probe.resolution,
            audioTracks: probe.audioTracks,
            subtitleTracks: probe.subtitleTracks,
            matchScore: imdb?.matchScore || 95,
          },
        });
      }

      const existingEp = await prisma.episode.findFirst({
        where: { filePath },
      });

      if (existingEp) {
        // Ensure episode is linked to authoritative series
        if (existingEp.mediaItemId !== series.id) {
          await prisma.episode.update({
            where: { id: existingEp.id },
            data: { mediaItemId: series.id },
          });
        }

        // Caching: Only re-process if the video file has completely changed on disk
        const fileHasChanged =
          !existingEp.fileSignature || existingEp.fileSignature !== currentSig;

        if (fileHasChanged) {
          const probe = await probeMediaFile(filePath);
          const siblingPaths = videoFiles.filter(
            (p) =>
              p !== filePath &&
              (seriesDir
                ? p.startsWith(seriesDir)
                : normalizeTitleKey(cleanMediaTitle(path.basename(p)).title) ===
                  normalizeTitleKey(effectiveSeriesTitle))
          );
          const intro = await detectVideoIntro(filePath, probe.duration, {
            isSeries: true,
            siblingEpisodeFilePaths: siblingPaths,
          });

          await prisma.episode.update({
            where: { id: existingEp.id },
            data: {
              fileSignature: currentSig,
              duration: probe.duration,
              introStart: intro.introStart,
              introEnd: intro.introEnd,
              creditsStart: intro.creditsStart,
            },
          });
        }
        // If fileHasChanged === false: file is identical, skip all intro processing
      } else {
        // New episode detected: probe media and run smart intro detection
        const probe = await probeMediaFile(filePath);
        const siblingPaths = videoFiles.filter(
          (p) =>
            p !== filePath &&
            (seriesDir
              ? p.startsWith(seriesDir)
              : normalizeTitleKey(cleanMediaTitle(path.basename(p)).title) ===
                normalizeTitleKey(effectiveSeriesTitle))
        );
        const intro = await detectVideoIntro(filePath, probe.duration, {
          isSeries: true,
          siblingEpisodeFilePaths: siblingPaths,
        });

        const epCreated = await prisma.episode.create({
          data: {
            mediaItemId: series.id,
            seasonNumber: seasonNum,
            episodeNumber: episodeNum,
            title: parsed.episodeTitle || `Episode ${episodeNum}`,
            overview: `Local file: ${fileName} (${probe.resolution})`,
            thumbnailUrl: series.backdropUrl || defaultBackdrop,
            videoUrl: "",
            filePath,
            fileSignature: currentSig,
            duration: probe.duration,
            introStart: intro.introStart,
            introEnd: intro.introEnd,
            creditsStart: intro.creditsStart,
          },
        });

        await prisma.episode.update({
          where: { id: epCreated.id },
          data: {
            videoUrl: `/api/stream?episodeId=${epCreated.id}`,
          },
        });
        addedEpisodes++;
      }
    } else {
      // Movie
      const existingMovie = await prisma.mediaItem.findFirst({
        where: { filePath },
      });

      if (existingMovie) {
        // Caching: Only re-process if the video file has completely changed on disk
        const fileHasChanged =
          !existingMovie.fileSignature ||
          existingMovie.fileSignature !== currentSig;

        if (fileHasChanged) {
          const probe = await probeMediaFile(filePath);
          const intro = await detectVideoIntro(filePath, probe.duration, {
            isSeries: false,
          });

          await prisma.mediaItem.update({
            where: { id: existingMovie.id },
            data: {
              fileSignature: currentSig,
              duration: probe.duration,
              resolution: probe.resolution,
              audioTracks: probe.audioTracks,
              subtitleTracks: probe.subtitleTracks,
              introStart: intro.introStart,
              introEnd: intro.introEnd,
              creditsStart: intro.creditsStart,
            },
          });
        }

        // Also check if metadata placeholder needs enrichment
        if (
          existingMovie.cast === "Local Media Collection" ||
          existingMovie.posterUrl.includes("images.unsplash.com")
        ) {
          const imdb = await fetchImdbMetadata(parsed.title, parsed.year);
          if (imdb) {
            await prisma.mediaItem.update({
              where: { id: existingMovie.id },
              data: {
                title: imdb.title,
                overview: imdb.overview,
                tagline: imdb.tagline || existingMovie.tagline,
                releaseYear: imdb.year,
                maturityRating: imdb.maturityRating,
                genres: imdb.genres,
                cast: imdb.cast,
                director: imdb.director,
                posterUrl: imdb.posterUrl,
                backdropUrl: imdb.backdropUrl,
                matchScore: imdb.matchScore,
              },
            });
          }
        }
      } else {
        // New movie detected: probe media and run smart intro detection
        const probe = await probeMediaFile(filePath);
        const intro = await detectVideoIntro(filePath, probe.duration, {
          isSeries: false,
        });
        const imdb = await fetchImdbMetadata(parsed.title, parsed.year);

        const created = await prisma.mediaItem.create({
          data: {
            title: imdb?.title || parsed.title,
            overview:
              imdb?.overview ||
              `Scanned from local folder "${folder.name}" (${fileName}). Direct byte-range / FFmpeg streaming enabled.`,
            tagline: imdb?.tagline || `Local Media • ${probe.resolution}`,
            type: "MOVIE",
            releaseYear: imdb?.year || parsed.year,
            maturityRating: imdb?.maturityRating || "PG-13",
            genres: imdb?.genres || "Local Library, Movies",
            cast: imdb?.cast || "Local Media Collection",
            director: imdb?.director || "Local Library",
            posterUrl: imdb?.posterUrl || defaultPoster,
            backdropUrl: imdb?.backdropUrl || defaultBackdrop,
            filePath,
            fileSignature: currentSig,
            duration: probe.duration,
            introStart: intro.introStart,
            introEnd: intro.introEnd,
            creditsStart: intro.creditsStart,
            resolution: probe.resolution,
            audioTracks: probe.audioTracks,
            subtitleTracks: probe.subtitleTracks,
            matchScore: imdb?.matchScore || 97,
          },
        });

        await prisma.mediaItem.update({
          where: { id: created.id },
          data: {
            videoUrl: `/api/stream?mediaId=${created.id}`,
          },
        });
        addedMovies++;
      }
    }
  }

  await prisma.libraryFolder.update({
    where: { id: folder.id },
    data: {
      lastScannedAt: new Date(),
      itemCount: videoFiles.length,
    },
  });

  return {
    scannedFiles: videoFiles.length,
    addedMovies,
    addedEpisodes,
  };
}
