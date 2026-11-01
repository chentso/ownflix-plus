import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface IntroDetectionResult {
  introStart: number | null;
  introEnd: number | null;
  creditsStart: number | null;
  method:
    | "chapter"
    | "subtitles"
    | "audio-cross-correlation"
    | "silence-boundary"
    | "fallback";
  confidence: number;
}

/**
 * Generates a stable signature of a local file (<size>:<mtimeMs>).
 * If the file is modified, re-encoded, or replaced, this signature will change.
 */
export function computeFileSignature(filePath: string): string | null {
  try {
    const stat = fs.statSync(filePath);
    return `${stat.size}:${Math.floor(stat.mtimeMs)}`;
  } catch {
    return null;
  }
}

/**
 * Tier 1: Check embedded chapter markers in video file (ffprobe)
 */
async function detectFromChapters(
  filePath: string,
  duration: number
): Promise<IntroDetectionResult | null> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_chapters",
        filePath,
      ],
      { timeout: 7000 }
    );
    const data = JSON.parse(stdout);
    const chapters = Array.isArray(data?.chapters) ? data.chapters : [];

    if (chapters.length === 0) return null;

    let detectedIntroStart: number | null = null;
    let detectedIntroEnd: number | null = null;
    let detectedCreditsStart: number | null = null;

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const startSec = Math.max(0, Math.floor(parseFloat(ch.start_time || "0")));
      const endSec = Math.floor(parseFloat(ch.end_time || "0"));
      const title = String(
        ch.tags?.title || ch.tags?.name || ch.tags?.chapter_name || ""
      ).trim();

      // Check for Intro / Opening / Title tags
      if (
        /\b(intro|opening|op\b|theme|main\s*title|title\s*sequence)\b/i.test(title)
      ) {
        if (endSec > startSec && endSec - startSec >= 15 && endSec - startSec <= 180) {
          detectedIntroStart = startSec;
          detectedIntroEnd = endSec;
        }
      }

      // Check for Credits / Outro / Ending tags
      if (/\b(credits|ending|ed\b|outro|end\s*credits)\b/i.test(title)) {
        if (startSec > 30) {
          detectedCreditsStart = startSec;
        }
      }

      // Generic chapter detection fallback (e.g. Anime / TV Chapter 2 or Chapter 1)
      if (
        detectedIntroStart === null &&
        i <= 2 &&
        startSec <= 240 &&
        endSec - startSec >= 50 &&
        endSec - startSec <= 100
      ) {
        // High likelihood of standard 60s or 90s opening theme
        detectedIntroStart = startSec;
        detectedIntroEnd = endSec;
      }
    }

    if (detectedIntroStart !== null && detectedIntroEnd !== null) {
      return {
        introStart: detectedIntroStart,
        introEnd: detectedIntroEnd,
        creditsStart:
          detectedCreditsStart ??
          (duration > 120 ? Math.max(duration - 40, 60) : null),
        method: "chapter",
        confidence: 0.98,
      };
    }

    if (detectedCreditsStart !== null) {
      return {
        introStart: null,
        introEnd: null,
        creditsStart: detectedCreditsStart,
        method: "chapter",
        confidence: 0.9,
      };
    }
  } catch {
    // Ignore and proceed to next tier
  }
  return null;
}

/**
 * Tier 2: Check embedded or sidecar subtitles for theme song musical cues (♪, ♫, [theme])
 */
