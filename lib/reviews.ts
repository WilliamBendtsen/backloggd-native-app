import { supabase } from "./supabase";
import {
  listProfilesByIds as fetchProfilesByIds,
  type ProfileRow,
} from "./profiles";

export type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
  likes: number;
  game_id: string;
  game_name: string;
  cover_url: string | null;
  body: string;
};

export type ReviewInput = {
  rating: number;
  gameId: string;
  gameName: string;
  coverUrl: string;
  body: string;
};

const REVIEW_SELECT =
  "id, user_id, rating, created_at, updated_at, likes, game_id, game_name, cover_url, body";

export async function listUserReviews(userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReviewRow[];
}

export async function listAllReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReviewRow[];
}

export async function listProfilesByIds(userIds: string[]) {
  return fetchProfilesByIds(userIds);
}

export async function createReview(userId: string, input: ReviewInput) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      rating: input.rating,
      game_id: input.gameId,
      game_name: input.gameName,
      cover_url: input.coverUrl || null,
      body: input.body,
    })
    .select(REVIEW_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as ReviewRow;
}

export async function updateReview(reviewId: string, input: ReviewInput) {
  const { data, error } = await supabase
    .from("reviews")
    .update({
      rating: input.rating,
      game_id: input.gameId,
      game_name: input.gameName,
      cover_url: input.coverUrl || null,
      body: input.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(REVIEW_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as ReviewRow;
}

export async function deleteReview(reviewId: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    throw error;
  }
}
