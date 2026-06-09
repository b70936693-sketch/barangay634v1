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
    credentials: "include",
    ...init,
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
    queryKey: ["portal"],
    queryFn: () => fetchJson<any>("/api/portal"),
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

function usePortalMutation<TVariables>(options: {
  mutationFn: (variables: TVariables) => Promise<unknown>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portal"] }),
        queryClient.invalidateQueries({ queryKey: ["job-post-applicants"] }),
        queryClient.invalidateQueries({ queryKey: ["applicant-notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["employer-job-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["job-post-applicants"] }),
      ]);
    },
  });
}

export const ListApplicantsStatus = {
  all: "all",
  pending: "pending",
  reviewing: "reviewing",
  hired: "hired",
  rejected: "rejected",
} as const;

export const JobPostStatus = {
  active: "active",
  pending: "pending",
  closed: "closed",
  rejected: "rejected",
} as const;

export const ApplicantStatus = {
  pending: "pending",
  for_interview: "for_interview",
  hired: "hired",
  rejected: "rejected",
} as const;

export const useGetEmployerProfile = () => {
  const query = usePortal();
  return { ...query, data: query.data?.employerProfile ?? null };
};

export const useGetDashboardSummary = () => {
  const query = usePortal();
  return { ...query, data: query.data?.summary ?? {} };
};

export const useGetRecentActivity = () => {
  const query = usePortal();
  return { ...query, data: query.data?.recentActivity ?? [] };
};

export const useGetPostPerformance = () => {
  const query = usePortal();
  return { ...query, data: query.data?.postPerformance ?? [] };
};

export const useGetRecentApplicants = () => {
  const query = usePortal();
  return { ...query, data: query.data?.recentApplicants ?? [] };
};

export const useCreateJobPost = () =>
  usePortalMutation<{ data: any }>({
    mutationFn: ({ data }) =>
      fetchJson("/api/portal/job-posts", {
        method: "POST",
        body: JSON.stringify({ data }),
      }),
  });