async function detectFromSubtitles(
  filePath: string,
  duration: number
): Promise<IntroDetectionResult | null> {
  try {
    // 1. Check sidecar .srt or .vtt in same directory
    const dir = path.dirname(filePath);
    const baseWithoutExt = path.basename(filePath, path.extname(filePath));
    const potentialSubs = [
      path.join(dir, `${baseWithoutExt}.srt`),
      path.join(dir, `${baseWithoutExt}.vtt`),
      path.join(dir, `${baseWithoutExt}.en.srt`),
      path.join(dir, `${baseWithoutExt}.en.vtt`),
    ];

    let subText = "";
    for (const p of potentialSubs) {
      if (fs.existsSync(p)) {
        try {
          subText = fs.readFileSync(p, "utf-8");
          break;
        } catch {}
      }
    }

    // 2. If no sidecar, extract first 10 minutes of subtitles via ffmpeg
    if (!subText) {
      const { stdout } = await execFileAsync(
        "ffmpeg",
        [
          "-ss",
          "0",
          "-t",
          "600",
          "-i",
          filePath,
          "-map",
          "0:s:0?",
          "-f",
          "webvtt",
          "pipe:1",
        ],
        { timeout: 5000, maxBuffer: 4 * 1024 * 1024 }
      ).catch(() => ({ stdout: "" }));
      subText = stdout || "";
    }

    if (!subText) return null;

    // Parse VTT/SRT lines looking for musical notes or theme keywords
    const timestampRegex =
      /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})/g;
    const blocks: { start: number; end: number; text: string }[] = [];

    const lines = subText.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(
        /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})/
      );
      if (match) {
        const start =
          parseInt(match[1], 10) * 3600 +
          parseInt(match[2], 10) * 60 +
          parseInt(match[3], 10) +
          parseInt(match[4], 10) / 1000;
        const end =
          parseInt(match[5], 10) * 3600 +
          parseInt(match[6], 10) * 60 +
          parseInt(match[7], 10) +
          parseInt(match[8], 10) / 1000;

        let content = "";
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (!lines[j].trim() || lines[j].includes("-->")) break;
          content += " " + lines[j].trim();
        }
        blocks.push({ start, end, text: content });
      }
    }

    // Filter cues with musical notes or theme descriptions within the first 8 minutes (480s)
    const musicCues = blocks.filter(
      (b) =>
        b.start <= 480 &&
        (/[♪♫]|theme\s*music|opening\s*theme|theme\s*song/i.test(b.text))
    );

    if (musicCues.length >= 2) {
      const first = musicCues[0].start;
      const last = musicCues[musicCues.length - 1].end;
      const cueDuration = last - first;

      if (cueDuration >= 20 && cueDuration <= 130) {
        return {
          introStart: Math.max(0, Math.floor(first)),
          introEnd: Math.ceil(last),
          creditsStart:
            duration > 120 ? Math.max(duration - 40, 60) : null,
          method: "subtitles",
          confidence: 0.92,
        };
      }
    }
  } catch {
    // Ignore and proceed
  }
  return null;
}

/**
 * Extracts 1000Hz downsampled mono audio RMS envelope (10 buckets per second)
 */
async function extractAudioEnergyEnvelope(
  filePath: string,
  maxSeconds = 420
): Promise<Float32Array | null> {
  try {
    const { stdout } = await execFileAsync(
      "ffmpeg",
      [
        "-ss",
        "0",
        "-t",
        String(maxSeconds),
        "-i",
        filePath,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "1000",
        "-f",
        "f32le",
        "pipe:1",
      ],
      { encoding: "buffer", maxBuffer: 10 * 1024 * 1024, timeout: 6000 }
    );

    const samples = new Float32Array(
      stdout.buffer,
      stdout.byteOffset,
      stdout.length / 4
    );

    if (samples.length === 0) return null;

    // Bucket into 100ms intervals (100 samples per bucket)
    const bucketSize = 100;
    const bucketCount = Math.floor(samples.length / bucketSize);
    const envelope = new Float32Array(bucketCount);

    for (let b = 0; b < bucketCount; b++) {
      let sumSq = 0;
      const offset = b * bucketSize;
      for (let i = 0; i < bucketSize; i++) {
        const val = samples[offset + i];
        sumSq += val * val;
      }
      envelope[b] = Math.sqrt(sumSq / bucketSize);
    }

    return envelope;
  } catch {
    return null;
  }
}

