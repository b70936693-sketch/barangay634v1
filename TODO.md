# TODO

## Job Posts Admin Fix (Realtime + Modal Buttons)
- [x] Add Supabase realtime subscription for `job_posts` in `app/admin/job-posts/page.tsx`.

- [ ] On realtime events, invalidate React Query keys `['admin-portal']` and `['portal']`.
- [ ] Refactor job post selection to be id-driven (`selectedPostId`) rather than object/state that can go stale.
- [ ] Fix dismiss modal open flow to use the job id directly (no `closest` lookup).
- [ ] Remove the duplicate “duplicates button” in the job-post modal UI (as requested).
- [ ] Verify TS compile/lint after changes.

