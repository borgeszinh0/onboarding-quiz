"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

export type UserProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarPath: string | null;
};

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function normalizeProfile(row: {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
}): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    avatarPath: row.avatar_path,
  };
}

function profileFromUserMetadata(user: User): UserProfile {
  return {
    id: user.id,
    displayName:
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : null,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
    avatarPath:
      typeof user.user_metadata?.avatar_path === "string"
        ? user.user_metadata.avatar_path
        : null,
  };
}

function isMissingProfilesTable(message?: string) {
  return !!message && message.toLowerCase().includes("public.profiles");
}

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  return file.type.split("/")[1] || "png";
}

export function useUserProfile(user: User | null) {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      if (isMissingProfilesTable(fetchError.message)) {
        setProfile(profileFromUserMetadata(user));
      } else {
        setError(fetchError.message);
      }
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(normalizeProfile(data));
      setLoading(false);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id })
      .select("id, display_name, avatar_url, avatar_path")
      .single();

    if (insertError) {
      if (isMissingProfilesTable(insertError.message)) {
        setProfile(profileFromUserMetadata(user));
      } else {
        setError(insertError.message);
      }
    } else {
      setProfile(normalizeProfile(inserted));
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    void Promise.resolve().then(loadProfile);
  }, [loadProfile]);

  const updateDisplayName = async (displayName: string) => {
    if (!supabase || !user) return { error: "Backend não configurado." };
    const cleanName = displayName.trim();
    if (cleanName.length > 80) return { error: "Use no máximo 80 caracteres." };

    setSaving(true);
    setError(null);

    const nextProfile: UserProfile = {
      ...(profile ?? profileFromUserMetadata(user)),
      displayName: cleanName || null,
    };

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { display_name: cleanName || null },
    });

    if (metadataError) {
      setSaving(false);
      return { error: metadataError.message };
    }

    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: cleanName || null,
      })
      .select("id, display_name, avatar_url, avatar_path")
      .single();

    setSaving(false);
    if (updateError) {
      if (isMissingProfilesTable(updateError.message)) {
        setProfile(nextProfile);
        return { error: null };
      }
      return { error: updateError.message };
    }
    setProfile(normalizeProfile(data));
    return { error: null };
  };

  const uploadAvatar = async (file: File) => {
    if (!supabase || !user) return { error: "Backend não configurado." };
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return { error: "Use uma imagem JPG, PNG, WebP ou GIF." };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { error: "Use uma imagem de até 1 MB." };
    }

    setSaving(true);
    setError(null);

    const extension = getExtension(file);
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setSaving(false);
      setError(uploadError.message);
      return { error: uploadError.message };
    }

    const { data: publicUrl } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(path);

    const nextProfile: UserProfile = {
      ...(profile ?? profileFromUserMetadata(user)),
      avatarUrl: publicUrl.publicUrl,
      avatarPath: path,
    };

    await supabase.auth.updateUser({
      data: {
        avatar_url: publicUrl.publicUrl,
        avatar_path: path,
      },
    });

    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        avatar_url: publicUrl.publicUrl,
        avatar_path: path,
      })
      .select("id, display_name, avatar_url, avatar_path")
      .single();

    setSaving(false);
    if (updateError) {
      if (isMissingProfilesTable(updateError.message)) {
        setProfile(nextProfile);
        return { error: null };
      }
      setError(updateError.message);
      return { error: updateError.message };
    }
    setProfile(normalizeProfile(data));
    return { error: null };
  };

  return {
    profile,
    loading,
    saving,
    error,
    updateDisplayName,
    uploadAvatar,
  };
}