/**
 * Tier 3: Multi-Episode Audio Cross-Correlation (Plex / Jellyfin Style)
 * Finds the exact matching audio window across TV episodes in the same series.
 */
async function detectFromAudioCorrelation(
  filePath: string,
  siblingFilePaths: string[],
  duration: number
): Promise<IntroDetectionResult | null> {
  try {
    if (!siblingFilePaths || siblingFilePaths.length === 0) return null;

    // Pick first sibling that exists on disk
    const siblingPath = siblingFilePaths.find(
      (p) => p !== filePath && fs.existsSync(p)
    );
    if (!siblingPath) return null;

    const [envA, envB] = await Promise.all([
      extractAudioEnergyEnvelope(filePath, 360),
      extractAudioEnergyEnvelope(siblingPath, 360),
    ]);

    if (!envA || !envB || envA.length < 300 || envB.length < 300) return null;

    // Slide correlation window of length 30s to 90s (300 to 900 buckets)
    // with 0.5s step (5 buckets)
    let bestScore = -1;
    let bestStartA = 0;
    let bestLengthSec = 35;

    const testDurations = [30, 45, 60, 75, 90]; // common intro lengths in seconds

    for (const testSec of testDurations) {
      const windowLen = testSec * 10;
      if (envA.length < windowLen || envB.length < windowLen) continue;

      // Check offsets in first 4 minutes (2400 buckets)
      for (let offsetA = 0; offsetA < Math.min(2400, envA.length - windowLen); offsetA += 50) {
        // Compute mean & norm of window in A
        let sumA = 0;
        let sumSqA = 0;
        for (let i = 0; i < windowLen; i++) {
          const val = envA[offsetA + i];
          sumA += val;
          sumSqA += val * val;
        }
        const meanA = sumA / windowLen;
        const varA = Math.max(1e-6, sumSqA - sumA * meanA);

        // Quick energy check — silent windows cannot be intros
        if (meanA < 0.015) continue;

        for (let offsetB = 0; offsetB < Math.min(2400, envB.length - windowLen); offsetB += 50) {
          let sumB = 0;
          let sumSqB = 0;
          let dot = 0;

          for (let i = 0; i < windowLen; i++) {
            const a = envA[offsetA + i];
            const b = envB[offsetB + i];
            sumB += b;
            sumSqB += b * b;
            dot += (a - meanA) * b;
          }

          const meanB = sumB / windowLen;
          const varB = Math.max(1e-6, sumSqB - sumB * meanB);
          const r = dot / Math.sqrt(varA * varB);

          if (r > bestScore) {
            bestScore = r;
            bestStartA = offsetA / 10;
            bestLengthSec = testSec;
          }
        }
      }
    }

    if (bestScore > 0.72) {
      const startSec = Math.round(bestStartA);
      const endSec = Math.round(bestStartA + bestLengthSec);

      return {
        introStart: Math.max(0, startSec),
        introEnd: Math.min(Math.floor(duration), endSec),
        creditsStart:
          duration > 120 ? Math.max(duration - 40, 60) : null,
        method: "audio-cross-correlation",
        confidence: Math.min(0.96, bestScore),
      };
    }
  } catch {
    // Proceed to silence detection
  }
  return null;
}

/**
 * Tier 4: Silence & Transition Boundary Analysis (ffmpeg silencedetect)
 */
