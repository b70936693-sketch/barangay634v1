"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Building, Mail, MapPin, Phone, Briefcase } from "lucide-react";
import Image from "next/image";
import { useGetCurrentPortalUser, useGetEmployerProfile } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditableProfile = {
  companyName: string;
  businessType: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
};

const PROFILE_STORAGE_KEY = "jobserve_employer_profile_overrides";
const LOGO_STORAGE_KEY = "jobserve_employer_logo_preview";

export default function CompanyProfile() {
  const { data: profile, isLoading } = useGetEmployerProfile();
  const { data: currentUser } = useGetCurrentPortalUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    companyName: "",
    businessType: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
  });

  const defaults = useMemo<EditableProfile>(
    () => ({
      companyName: profile?.companyName ?? "",
      businessType: "Retail / Convenience Store",
      contactNumber: "+63 917 123 4567",
      emailAddress: "contact@jmstore.ph",
      address: "123 Mabini St., Barangay 634, Zone 64, District VI, Manila",
    }),
    [profile],
  );

  useEffect(() => {
    if (!profile) {
      return;
    }

    const savedOverrides = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    const savedLogo = window.localStorage.getItem(LOGO_STORAGE_KEY);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditableProfile(
      savedOverrides
        ? {
            ...defaults,
            ...(JSON.parse(savedOverrides) as Partial<EditableProfile>),
          }
        : defaults,
    );
    setLogoPreview(savedLogo);
  }, [defaults, profile]);

  const handleFieldChange = (field: keyof EditableProfile, value: string) => {
    setEditableProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveDetails = () => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(editableProfile));
    setIsEditing(false);
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setLogoPreview(result);
      if (result) {
        window.localStorage.setItem(LOGO_STORAGE_KEY, result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Company Profile</h2>
        <p className="text-muted-foreground">View and manage your business profile on the portal.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/10">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
              </>
            ) : (
              <>
                <Avatar className="h-24 w-24 border-4 border-primary/10 mb-4 text-2xl font-bold overflow-hidden">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Company logo preview"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {editableProfile.companyName?.charAt(0) || profile?.companyName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">{editableProfile.companyName || profile?.companyName}</h3>
                <p className="text-muted-foreground text-sm mb-4">Employer: {currentUser?.fullName || profile?.contactPerson || "Employer"}</p>
                {profile?.verified && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20 mb-4 px-3 py-1">
                    Verified Employer
                  </Badge>
                )}
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  Edit Logo
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center gap-3">
              <CardTitle>Business Details</CardTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { setEditableProfile(defaults); setIsEditing(false); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveDetails}>
                      Save Details
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Details
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>Information visible to potential applicants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Business Name</Label>
                  <Input
                    id="companyName"
                    value={editableProfile.companyName}
                    onChange={(event) => handleFieldChange("companyName", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    value={editableProfile.businessType}
                    onChange={(event) => handleFieldChange("businessType", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={editableProfile.contactNumber}
                    onChange={(event) => handleFieldChange("contactNumber", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailAddress">Email Address</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={editableProfile.emailAddress}
                    onChange={(event) => handleFieldChange("emailAddress", event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    value={editableProfile.address}
                    onChange={(event) => handleFieldChange("address", event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Building className="h-4 w-4" /> Business Name
                    </p>
                    <span className="font-medium">{isLoading ? <Skeleton className="h-5 w-32" /> : editableProfile.companyName}</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> Business Type
                    </p>
                    <p className="font-medium">{isLoading ? <Skeleton className="h-5 w-24" /> : editableProfile.businessType}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Contact Number
                    </p>
                    <p className="font-medium">{isLoading ? <Skeleton className="h-5 w-32" /> : editableProfile.contactNumber}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email Address
                    </p>
                    <p className="font-medium">{isLoading ? <Skeleton className="h-5 w-40" /> : editableProfile.emailAddress}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Business Address
                  </p>
                  <p className="font-medium">
                    {isLoading ? <Skeleton className="h-5 w-full max-w-md" /> : editableProfile.address}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
