import { Bell, Lock, Shield, User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <Button variant="secondary" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            Account
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Shield className="mr-2 h-4 w-4" />
            Privacy
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </Button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Control when you receive email alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New Applications</Label>
                  <p className="text-sm text-muted-foreground">Receive an email when someone applies to your post.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Interview Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive a reminder on the day of a scheduled interview.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Barangay Announcements</Label>
                  <p className="text-sm text-muted-foreground">Receive important updates from the Barangay office.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full sm:w-auto">Deactivate Account</Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will hide all your active job posts and disable your access to the portal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

