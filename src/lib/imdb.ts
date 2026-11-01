export interface ImdbMetadata {
  imdbId: string;
  title: string;
  year: number;
  overview: string;
  tagline: string | null;
  maturityRating: string;
  imdbRating: number | null;
  matchScore: number;
  genres: string;
  cast: string;
  director: string | null;
  posterUrl: string;
  backdropUrl: string;
}

export interface SuggestionItem {
  id: string;
  l: string;
  q?: string;
  qid?: string;
  y?: number;
  s?: string;
  i?: {
    imageUrl: string;
    width: number;
    height: number;
  };
}

export async function searchImdbCandidates(
  query: string,
  preferredYear?: number
): Promise<SuggestionItem[]> {
  const cleanQuery = query
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleanQuery) return [];

  const searchTerms =
    preferredYear && preferredYear > 1900
      ? [`${cleanQuery} ${preferredYear}`, cleanQuery]
      : [cleanQuery];

  for (const term of searchTerms) {
    try {
      const url = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(
        term
      )}.json`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const items: SuggestionItem[] = Array.isArray(data?.d)
        ? data.d.filter(
            (item: SuggestionItem) =>
              typeof item?.id === "string" && item.id.startsWith("tt")
          )
        : [];
      if (items.length > 0) {
        if (preferredYear) {
          items.sort((a, b) => {
            const diffA = a.y ? Math.abs(a.y - preferredYear) : 999;
            const diffB = b.y ? Math.abs(b.y - preferredYear) : 999;
            return diffA - diffB;
          });
        }
        return items;
      }
    } catch {
      // Try next term
    }
  }

  return [];
}

export async function fetchImdbById(
  imdbId: string,
  fallbackSuggestion?: SuggestionItem
): Promise<ImdbMetadata | null> {
  try {
    const gqlQuery = {
      query: `{
        title(id: "${imdbId}") {
          id
          titleText { text }
          releaseYear { year }
          plot { plotText { plainText } }
          taglines(first: 1) { edges { node { text } } }
          certificate { rating }
          ratingsSummary { aggregateRating }
          titleGenres { genres { genre { text } } }
          primaryImage { url width height }
          images(first: 12) { edges { node { url width height } } }
          principalCredits {
            category { text }
            credits { name { nameText { text } } }
          }
        }
      }`,
    };

    const res = await fetch("https://caching.graphql.imdb.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-imdb-client-name": "imdb-web-next",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(gqlQuery),
    });

    if (!res.ok) {
      throw new Error(`IMDb GraphQL returned ${res.status}`);
    }

    const json = await res.json();
    const t = json?.data?.title;
    if (!t) {
      throw new Error("No title node in IMDb GraphQL response");
    }

    const title = t.titleText?.text || fallbackSuggestion?.l || "Unknown Title";
    const year = t.releaseYear?.year || fallbackSuggestion?.y || 2024;
    const overview =
      t.plot?.plotText?.plainText ||
      `Official IMDb presentation of ${title} (${year}).`;
    const tagline = t.taglines?.edges?.[0]?.node?.text || null;
    const maturityRating = t.certificate?.rating || "PG-13";
    const imdbRating: number | null =
      typeof t.ratingsSummary?.aggregateRating === "number"
        ? t.ratingsSummary.aggregateRating
        : null;

    const matchScore = imdbRating
      ? Math.min(99, Math.max(82, Math.round(imdbRating * 10 + 14)))
      : 95;

    const genresList: string[] = Array.isArray(t.titleGenres?.genres)
      ? t.titleGenres.genres
          .map((g: { genre?: { text?: string } }) => g?.genre?.text)
          .filter(Boolean)
      : [];
    const genres = genresList.length > 0 ? genresList.join(", ") : "Drama, Film";

    let director: string | null = null;
    let cast = fallbackSuggestion?.s || "";

    if (Array.isArray(t.principalCredits)) {
      for (const group of t.principalCredits) {
        const cat = (group?.category?.text || "").toLowerCase();
        const names = Array.isArray(group?.credits)
          ? group.credits
              .map(
                (c: { name?: { nameText?: { text?: string } } }) =>
                  c?.name?.nameText?.text
              )
              .filter(Boolean)
          : [];
        if (cat.includes("director") && names.length > 0) {
          director = names.join(", ");
        } else if (
          (cat.includes("star") || cat.includes("actor") || cat.includes("cast")) &&
          names.length > 0
        ) {
          cast = names.join(", ");
        }
      }
    }

    const posterUrl =
      t.primaryImage?.url ||
      fallbackSuggestion?.i?.imageUrl ||
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80";

    // Pick a high-res landscape still image from IMDb images gallery for the 16:9 backdrop
    let backdropUrl = posterUrl;
    if (Array.isArray(t.images?.edges)) {
      const landscapeNode = t.images.edges
        .map(
          (e: { node?: { url?: string; width?: number; height?: number } }) =>
            e?.node
        )
        .find(
          (node: { url?: string; width?: number; height?: number } | undefined) =>
            node?.url &&
            typeof node.width === "number" &&
            typeof node.height === "number" &&
            node.width > node.height &&
            node.width >= 700
        );
      if (landscapeNode?.url) {
        backdropUrl = landscapeNode.url;
      }
    }

    return {
      imdbId,
      title,
      year,
      overview,
      tagline,
      maturityRating,
      imdbRating,
      matchScore,
      genres,
      cast,
      director,
      posterUrl,
      backdropUrl,
    };
  } catch {
    if (fallbackSuggestion) {
      return {
        imdbId: fallbackSuggestion.id,
        title: fallbackSuggestion.l,
        year: fallbackSuggestion.y || 2024,
        overview: `Starring ${fallbackSuggestion.s || "ensemble cast"}.`,
        tagline: null,
        maturityRating: "PG-13",
        imdbRating: null,
        matchScore: 94,
        genres: "Drama, Movies",
        cast: fallbackSuggestion.s || "",
        director: null,
        posterUrl:
          fallbackSuggestion.i?.imageUrl ||
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
        backdropUrl:
          fallbackSuggestion.i?.imageUrl ||
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80",
      };
    }
    return null;
  }
}

export async function fetchImdbMetadata(
  titleOrId: string,
  preferredYear?: number
): Promise<ImdbMetadata | null> {
  const trimmed = titleOrId.trim();
  if (/^tt\d{5,}$/i.test(trimmed)) {
    return fetchImdbById(trimmed.toLowerCase());
  }

  const candidates = await searchImdbCandidates(trimmed, preferredYear);
  if (candidates.length === 0) {
    return null;
  }

  const best = candidates[0];
  return fetchImdbById(best.id, best);
}
