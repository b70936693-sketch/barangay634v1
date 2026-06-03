"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Save, UserRound } from "lucide-react";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGetApplicantProfile, useGetCurrentPortalUser, useUpdateApplicantProfile } from "@workspace/api-client-react";

export default function ApplicantProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useGetApplicantProfile();
  const { data: currentUser, isLoading: isCurrentUserLoading } = useGetCurrentPortalUser();
  const { isLoaded: isAuthLoaded } = useSupabaseSession();
  const updateProfile = useUpdateApplicantProfile();
  const { toast } = useToast();

  const [localProfile, setLocalProfile] = useState({
    fullName: "",
    preferredName: "",
    email: "",
    phone: "",
    barangay: "",
    address: "",
    headline: "",
    bio: "",
  });

  const isSaving = updateProfile.isPending;
  const isLoading = isProfileLoading || isCurrentUserLoading || !isAuthLoaded;

  const displayName = currentUser?.fullName ?? profile?.fullName ?? "Applicant";
  const profileSkills = Array.isArray(profile?.skills) ? profile.skills : [];

  useEffect(() => {
    if (profile || currentUser) {
      setLocalProfile({
        fullName: currentUser?.fullName ?? profile?.fullName ?? "",
        preferredName:
          profile?.preferredName ?? currentUser?.fullName?.split(" ")[0] ?? "",
        email: profile?.email ?? currentUser?.email ?? "",
        phone: profile?.phone ?? currentUser?.phone ?? "",
        barangay: profile?.barangay ?? "",
        address: profile?.address ?? "",
        headline: profile?.headline ?? "",
        bio: profile?.bio ?? "",
      });
    }
  }, [profile, currentUser]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Applicant Profile</h2>
          <p className="text-[#73869a]">Loading your profile details...</p>
        </div>
      </div>
    );
  }

  if (!profile && !currentUser) {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Applicant Profile</h2>
          <p className="text-[#73869a]">We could not load your profile. Please refresh or contact support.</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile.mutate(localProfile, {
      onSuccess: () => {
        toast({
          title: "Profile updated",
          description: "Your applicant information is ready for the next job application.",
        });
      },
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Applicant Profile</h2>
        <p className="text-[#73869a]">Keep your contact info, introduction, and verification details ready before you swipe into your next role.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-[#ecf3fa] bg-[#2f6fa4] text-white">
              <UserRound className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-[#254260]">{displayName}</h3>
            <p className="mt-1 text-sm text-[#72859a]">{profile?.headline ?? "Applicant profile"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {profileSkills.length ? (
                profileSkills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))
              ) : (
                <span className="text-sm text-[#72859a]">Add your skills to personalize your profile.</span>
              )}
            </div>
            <div className="mt-5 rounded-2xl border border-[#bfe9cb] bg-[#ecfbf0] px-4 py-3 text-sm font-medium text-[#4b9860]">
              <div className="flex items-center justify-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                {profile?.documentsReady?.length ?? 0} verification documents prepared
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit profile details</CardTitle>
            <CardDescription>These details will prefill when you apply to jobs from the swipe deck.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput label="Full Name" required value={localProfile.fullName} onChange={(value) => setLocalProfile((prev) => ({ ...prev, fullName: value }))} />
              <LabeledInput label="Preferred Name" value={localProfile.preferredName} onChange={(value) => setLocalProfile((prev) => ({ ...prev, preferredName: value }))} />
              <LabeledInput label="Email" required value={localProfile.email} onChange={(value) => setLocalProfile((prev) => ({ ...prev, email: value }))} />
              <LabeledInput label="Phone" required value={localProfile.phone} onChange={(value) => setLocalProfile((prev) => ({ ...prev, phone: value }))} />
              <LabeledInput label="Barangay" required value={localProfile.barangay} onChange={(value) => setLocalProfile((prev) => ({ ...prev, barangay: value }))} />
              <LabeledInput label="Address" required value={localProfile.address} onChange={(value) => setLocalProfile((prev) => ({ ...prev, address: value }))} />
            </div>

            <LabeledInput label="Headline" value={localProfile.headline} onChange={(value) => setLocalProfile((prev) => ({ ...prev, headline: value }))} />

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[#36587d]">Short Bio</span>
              <Textarea
                className="min-h-[150px]"
                value={localProfile.bio}
                onChange={(e) => setLocalProfile((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </label>

            <div className="flex justify-end">
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#36587d]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
