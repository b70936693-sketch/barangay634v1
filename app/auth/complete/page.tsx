"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/auth/continue${search}`);
  }, [router]);

  return <div className="min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)]" />;
}