export const useListJobPosts = () => {
  return useQuery({
    queryKey: ["employer-job-posts"],
    queryFn: () => fetchJson<{ jobPosts: any[] }>("/api/portal/job-posts"),
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
};

export const useListEmployerApplications = () => {
  const query = usePortal();
  return { ...query, data: query.data?.applications ?? [] };
};

export const useListApplicants = useListEmployerApplications; // Backward compatibility


export const useListPendingApplicants = () => {
  const query = useListEmployerApplications();
  return {
    ...query,
    data:
      query.data?.filter((application: any) => application.status === "pending" || application.status === "reviewing") ?? [],
  };
};

export const useListJobPostApplicants = (jobPostId?: string, enabled = true) => {
  return useQuery({
    queryKey: ["job-post-applicants", jobPostId],
    queryFn: async () => {
      const data = await fetchJson<{ applications: unknown[] }>(
        `/api/portal/job-posts/${jobPostId}/applicants`,
      );
      return data.applications ?? [];
    },
    enabled: Boolean(jobPostId) && enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useUpdateApplicantStatus = () =>
  usePortalMutation<{
    id: string | number;
    data: { status: string; interviewDate?: string; interviewTime?: string; location?: string };
  }>({
    mutationFn: ({ id, data }) =>
      fetchJson(`/api/portal/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });


export const useListHiredApplicants = () => {
  const query = usePortal();
  return { ...query, data: query.data?.hiredApplicants ?? [] };
};

export const useListInterviews = () => {
  const query = usePortal();
  return { ...query, data: query.data?.interviews ?? [] };
};

export const useRescheduleInterview = () =>
  usePortalMutation<{ id: string | number; data: { interviewDate: string; interviewTime: string; location?: string } }>({
    mutationFn: ({ id, data }) =>
      fetchJson(`/api/portal/interviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...data,
          location: data.location ?? "Barangay 634 Hall",
        }),
      }),
  });

export const useGetJobPost = (jobPostId?: string) => {
  return useQuery({
    queryKey: ['job-post', jobPostId],
    queryFn: async () => {
      const data = await fetchJson<any>('/api/portal/job-posts/' + jobPostId);
      return data.jobPost ?? data;
    },
    enabled: !!jobPostId,
  });
};

export const useListApplicantSwipeJobs = () => {
  const query = usePortal();
  return { ...query, data: query.data?.availableSwipeJobs ?? [] };
};

export const useListApplicantApplications = () => {
  const query = usePortal();
  return { ...query, data: query.data?.applicantApplications ?? [] };
};

export const useGetApplicantProfile = () => {
  const query = usePortal();
  return { ...query, data: query.data?.applicantProfile ?? null };
};

export const useGetCurrentPortalUser = () => {
  const query = usePortal();
  return { ...query, data: query.data?.currentUser ?? null };
};

export const useUpdateApplicantProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJson<{ portal?: Record<string, unknown> }>("/api/portal/profiles/applicant", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: async (response) => {
      if (response?.portal) {
        queryClient.setQueryData(["portal"], (current: Record<string, unknown> | undefined) => ({
          ...(current ?? {}),
          ...response.portal,
        }));
      }

      await queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
};

export const useUpdateEmployerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      companyName?: string;
      businessType?: string;
      location?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      logoUrl?: string | null;
      tagline?: string;
    }) =>
      fetchJson<{ portal?: Record<string, unknown> }>("/api/portal/profiles/employer", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: async (response) => {
      if (response?.portal) {
        queryClient.setQueryData(["portal"], (current: Record<string, unknown> | undefined) => ({
          ...(current ?? {}),
          ...response.portal,
        }));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portal"] }),
        queryClient.invalidateQueries({ queryKey: ["job-post-applicants"] }),
        queryClient.invalidateQueries({ queryKey: ["applicant-notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["employer-job-posts"] }),
      ]);
    },
  });
};

export const useUpdateJobPost = () =>
  usePortalMutation<{ id: string; data: any }>({
    mutationFn: ({ id, data }) =>
      fetchJson(`/api/portal/job-posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });

export const useSubmitJobApplication = () =>
  usePortalMutation<{
    jobPostId: string;
    payload: {
      fullName: string;
      email: string;
      phone: string;
      availability: string;
      shiftPreference: string;
      introduction: string;
      documents: Array<{ id?: string; name: string; path?: string; url?: string }>;
    };
  }>({
    mutationFn: ({ jobPostId, payload }) =>
      fetchJson("/api/portal/applications", {
        method: "POST",
        body: JSON.stringify({
          jobPostId,
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone,
          availability: payload.availability,
          shiftPreference: payload.shiftPreference,
          introduction: payload.introduction,
          documents: payload.documents,
        }),
      }),
  });

export const useListApplicantNotifications = () =>
  useQuery({
    queryKey: ["applicant-notifications"],
    queryFn: () =>
      fetchJson<{
        notifications: Array<{
          id: string;
          type: "hired" | "rejected";
          title: string;
          message: string;
          jobTitle: string;
          employerName: string;
          emailSent: boolean;
          emailError?: string;
          read: boolean;
          createdAt: string;
        }>;
        unreadCount: number;
      }>("/api/portal/notifications"),
  });

export const useMarkApplicantNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { notificationId: string }) =>
      fetchJson("/api/portal/notifications", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applicant-notifications"] });
    },
  });
};

export const useMarkAllApplicantNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson("/api/portal/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAll: true }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applicant-notifications"] });
    },
  });
};

export const useUpdateJobApplication = () =>
  usePortalMutation<{
    applicationId: string;
    fullName?: string;
    email?: string;
    phone?: string;
    availability?: string;
    shiftPreference?: string;
    introduction?: string;
    documents?: string[];
  }>({
    mutationFn: ({ applicationId, ...payload }) =>
      fetchJson("/api/portal/applications", {
        method: "PUT",
        body: JSON.stringify({
          applicationId,
          ...payload,
        }),
      }),
  });
