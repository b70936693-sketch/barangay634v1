import { Suspense } from "react";

import AuthContinueClient from "./page-client";

function AuthContinueFallback() {
  return <div className="min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)]" />;
}

export default function AuthContinuePage() {
  return (
    <Suspense fallback={<AuthContinueFallback />}>
      <AuthContinueClient />
    </Suspense>
  );
}
