import { Suspense } from "react";

import UpdatePasswordForm from "@/auth/update-password/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={null}>
      <UpdatePasswordForm />
    </Suspense>
  );
}

