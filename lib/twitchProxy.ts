import { supabase } from "./supabase";

/* This looks in my .env file for a point towards the name of the edge function */
const twitchProxyFunction =
  process.env.EXPO_PUBLIC_TWITCH_PROXY_FUNCTION ?? "hyper-handler";

/* This is type definition for the data returned from the api (in object form) */
type TwitchGame = {
  id?: number | string;
  name?: string;
  coverUrl?: string;
  genreName?: string;
  releaseDate?: string;
  publisherName?: string;
  developerName?: string;
  platformName?: string;
};

/* This is type definition for the return of the data from `TwitchGame` */
type TwitchProxyResponse = {
  results?: TwitchGame[];
};

/* Here we make a function to search games from the api, with a proimse that the `TwitchGame` will eventually return an array of "TwitchGame" objects */
export async function searchTwitchGames(query: string): Promise<TwitchGame[]> {
  /* We start by trimming the response */
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  /* Then we use some built in supabase function to invoke the api call? */
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

  /* Then if the data pulled is from the "results" part of the edge function, we just return said raw results, since they're already parsed */
  if (Array.isArray(data?.results)) {
    return data.results;
  }

  /* And if the data is jst from the "data" part of the edge function, we return the data with the parameters defined in the "TwitchGame" type definition */
  if (Array.isArray(data)) {
    return data as TwitchGame[];
  }

  return [];
}
