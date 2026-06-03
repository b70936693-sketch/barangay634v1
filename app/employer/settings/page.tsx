"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Bell, Lock, Shield, User } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type SettingsSection = "account" | "notifications" | "privacy" | "security";

type SettingState = {
  notifications: {
    newApplications: boolean;
    interviewReminders: boolean;
    barangayAnnouncements: boolean;
  };
  privacy: {
    showCompanyProfile: boolean;
    showContactDetails: boolean;
  };
  security: {
    requireSignInAlerts: boolean;
    requireInterviewChangeAlerts: boolean;
  };
};

const STORAGE_KEY = "jobserve_employer_settings";

const defaultSettings: SettingState = {
  notifications: {
    newApplications: true,
    interviewReminders: true,
    barangayAnnouncements: true,
  },
  privacy: {
    showCompanyProfile: true,
    showContactDetails: true,
  },
  security: {
    requireSignInAlerts: true,
    requireInterviewChangeAlerts: true,
  },
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    initialSection === "notifications" || initialSection === "privacy" || initialSection === "security"
      ? initialSection
      : "account",
  );
  const [settings, setSettings] = useState<SettingState>(defaultSettings);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SettingState>;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings({
        notifications: {
          ...defaultSettings.notifications,
          ...parsed.notifications,
        },
        privacy: {
          ...defaultSettings.privacy,
          ...parsed.privacy,
        },
        security: {
          ...defaultSettings.security,
          ...parsed.security,
        },
      });
    } catch (error) {
      console.error("Unable to read employer settings", error);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const sections = useMemo(
    () => [
      { id: "account" as const, label: "Account", icon: User },
      { id: "notifications" as const, label: "Notifications", icon: Bell },
      { id: "privacy" as const, label: "Privacy", icon: Shield },
      { id: "security" as const, label: "Security", icon: Lock },
    ],
    [],
  );

  const updateSection = <TSection extends keyof SettingState, TKey extends keyof SettingState[TSection]>(
    section: TSection,
    key: TKey,
    value: boolean,
  ) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  const deactivateHref =
    "mailto:barangay634.portal@gmail.com?subject=" +
    encodeURIComponent("Employer Account Deactivation Request") +
    "&body=" +
    encodeURIComponent(
      "Hello Barangay 634 team,\n\nI would like to request deactivation of my employer account and active listings.\n\nThank you.",
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <Button
                key={section.id}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? "" : "text-muted-foreground"}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {section.label}
              </Button>
            );
          })}
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeSection === "account" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Account Overview</CardTitle>
                  <CardDescription>Use the sections on the left to update portal preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>Your account preferences are saved locally in this browser so your dashboard controls keep their last-used state.</p>
                  <p>Open Notifications, Privacy, or Security to update the toggles that affect your employer workspace.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="destructive" className="w-full sm:w-auto">
                    <a href={deactivateHref}>Deactivate Account</a>
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    This opens an email draft to request deactivation of your employer access and active job posts.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}

          {activeSection === "notifications" ? (
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Control when you receive employer alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New Applications</Label>
                    <p className="text-sm text-muted-foreground">Receive an email when someone applies to your post.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.newApplications}
                    onCheckedChange={(checked) => updateSection("notifications", "newApplications", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Interview Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive a reminder on the day of a scheduled interview.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.interviewReminders}
                    onCheckedChange={(checked) => updateSection("notifications", "interviewReminders", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Barangay Announcements</Label>
                    <p className="text-sm text-muted-foreground">Receive important updates from the Barangay office.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.barangayAnnouncements}
                    onCheckedChange={(checked) => updateSection("notifications", "barangayAnnouncements", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "privacy" ? (
            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Choose what applicants can see about your employer profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Company Profile</Label>
                    <p className="text-sm text-muted-foreground">Keep your business profile visible across employer listings.</p>
                  </div>
                  <Switch
                    checked={settings.privacy.showCompanyProfile}
                    onCheckedChange={(checked) => updateSection("privacy", "showCompanyProfile", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Contact Details</Label>
                    <p className="text-sm text-muted-foreground">Allow applicants to see your contact details after you shortlist them.</p>
                  </div>
                  <Switch
                    checked={settings.privacy.showContactDetails}
                    onCheckedChange={(checked) => updateSection("privacy", "showContactDetails", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "security" ? (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Decide which account events should always alert you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sign-in Alerts</Label>
                    <p className="text-sm text-muted-foreground">Flag new browser sign-ins that may need review.</p>
                  </div>
                  <Switch
                    checked={settings.security.requireSignInAlerts}
                    onCheckedChange={(checked) => updateSection("security", "requireSignInAlerts", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Interview Schedule Alerts</Label>
                    <p className="text-sm text-muted-foreground">Track interview schedule changes before candidates are notified.</p>
                  </div>
                  <Switch
                    checked={settings.security.requireInterviewChangeAlerts}
                    onCheckedChange={(checked) => updateSection("security", "requireInterviewChangeAlerts", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and notifications.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <div className="h-9 w-full bg-muted animate-pulse rounded" />
          <div className="h-9 w-full bg-muted animate-pulse rounded" />
          <div className="h-9 w-full bg-muted animate-pulse rounded" />
          <div className="h-9 w-full bg-muted animate-pulse rounded" />
        </div>
        <div className="md:col-span-3">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
