import { supabase } from "./supabase";

const AVATARS_BUCKET = "avatars";

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_path: string | null;
};

function base64ToArrayBuffer(value: string) {
  const cleaned = value.replace(/\s/g, "");
  const binary = globalThis.atob(cleaned);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function inferExtension(uri: string, mimeType?: string | null) {
  const normalizedMimeType = mimeType?.toLowerCase();

  if (normalizedMimeType === "image/png") {
    return "png";
  }

  if (normalizedMimeType === "image/webp") {
    return "webp";
  }

  if (normalizedMimeType === "image/heic") {
    return "heic";
  }

  const fromUri = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1]?.toLowerCase();
  if (fromUri) {
    return fromUri;
  }

  return "jpg";
}

export function getAvatarPublicUrl(avatarPath: string | null) {
  if (!avatarPath) {
    return null;
  }

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(avatarPath);
  return data.publicUrl;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ProfileRow | null;
}

export async function listProfilesByIds(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return [] as ProfileRow[];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path")
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRow[];
}

export async function uploadAvatar(args: {
  userId: string;
  uri: string;
  base64: string;
  mimeType?: string | null;
}) {
  const { userId, uri, base64, mimeType } = args;
  const extension = inferExtension(uri, mimeType);
  const avatarPath = `${userId}/avatar.${extension}`;
  const arrayBuffer = base64ToArrayBuffer(base64);

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(avatarPath, arrayBuffer, {
      upsert: true,
      contentType: mimeType ?? "image/jpeg",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  return {
    avatarPath,
    publicUrl: getAvatarPublicUrl(avatarPath),
  };
}
