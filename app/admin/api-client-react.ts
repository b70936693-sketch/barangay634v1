"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionSafe } from "@/lib/supabase";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let accessToken: string | undefined;
  try {
    const session = await getSessionSafe();
    accessToken = session?.data?.session?.access_token;
  } catch (error) {
    console.error('Unable to retrieve Supabase session:', error);
    accessToken = undefined;
  }

  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    const message = parsed?.error ? `${response.status} - ${parsed.error}` : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

function usePortal() {
  return useQuery({
    queryKey: ["admin-portal"],
    queryFn: () => fetchJson<any>("/api/portal/admin"),
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminPortal() {
  const query = usePortal();
  return { ...query, data: query.data ?? null };
}

export function useAdminAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) =>
      fetchJson("/api/portal/admin", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async (_data, variables) => {
      // Stop optimistic job_posts patching. Always rely on backend response + refetch.
      // This prevents UI from “going back” when the local mapping doesn’t match canonical DB behavior.
      const type = variables?.type;

      if (type === "job_post") {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["admin-portal"] }),
          queryClient.invalidateQueries({ queryKey: ["portal"] }),
        ]);
        return;
      }

      // For non-job_post mutations, keep existing behavior (if any was needed later).
      // Current codebase relies on invalidation for admin snapshot, so do the same.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-portal"] }),
        queryClient.invalidateQueries({ queryKey: ["portal"] }),
      ]);
    },
  });
}

export function useAdminJobPostAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { jobId: string; status: string; rejectionNotes?: string }) =>
      fetchJson("/api/portal/job-posts/admin", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-portal"] }),
        queryClient.invalidateQueries({ queryKey: ["portal"] }),
      ]);
    },
  });
}


