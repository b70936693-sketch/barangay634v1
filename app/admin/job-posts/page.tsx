"use client";

import { AdminPanel, ActionButton, EmptyState, StatusBadge } from "../_components";
import { useAdminAction, useAdminPortal } from "../api-client-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function JobPostsPage() {
  const { data } = useAdminPortal();
  const mutate = useAdminAction();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [dismissReason, setDismissReason] = useState<string>("");
  const [isDismissOpen, setIsDismissOpen] = useState(false);
  const [reviewChecklist, setReviewChecklist] = useState({
    documentsReady: true,
    salaryClear: true,
    scheduleClear: true,
    accessibilityIncluded: true,
  });

  const handleAction = (status: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const closest = (e.currentTarget as HTMLButtonElement).closest('[data-post-id]');
    mutate.mutate({
      type: "job_post",
      id: closest?.getAttribute('data-post-id') || selectedPost?.id || '',
      status,
    });
  };

  const confirmDismiss = () => {
    if (!selectedPost) return;
    const notes = dismissReason.trim();
    if (!notes) return;

    mutate.mutate(
      {
        type: "job_post",
        id: selectedPost.id,
        status: "rejected",
        rejectionNotes: `Under Review: ${notes}`,
      },
      {
        onSuccess: () => {
          setDismissReason("");
          setIsDismissOpen(false);
          setSelectedPost(null);
        },
      }
    );
  };


  const handleModalAction = (status: string) => {
    if (!selectedPost) return;
    mutate.mutate({ type: "job_post", id: selectedPost.id, status });
    setSelectedPost(null);
  };

  const pendingCount = data?.jobPosts?.filter((post: any) => post.status === "pending").length ?? 0;
  const dismissedCount = data?.jobPosts?.filter((post: any) => post.status === "rejected" || post.status === "closed").length ?? 0;
  const activeCount = data?.jobPosts?.filter((post: any) => post.status === "active").length ?? 0;

  const renderListOrText = (value: any) => {
    if (!value) return null;
    if (Array.isArray(value)) return (
      <ul className="list-disc ml-5 mt-1">
        {value.map((v: any, i: number) => <li key={i}>{String(v)}</li>)}
      </ul>
    );
    if (typeof value === 'string' && value.indexOf('\n') !== -1) {
      return (
        <div className="mt-1">
          {value.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      );
    }
    return <div className="mt-1">{String(value)}</div>;
  };

  return (
    <AdminPanel title="Job Post Oversight" description="Admin verifies employer-submitted job posts before they go live to applicants.">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[#dfe8f0] bg-[#f7fbff] p-4"><div className="text-xs uppercase tracking-wide text-[#7b8ca0]">Pending Review</div><div className="mt-2 text-2xl font-bold text-[#203142]">{pendingCount}</div></div>
        <div className="rounded-2xl border border-[#dfe8f0] bg-[#fffaf4] p-4"><div className="text-xs uppercase tracking-wide text-[#7b8ca0]">Dismissed Posts</div><div className="mt-2 text-2xl font-bold text-[#203142]">{dismissedCount}</div></div>
        <div className="rounded-2xl border border-[#dfe8f0] bg-[#effaf4] p-4"><div className="text-xs uppercase tracking-wide text-[#7b8ca0]">Live Posts</div><div className="mt-2 text-2xl font-bold text-[#203142]">{activeCount}</div></div>
      </div>
      <div className="mt-4 space-y-3">
        {data?.jobPosts?.length ? data.jobPosts.map((post: any) => (
<div
              key={post.id}
              data-post-id={post.id}
              onClick={() => {
                if (isDismissOpen) return;
                setSelectedPost(post);
              }}
              className="flex flex-col gap-4 rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4 lg:flex-row lg:items-center lg:justify-between cursor-pointer"
            >
            <div>
              <div className="text-sm font-semibold text-[#29425e]">{post.title}</div>
              <div className="mt-1 text-xs text-[#7b8ca0]">{post.companyName} • {post.position}</div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="text-sm font-medium text-[#29425e]">{post.applicantCount} applicants</div>
              <StatusBadge value={post.status} />
              {post.status === "pending" ? (
                <>
                  <ActionButton label="Approve" variant="default" onClickAction={handleAction("active")} />
                  <ActionButton
                    label="Dismiss"
                    onClickAction={(e) => {
                      e.stopPropagation();
                      setSelectedPost(null); // prevent detail modal overlay conflicts
                      setDismissReason("");
                      setIsDismissOpen(true);
                    }}
                  />
                </>
              ) : (
                <ActionButton label="Close" onClickAction={handleAction("closed")} />
              )}

            </div>
          </div>
        )) : <EmptyState title="No job posts yet" copy="Employer-created opportunities will appear here." />}
      </div>
      {/* Dismiss / Under Review Modal */}
      <Dialog open={isDismissOpen} onOpenChange={(open) => { if (!open) { setIsDismissOpen(false); setDismissReason(""); } }}>
        <DialogContent className="max-w-xl bg-white max-h-[70vh] overflow-y-auto" hideClose>
          <DialogHeader>
            <DialogTitle>Dismiss Job Post</DialogTitle>
            <DialogDescription>Flag this post for review with concise feedback before any final rejection is made.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-[#dfe8f0] bg-[#f7fbff] p-3">
                <div className="text-sm font-semibold text-[#29425e]">Review checklist</div>
              <div className="mt-2 grid gap-2 text-sm text-[#506274]">
                {Object.entries(reviewChecklist).map(([key, checked]) => (
                  <label key={key} className="flex items-center gap-2 rounded-xl border border-[#e5edf5] bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setReviewChecklist((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof prev],
                        }))
                      }
                    />
                    <span>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#29425e]">Feedback for review</div>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Example: Missing required documents, unclear salary, or accessibility details need updates before approval."
                className="mt-2 w-full min-h-[110px] rounded-2xl border border-[#dfe8f0] bg-white p-3 text-sm outline-none focus:border-[#2f6fa4]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-2 justify-end">
            <ActionButton label="Cancel" variant="secondary" onClickAction={() => { setIsDismissOpen(false); setDismissReason(""); }} />
            <ActionButton label="Under Review" variant="default" onClickAction={() => { confirmDismiss(); }} disabled={!dismissReason.trim()} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Post Detail Modal */}
      <Dialog open={Boolean(selectedPost)} onOpenChange={(open) => { if (!open) setSelectedPost(null); }}>
        <DialogContent className="max-w-3xl bg-white max-h-[85vh] overflow-y-auto" hideClose>

          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>{selectedPost ? `${selectedPost.companyName} • ${selectedPost.position}` : ''}</DialogDescription>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusBadge value={selectedPost?.status} />
              {selectedPost?.employerVerified !== undefined && (
                <div className="text-sm text-[#7b8ca0]">Employer verified: <span className="font-semibold text-[#29425e]">{selectedPost.employerVerified ? 'Yes' : 'No'}</span></div>
              )}
              {selectedPost?.publishedAt && (
                <div className="text-sm text-slate-500">Published: <span className="font-medium text-slate-700">{new Date(selectedPost.publishedAt).toLocaleString()}</span></div>
              )}
              {selectedPost?.status === 'rejected' && (
                <div className="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">FAKE</div>
              )}
            </div>
          </DialogHeader>
          <div className="mt-4 prose prose-sm text-slate-700">
            <p><strong>ID:</strong> {selectedPost?.id}</p>
            <p><strong>Employer ID:</strong> {selectedPost?.employerId}</p>
            <p><strong>Company:</strong> {selectedPost?.companyName}</p>
            <p><strong>Title:</strong> {selectedPost?.title}</p>
            <p><strong>Position:</strong> {selectedPost?.position}</p>
            <p><strong>Post Type:</strong> {selectedPost?.postType}</p>
            <p><strong>Created:</strong> {selectedPost?.createdAt ? new Date(selectedPost.createdAt).toLocaleString() : ''}</p>
            <p><strong>Status:</strong> {selectedPost?.status}</p>
            <p><strong>Applicants:</strong> {selectedPost?.applicantCount ?? 0}</p>
            {selectedPost?.status === 'pending' && (
              <div className="mt-3 rounded-md bg-yellow-50 border border-yellow-100 p-3 text-sm text-yellow-800">
                This job post is currently pending admin review — it will not be visible to applicants until an admin approves it.
              </div>
            )}
            {selectedPost?.adminRequirements && (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-[#29425e]">Admin requirements</div>
                <div className="mt-2 text-sm text-[#506274]">These documents or checks must be completed before approving the post.</div>
                <div className="mt-2">
                  {renderListOrText(selectedPost.adminRequirements)}
                </div>
              </div>
            )}
            
            {/* R.A. Compliance Section */}
            {(selectedPost?.pwdFriendly || selectedPost?.seniorFriendly || (selectedPost?.accessibilityFeatures && selectedPost.accessibilityFeatures.length > 0)) && (
              <div className="mt-4 rounded-md border border-green-100 bg-green-50 p-3">
                <div className="text-sm font-semibold text-green-800 mb-2">✓ R.A. Compliance & Accessibility</div>
                {selectedPost?.pwdFriendly && (
                  <div className="text-sm text-green-700 mb-1">♿ <strong>PWD Friendly:</strong> Yes - Position welcomes persons with disabilities</div>
                )}
                {selectedPost?.seniorFriendly && (
                  <div className="text-sm text-green-700 mb-1">👴 <strong>Senior Citizen Friendly:</strong> Yes - Position welcomes senior citizens (60+)</div>
                )}
                {selectedPost?.accessibilityFeatures && selectedPost.accessibilityFeatures.length > 0 && (
                  <div className="text-sm text-green-700">
                    <strong>Accessibility Features:</strong>
                    {renderListOrText(selectedPost.accessibilityFeatures)}
                  </div>
                )}
              </div>
            )}

            {/* Posting Period Section */}
            {(selectedPost?.postingStartDate || selectedPost?.postingEndDate) && (
              <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="text-sm font-semibold text-blue-800">📅 Posting Period</div>
                {selectedPost?.postingStartDate && (
                  <p className="mt-1 text-sm text-blue-700"><strong>Start Date:</strong> {new Date(selectedPost.postingStartDate).toLocaleDateString()}</p>
                )}
                {selectedPost?.postingEndDate && (
                  <p className="text-sm text-blue-700"><strong>End Date:</strong> {new Date(selectedPost.postingEndDate).toLocaleDateString()}</p>
                )}
              </div>
            )}

            {/* Shifts Section */}
            {selectedPost?.shifts && selectedPost.shifts.length > 0 && (
              <div className="mt-4 rounded-md border border-purple-100 bg-purple-50 p-3">
                <div className="text-sm font-semibold text-purple-800">⏰ Available Shifts</div>
                <div className="mt-2">
                  {renderListOrText(selectedPost.shifts)}
                </div>
              </div>
            )}
            
            {selectedPost?.rejectionNotes && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-800">
                <div className="font-semibold text-red-800">Rejection notes</div>
                <div className="mt-1 text-sm text-red-700">{selectedPost.rejectionNotes}</div>
              </div>
            )}
            {selectedPost?.qualifications && <div className="mt-2"><strong>Qualifications</strong><div className="mt-1 whitespace-pre-wrap">{selectedPost.qualifications}</div></div>}
            {selectedPost?.requirements && <div className="mt-2"><strong>Requirements</strong><div className="mt-1 whitespace-pre-wrap">{selectedPost.requirements}</div></div>}
            {selectedPost?.description && <div className="mt-2"><strong>Description</strong><div className="mt-1 whitespace-pre-wrap">{selectedPost.description}</div></div>}
            {selectedPost?.employmentType && <p><strong>Employment Type:</strong> {selectedPost.employmentType}</p>}
            {selectedPost?.schedule && <p><strong>Schedule:</strong> {selectedPost.schedule}</p>}
            {selectedPost?.salary && <p><strong>Salary:</strong> {selectedPost.salary}</p>}
            {selectedPost?.urgency && <p><strong>Urgency:</strong> {selectedPost.urgency}</p>}
            {selectedPost?.benefits && (
              <div className="mt-2">
                <strong>Benefits</strong>
                {renderListOrText(selectedPost.benefits)}
              </div>
            )}
            {selectedPost?.employerRequirements && (
              <div className="mt-2">
                <strong>Employer Requirements</strong>
                {renderListOrText(selectedPost.employerRequirements)}
              </div>
            )}

            {/* Render any remaining fields as plain sentences */}
            {selectedPost && Object.keys(selectedPost).length > 0 && (
              <div className="mt-4">
                <strong>Other fields</strong>
                <div className="mt-2">
                  {Object.entries(selectedPost)
                    .filter(([k]) => [
                      'id','employerId','companyName','title','position','postType','createdAt','status','applicantCount','qualifications','requirements','description','employmentType','schedule','salary','urgency','benefits','employerRequirements','adminRequirements'
                    ].indexOf(k) === -1)
                    .map(([k,v]) => (
                      <div key={k} className="text-sm text-slate-700">
                        <span className="font-medium">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4 flex gap-2 justify-end">
            {selectedPost?.status === 'pending' ? (
              <>
                <ActionButton label="Approve" variant="default" onClickAction={() => handleModalAction('active')} />
                <ActionButton
                  label="Dismiss"
                  variant="default"
                  onClickAction={() => {
                    setIsDismissOpen(true);
                    setDismissReason("");
                  }}
                />
              </>
            ) : (
              <>
                <ActionButton label="Close Post" onClickAction={() => handleModalAction('closed')} />
                {selectedPost?.status === 'rejected' && (
                  <ActionButton label="Clear Rejection" variant="secondary" onClickAction={() => handleModalAction('closed')} />
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminPanel>
  );
}
