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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-portal"] }),
        queryClient.invalidateQueries({ queryKey: ["portal"] }),
      ]);
    },
  });
}


