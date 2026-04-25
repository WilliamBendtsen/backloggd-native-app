const backloggdApiBaseUrl =
  process.env.EXPO_PUBLIC_BACKLOGGD_API_BASE_URL ??
  "https://backloggd-api-uw62.vercel.app";

export type BackloggdStats = {
  played: number;
  playedIn2026: number;
  backlog: number;
};

export type BackloggdGame = {
  name: string;
  image: string;
};

export type BackloggdReview = {
  name: string;
  image: string;
  rating: number;
  review: string;
};

export type BackloggdUserContent = {
  username: string;
  profile?: string;
  bio?: string;
  stats: BackloggdStats;
  favoriteGames: BackloggdGame[];
  recentlyReviewed: BackloggdReview[];
};

type BackloggdUserResponse = {
  message?: string;
  code?: number;
  content?: BackloggdUserContent;
};

export async function fetchBackloggdUser(
  username: string,
): Promise<BackloggdUserContent> {
  const trimmed = username.trim();

  if (!trimmed) {
    throw new Error("Missing Backloggd username.");
  }

  const response = await fetch(
    `${backloggdApiBaseUrl}/user/${encodeURIComponent(trimmed)}`,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Backloggd API request failed (${response.status}): ${body || "Unknown error"}`,
    );
  }

  const data = (await response.json()) as BackloggdUserResponse;

  if (!data.content) {
    throw new Error("Backloggd API returned an unexpected response.");
  }

  return data.content;
}
