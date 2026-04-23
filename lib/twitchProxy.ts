import { supabase } from "./supabase";

const twitchProxyFunction =
  process.env.EXPO_PUBLIC_TWITCH_PROXY_FUNCTION ?? "hyper-handler";

export type TwitchGame = {
  id?: number | string;
  name?: string;
  coverUrl?: string;
  genreName?: string;
  releaseDate?: string;
  publisherName?: string;
  developerName?: string;
  platformName?: string;
};

type TwitchProxyResponse = {
  results?: TwitchGame[];
};

export async function searchTwitchGames(query: string): Promise<TwitchGame[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  let { data, error } = await supabase.functions.invoke<TwitchProxyResponse>(
    twitchProxyFunction,
    {
      body: { query: trimmed },
    },
  );

  const status = (error as { context?: Response } | null)?.context?.status;
  if (error && status === 404 && twitchProxyFunction !== twitchProxyFunction) {
    const fallbackResponse =
      await supabase.functions.invoke<TwitchProxyResponse>(
        twitchProxyFunction,
        {
          body: { query: trimmed },
        },
      );

    data = fallbackResponse.data;
    error = fallbackResponse.error;
  }

  if (error) {
    const fallbackMessage = error.message || "Twitch proxy request failed";
    const context = (error as { context?: Response }).context;

    if (context) {
      const rawBody = await context.text();
      throw new Error(
        `Proxy request failed (${context.status}): ${rawBody || fallbackMessage}`,
      );
    }

    throw new Error(fallbackMessage);
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data as TwitchGame[];
  }

  return [];
}
