"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Upload,
  User,
  X,
} from "lucide-react";

import {
  useGetCurrentPortalUser,
  useGetEmployerProfile,
  useUpdateEmployerProfile,
} from "@workspace/api-client-react";
import { compressImageFile } from "@/lib/compress-image";
import { parseEmployerProfileMeta } from "@/lib/employer-profile-meta";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type EditableProfile = {
  companyName: string;
  businessType: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
};

function DetailTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#e8f0f6] bg-[#fbfdff] px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#7c8ea1]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[#24364a]">{value || "Not provided"}</p>
    </div>
  );
}

export default function CompanyProfile() {
  const { data: profile, isLoading } = useGetEmployerProfile();
  const { data: currentUser } = useGetCurrentPortalUser();
  const updateProfile = useUpdateEmployerProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    companyName: "",
    businessType: "",
    contactPerson: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
  });

  const profileMeta = useMemo(() => parseEmployerProfileMeta(profile?.headline), [profile?.headline]);

  const defaults = useMemo<EditableProfile>(
    () => ({
      companyName: profile?.companyName ?? "",
      businessType: profile?.businessType ?? "",
      contactPerson: profile?.contactPerson ?? currentUser?.fullName ?? "",
      contactNumber: currentUser?.phone ?? "",
      emailAddress: currentUser?.email ?? "",
      address: profile?.location ?? "",
    }),
    [profile, currentUser],
  );

  useEffect(() => {
    if (!profile && !currentUser) return;
    setEditableProfile(defaults);
    setLogoPreview(profileMeta.logoUrl ?? null);
  }, [defaults, profile, currentUser, profileMeta.logoUrl]);

  const handleFieldChange = (field: keyof EditableProfile, value: string) => {
    setEditableProfile((current) => ({ ...current, [field]: value }));
  };

  const handleCancel = () => {
    setEditableProfile(defaults);
    setLogoPreview(profileMeta.logoUrl ?? null);
    setIsEditing(false);
  };

  const handleSaveDetails = () => {
    updateProfile.mutate(
      {
        companyName: editableProfile.companyName,
        businessType: editableProfile.businessType,
        contactPerson: editableProfile.contactPerson,
        location: editableProfile.address,
        phone: editableProfile.contactNumber,
        email: editableProfile.emailAddress,
        logoUrl: logoPreview,
        tagline: profileMeta.tagline,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile saved",
            description: "Your company profile has been updated successfully.",
          });
          setIsEditing(false);
        },
        onError: (error: unknown) => {
          toast({
            title: "Save failed",
            description: error instanceof Error ? error.message : "Unable to save company profile.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file for your company logo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const compressedLogo = await compressImageFile(file);
      setLogoPreview(compressedLogo);
    } catch {
      toast({
        title: "Upload failed",
        description: "We could not process that image. Try a different logo file.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  const displayName = editableProfile.companyName || profile?.companyName || "Your business";
  const employerName = editableProfile.contactPerson || currentUser?.fullName || profile?.contactPerson || "Employer";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Company Profile</h2>
          <p className="mt-1 text-sm text-[#73869a]">
            Manage the business information applicants see on your job posts.
          </p>
        </div>
        {!isLoading ? (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" className="rounded-xl border-[#d6e1eb]" onClick={handleCancel} disabled={updateProfile.isPending}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button className="rounded-xl bg-[#2f6fa4] hover:bg-[#255b89]" onClick={handleSaveDetails} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save changes
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
        ) : null}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="rounded-[24px] border border-[#d6e1eb] bg-white p-6 shadow-[0_12px_30px_rgba(37,91,142,0.06)]">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <Skeleton className="mb-4 h-24 w-24 rounded-full" />
              <Skeleton className="mb-2 h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <Avatar className="mb-4 h-24 w-24 overflow-hidden border-4 border-[#e8f4fc] text-2xl font-bold">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Company logo"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : null}
                <AvatarFallback className="bg-[#eef5fb] text-[#2f6fa4]">
                  {displayName.charAt(0) || "B"}
                </AvatarFallback>
              </Avatar>

              <h3 className="text-xl font-bold text-[#24364a]">{displayName}</h3>
              <p className="mt-1 text-sm text-[#6d8195]">Employer: {employerName}</p>

              {profile?.verified ? (
                <Badge className="mt-4 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
                  <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                  Verified employer
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-4 rounded-full">
                  Pending verification
                </Badge>
              )}

              {isEditing ? (
                <div className="mt-5 flex w-full flex-col gap-2">
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload logo
                  </Button>
                  {logoPreview ? (
                    <Button variant="ghost" className="w-full rounded-xl text-rose-600" onClick={() => setLogoPreview(null)}>
                      Remove logo
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-[#d6e1eb] bg-white p-6 shadow-[0_12px_30px_rgba(37,91,142,0.06)]">
          <div className="mb-5 border-b border-[#e8f0f6] pb-4">
            <h3 className="text-base font-semibold text-[#24364a]">Business details</h3>
            <p className="mt-0.5 text-sm text-[#6d8195]">Information visible to potential applicants.</p>
          </div>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="companyName">Business name</Label>
                <Input
                  id="companyName"
                  className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                  value={editableProfile.companyName}
                  onChange={(event) => handleFieldChange("companyName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business type</Label>
                <Input
                  id="businessType"
                  className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                  value={editableProfile.businessType}
                  onChange={(event) => handleFieldChange("businessType", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact person</Label>
                <Input
                  id="contactPerson"
                  className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                  value={editableProfile.contactPerson}
                  onChange={(event) => handleFieldChange("contactPerson", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact number</Label>
                <Input
                  id="contactNumber"
                  className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                  value={editableProfile.contactNumber}
                  onChange={(event) => handleFieldChange("contactNumber", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                  value={editableProfile.emailAddress}
                  onChange={(event) => handleFieldChange("emailAddress", event.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Business address</Label>
                <Input
                  id="address"
                  className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                  value={editableProfile.address}
                  onChange={(event) => handleFieldChange("address", event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile icon={Building2} label="Business name" value={editableProfile.companyName} />
              <DetailTile icon={Briefcase} label="Business type" value={editableProfile.businessType} />
              <DetailTile icon={User} label="Contact person" value={editableProfile.contactPerson} />
              <DetailTile icon={Phone} label="Contact number" value={editableProfile.contactNumber} />
              <DetailTile icon={Mail} label="Email address" value={editableProfile.emailAddress} />
              <DetailTile icon={MapPin} label="Business address" value={editableProfile.address} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
