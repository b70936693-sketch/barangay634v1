# TODO

## Plan for Sign In role-picking removal + dynamic redirect
1. Update `app/sign-in/page.tsx` UI: remove role state/redirect-url init and strip any role-related storage updates (keep email/password + existing styling/layout).
2. Update `app/sign-in/page.tsx` submit logic: stop setting role metadata via `supabase.auth.updateUser({ data: { role }})` and stop storing `jobserve_pending_role` in storage.
3. Update `app/sign-in/page.tsx` redirect logic: after successful `/api/portal/auth` validation, read `role` from the backend response and `router.push` to `/dashboard/{role}` (or appropriate mapping to your existing dashboard paths) without requiring UI role.
4. Ensure admin verification flow remains unchanged: if `authResult.isApproved` is false, signOut and show the existing error message.
5. Run typecheck/lint or `pnpm lint` (if available) to confirm no TS errors.

