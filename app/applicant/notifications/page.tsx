"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Mail, PartyPopper, Sparkles, XCircle } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useListApplicantNotifications,
  useMarkApplicantNotificationRead,
  useMarkAllApplicantNotificationsRead,
} from "@workspace/api-client-react";

export default function ApplicantNotificationsPage() {
  const { data, isLoading } = useListApplicantNotifications();
  const markRead = useMarkApplicantNotificationRead();
  const markAllRead = useMarkAllApplicantNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const grouped = useMemo(() => {
    return {
      unread: notifications.filter((item) => !item.read),
      read: notifications.filter((item) => item.read),
    };
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-3xl bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="relative overflow-hidden rounded-[28px] border border-[#d6e1eb] bg-gradient-to-br from-[#2f6fa4] via-[#255b89] to-[#1a3d5c] p-6 text-white shadow-[0_20px_50px_rgba(37,91,142,0.2)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
              <Bell className="h-3.5 w-3.5" />
              Hiring updates
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Notifications</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Stay updated when employers make hiring decisions. Email alerts and in-app updates appear here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 ? (
              <Button
                variant="secondary"
                className="rounded-full bg-white text-[#2f6fa4] hover:bg-white/90"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            ) : null}
            <Button asChild variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link href="/applicant/applications">View applications</Link>
            </Button>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed border-[#d6e1eb]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef5fb] text-[#2f6fa4]">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-[#27425f]">No notifications yet</h3>
            <p className="mt-2 max-w-md text-[#75889c]">
              When an employer hires you or updates your application outcome, you will see it here and receive an email.
            </p>
            <Button asChild className="mt-6 rounded-full bg-[#2f6fa4] hover:bg-[#255b89]">
              <Link href="/applicant">
                <Sparkles className="mr-2 h-4 w-4" />
                Discover jobs
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.unread.length > 0 ? (
            <NotificationSection
              title={`New (${grouped.unread.length})`}
              items={grouped.unread}
              onMarkRead={(id) => markRead.mutate({ notificationId: id })}
              isMarking={markRead.isPending}
            />
          ) : null}

          {grouped.read.length > 0 ? (
            <NotificationSection
              title="Earlier"
              items={grouped.read}
              onMarkRead={(id) => markRead.mutate({ notificationId: id })}
              isMarking={markRead.isPending}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function NotificationSection({
  title,
  items,
  onMarkRead,
  isMarking,
}: {
  title: string;
  items: Array<{
    id: string;
    type: "hired" | "rejected";
    title: string;
    message: string;
    jobTitle: string;
    employerName: string;
    emailSent: boolean;
    emailError?: string;
    read: boolean;
    createdAt: string;
  }>;
  onMarkRead: (id: string) => void;
  isMarking: boolean;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-[#2f5e8f]">{title}</h3>
      <div className="grid gap-4">
        {items.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            onMarkRead={() => onMarkRead(item.id)}
            isMarking={isMarking}
          />
        ))}
      </div>
    </section>
  );
}

function NotificationCard({
  item,
  onMarkRead,
  isMarking,
}: {
  item: {
    id: string;
    type: "hired" | "rejected";
    title: string;
    message: string;
    jobTitle: string;
    employerName: string;
    emailSent: boolean;
    emailError?: string;
    read: boolean;
    createdAt: string;
  };
  onMarkRead: () => void;
  isMarking: boolean;
}) {
  const isHired = item.type === "hired";

  return (
    <Card
      className={`overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(37,91,142,0.12)] ${
        item.read ? "border-[#e2ecf5] bg-white" : "border-[#c9dff1] bg-[#f8fcff]"
      }`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              isHired ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {isHired ? <PartyPopper className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-semibold text-[#24364a]">{item.title}</h4>
                  {!item.read ? (
                    <Badge className="rounded-full bg-[#2f6fa4] text-white hover:bg-[#2f6fa4]">New</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[#6d8195]">
                  {item.employerName} · {item.jobTitle}
                </p>
              </div>
              <div className="text-right text-xs text-[#8a99ab]">
                <p>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                <p>{format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#506274]">{item.message}</p>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`gap-1.5 rounded-full ${
                  item.emailSent
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                {item.emailSent ? "Email sent" : "In-app only"}
              </Badge>
              {!item.read ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={isMarking}
                  onClick={onMarkRead}
                >
                  Mark as read
                </Button>
              ) : null}
              <Button asChild size="sm" className="rounded-full bg-[#2f6fa4] hover:bg-[#255b89]">
                <Link href="/applicant/applications">Open application</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
