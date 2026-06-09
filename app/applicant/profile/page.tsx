"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BadgeCheck, Loader2, Pencil, Save, Upload, UserRound, X } from "lucide-react";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

import { getApplicantHeadlineText, parseApplicantProfileMeta } from "@/lib/applicant-profile-meta";
import { compressImageFile } from "@/lib/compress-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGetApplicantProfile, useGetCurrentPortalUser, useUpdateApplicantProfile } from "@workspace/api-client-react";

export default function ApplicantProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useGetApplicantProfile();
  const { data: currentUser, isLoading: isCurrentUserLoading } = useGetCurrentPortalUser();
  const { isLoaded: isAuthLoaded } = useSupabaseSession();
  const updateProfile = useUpdateApplicantProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  const profileMeta = useMemo(() => parseApplicantProfileMeta(profile?.headline), [profile?.headline]);
  const isSaving = updateProfile.isPending;
  const isLoading = isProfileLoading || isCurrentUserLoading || !isAuthLoaded;
  const displayName = currentUser?.fullName ?? profile?.fullName ?? "Applicant";
  const profileSkills = Array.isArray(profile?.skills) ? profile.skills : [];
  const headlineText = getApplicantHeadlineText(profile?.headline);

  const defaults = useMemo(
    () => ({
      fullName: currentUser?.fullName ?? profile?.fullName ?? "",
      preferredName: profile?.preferredName ?? currentUser?.fullName?.split(" ")[0] ?? "",
      email: profile?.email ?? currentUser?.email ?? "",
      phone: profile?.phone ?? currentUser?.phone ?? "",
      barangay: profile?.barangay ?? "",
      address: profile?.address ?? "",
      headline: profileMeta.headline ?? headlineText,
      bio: profile?.bio ?? "",
    }),
    [profile, currentUser, profileMeta.headline, headlineText],
  );

  useEffect(() => {
    if (!profile && !currentUser) return;
    setLocalProfile(defaults);
    setPhotoPreview(profileMeta.photoUrl ?? null);
  }, [defaults, profile, currentUser, profileMeta.photoUrl]);

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
    updateProfile.mutate(
      {
        ...localProfile,
        photoUrl: photoPreview,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile updated",
            description: "Your photo and profile details are ready for employers to review.",
          });
          setIsEditing(false);
        },
        onError: (error: unknown) => {
          toast({
            title: "Save failed",
            description: error instanceof Error ? error.message : "Unable to save applicant profile.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleCancel = () => {
    setLocalProfile(defaults);
    setPhotoPreview(profileMeta.photoUrl ?? null);
    setIsEditing(false);
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file for your profile photo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const compressedPhoto = await compressImageFile(file);
      setPhotoPreview(compressedPhoto);
      setIsEditing(true);
    } catch {
      toast({
        title: "Upload failed",
        description: "We could not process that image. Try a different photo.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Applicant Profile</h2>
          <p className="text-[#73869a]">
            Add a profile photo and keep your details ready before you apply to jobs.
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className="rounded-xl border-[#d6e1eb]" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button className="rounded-xl bg-[#2f6fa4] hover:bg-[#255b89]" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save profile
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" className="rounded-xl border-[#d6e1eb]" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit profile
            </Button>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="rounded-[24px] border-[#d6e1eb] shadow-[0_12px_30px_rgba(37,91,142,0.06)]">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-[#ecf3fa] bg-[#eef5fb] text-2xl font-bold text-[#2f6fa4]">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Profile photo"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserRound className="h-10 w-10" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-semibold text-[#254260]">{displayName}</h3>
            <p className="mt-1 text-sm text-[#72859a]">{localProfile.headline || headlineText || "Applicant profile"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {profileSkills.length ? (
                profileSkills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
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
            {isEditing ? (
              <div className="mt-5 flex w-full flex-col gap-2">
                <Button variant="outline" className="w-full rounded-xl" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload photo
                </Button>
                {photoPreview ? (
                  <Button variant="ghost" className="w-full rounded-xl text-rose-600" onClick={() => setPhotoPreview(null)}>
                    Remove photo
                  </Button>
                ) : null}
              </div>
            ) : (
              <Button variant="outline" className="mt-5 w-full rounded-xl" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Change photo
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-[#d6e1eb] shadow-[0_12px_30px_rgba(37,91,142,0.06)]">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>These details prefill when you apply to jobs and are visible to employers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Full Name"
                required
                value={localProfile.fullName}
                disabled={!isEditing}
                onChange={(value) => setLocalProfile((prev) => ({ ...prev, fullName: value }))}
              />
              <LabeledInput
                label="Preferred Name"
                value={localProfile.preferredName}
                disabled={!isEditing}
                onChange={(value) => setLocalProfile((prev) => ({ ...prev, preferredName: value }))}
              />
              <LabeledInput
                label="Email"
                required
                value={localProfile.email}
                disabled={!isEditing}
                onChange={(value) => setLocalProfile((prev) => ({ ...prev, email: value }))}
              />
              <LabeledInput
                label="Phone"
                required
                value={localProfile.phone}
                disabled={!isEditing}
                onChange={(value) => setLocalProfile((prev) => ({ ...prev, phone: value }))}
              />
              <LabeledInput
                label="Barangay"
                required
                value={localProfile.barangay}
                disabled={!isEditing}
                onChange={(value) => setLocalProfile((prev) => ({ ...prev, barangay: value }))}
              />
              <LabeledInput
                label="Address"
                required
                value={localProfile.address}
                disabled={!isEditing}
                onChange={(value) => setLocalProfile((prev) => ({ ...prev, address: value }))}
              />
            </div>

            <LabeledInput
              label="Headline"
              value={localProfile.headline}
              disabled={!isEditing}
              onChange={(value) => setLocalProfile((prev) => ({ ...prev, headline: value }))}
            />

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[#36587d]">Short Bio</span>
              <Textarea
                className="min-h-[150px] rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                value={localProfile.bio}
                disabled={!isEditing}
                onChange={(e) => setLocalProfile((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </label>
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#36587d]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <Input
        className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
