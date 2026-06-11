"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { PublicUser } from "@/lib/current-user";

export function useCurrentUser(fallbackUser?: PublicUser | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ user: PublicUser }>(
    "/api/me",
    fetcher,
    {
      fallbackData: fallbackUser ? { user: fallbackUser } : undefined,
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
