"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { PublicUser } from "@/lib/current-user";

const PROFILE_CACHE_KEY = "ourmoney_profile_cache";

export function useCurrentUser(fallbackUser?: PublicUser | null) {
  const getCachedProfile = () => {
    if (typeof window === "undefined") return fallbackUser ? { user: fallbackUser } : undefined;
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached).data;
      }
    } catch (e) {
      console.error("Failed to load profile from cache", e);
    }
    return fallbackUser ? { user: fallbackUser } : undefined;
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ user: PublicUser }>(
    "/api/me",
    fetcher,
    {
      fallbackData: getCachedProfile(),
      onSuccess: (newData) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
            data: newData,
            cachedAt: Date.now()
          }));
        }
      }
    },
  );

  return {
    user: data?.user ?? fallbackUser ?? null,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
