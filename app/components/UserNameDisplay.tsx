"use client";

import { useCurrentUserName } from "@/lib/hooks/useCurrentUserName";
import { Skeleton } from "@/components/ui/skeleton";

export function UserNameDisplay() {
  const { data: name, isLoading } = useCurrentUserName();

  if (isLoading) {
    return <Skeleton className="h-5 w-32" />;
  }

  return (
    <span className="text-sm font-semibold text-slate-900">
      {name ?? "User"}
    </span>
  );
}