async function detectFromSilenceBoundaries(
  filePath: string,
  duration: number
): Promise<IntroDetectionResult | null> {
  try {
    const { stderr } = await execFileAsync(
      "ffmpeg",
      [
        "-ss",
        "0",
        "-t",
        "300",
        "-i",
        filePath,
        "-vn",
        "-af",
        "silencedetect=noise=-28dB:d=0.25",
        "-f",
        "null",
        "-",
      ],
      { timeout: 7000 }
    );

    const silenceIntervals: { start: number; end: number }[] = [];
    const lines = stderr.split(/\r?\n/);
    let currentStart: number | null = null;

    for (const line of lines) {
      const startMatch = line.match(/silence_start:\s*([0-9.]+)/);
      if (startMatch) {
        currentStart = parseFloat(startMatch[1]);
      }
      const endMatch = line.match(/silence_end:\s*([0-9.]+)/);
      if (endMatch && currentStart !== null) {
        const end = parseFloat(endMatch[1]);
        silenceIntervals.push({ start: currentStart, end });
        currentStart = null;
      }
    }

    // Look for a pair of silence intervals separated by 20s to 120s
    for (let i = 0; i < silenceIntervals.length - 1; i++) {
      const g1 = silenceIntervals[i];
      for (let j = i + 1; j < silenceIntervals.length; j++) {
        const g2 = silenceIntervals[j];
        const span = g2.start - g1.end;
        if (span >= 20 && span <= 110 && g1.end <= 200) {
          return {
            introStart: Math.round(g1.end),
            introEnd: Math.round(g2.start),
            creditsStart:
              duration > 120 ? Math.max(duration - 40, 60) : null,
            method: "silence-boundary",
            confidence: 0.78,
          };
        }
      }
    }
  } catch {
    // Fallback
  }
  return null;
}

/**
 * Master Smart Intro Pre-Processor:
 * Automatically inspects the media file through a hierarchy of intelligent analyzers:
 * 1. Embedded Chapter Markers (Opening / Intro tags)
 * 2. Subtitle Musical / Theme cues (♪, ♫)
 * 3. Multi-Episode Audio Cross-Correlation (Plex/Jellyfin algorithm)
 * 4. Silence & Scene Transition Boundaries
 * 5. Duration-Proportional Fallback
 */
export async function detectVideoIntro(
  filePath: string,
  duration: number,
  options: {
    isSeries?: boolean;
    siblingEpisodeFilePaths?: string[];
  } = {}
): Promise<IntroDetectionResult> {
  // If file does not exist on disk, return sensible fallback
  if (!fs.existsSync(filePath)) {
    return {
      introStart: duration > 120 ? 10 : null,
      introEnd: duration > 120 ? 45 : null,
      creditsStart: duration > 120 ? Math.max(duration - 40, 60) : null,
      method: "fallback",
      confidence: 0.5,
    };
  }

  // Tier 1: Chapter Markers (Instant & High Accuracy)
  const chapterResult = await detectFromChapters(filePath, duration);
  if (chapterResult && chapterResult.introStart !== null) {
    return chapterResult;
  }

  // Tier 2: Subtitle Musical Cues
  const subResult = await detectFromSubtitles(filePath, duration);
  if (subResult && subResult.introStart !== null) {
    return subResult;
  }

  // Tier 3: Multi-Episode Audio Correlation (for TV series)
  if (
    options.isSeries &&
    options.siblingEpisodeFilePaths &&
    options.siblingEpisodeFilePaths.length > 0
  ) {
    const audioResult = await detectFromAudioCorrelation(
      filePath,
      options.siblingEpisodeFilePaths,
      duration
    );
    if (audioResult && audioResult.introStart !== null) {
      return audioResult;
    }
  }

  // Tier 4: Silence & Transition Boundaries
  const silenceResult = await detectFromSilenceBoundaries(filePath, duration);
  if (silenceResult && silenceResult.introStart !== null) {
    return silenceResult;
  }

  // Tier 5: Intelligent Fallback
  const isSeries = options.isSeries ?? false;
  const introStart = duration > 120 ? (isSeries ? 5 : 10) : null;
  const introEnd = duration > 120 ? (isSeries ? 40 : 45) : null;
  const creditsStart =
    chapterResult?.creditsStart ??
    (duration > 120 ? Math.max(duration - 40, 60) : null);

  return {
    introStart,
    introEnd,
    creditsStart,
    method: "fallback",
    confidence: 0.5,
  };
}
