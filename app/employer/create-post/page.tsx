"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  CalendarRange,
  ClipboardList,
  HeartHandshake,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";

import { useCreateJobPost } from "../api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  postType: z.enum(["establishment_job", "resident_service"]),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).trim(),
  position: z.string().min(1, { message: "Position is required." }).trim(),
  qualifications: z.string().trim().min(1, "Qualifications required"),
  employerRequirements: z
    .string()
    .min(5, { message: "Enter at least one requirement (e.g. Resume, ID)" })
    .trim()
    .refine((val) => val.split(",").some((item) => item.trim()), {
      message: "At least one non-empty requirement needed after splitting by comma.",
    }),
  adminRequirements: z
    .string()
    .min(5, { message: "Enter at least one requirement (e.g. Valid ID, Clearance)" })
    .trim()
    .refine((val) => val.split(",").some((item) => item.trim()), {
      message: "At least one non-empty requirement needed after splitting by comma.",
    }),
  description: z.string().optional(),
  postingStartDate: z.string().optional(),
  postingEndDate: z.string().optional(),
  shifts: z.array(z.string()).default([]),
  pwdFriendly: z.boolean().default(false),
  seniorFriendly: z.boolean().default(false),
  accessibilityFeatures: z.array(z.string()).default([]),
});

const SHIFT_OPTIONS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "flexible", label: "Flexible" },
  { id: "fulltime", label: "Full-time" },
];

const ACCESSIBILITY_OPTIONS = [
  { id: "wheelchair_access", label: "Wheelchair access" },
  { id: "accessible_restroom", label: "Accessible restrooms" },
  { id: "hearing_assistance", label: "Hearing assistance" },
  { id: "visual_assistance", label: "Visual assistance" },
  { id: "transportation", label: "Transport help" },
  { id: "flexible_hours", label: "Flexible hours" },
  { id: "remote_option", label: "Remote option" },
  { id: "reasonable_accommodations", label: "Accommodations" },
];

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#d6e1eb] bg-white p-5 shadow-[0_12px_30px_rgba(37,91,142,0.06)] sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-[#e8f0f6] pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5fb] text-[#2f6fa4]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#24364a]">{title}</h3>
          <p className="mt-0.5 text-sm text-[#6d8195]">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export default function CreatePost() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPost = useCreateJobPost();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postType: "establishment_job",
      title: "",
      position: "",
      qualifications: "",
      employerRequirements: "",
      adminRequirements: "",
      description: "",
      postingStartDate: "",
      postingEndDate: "",
      shifts: [],
      pwdFriendly: false,
      seniorFriendly: false,
      accessibilityFeatures: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const employerRequirements = values.employerRequirements
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const adminRequirements = values.adminRequirements
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const submittedData = {
      ...values,
      employerRequirements,
      adminRequirements,
      requirements: adminRequirements.join(", "),
      postingStartDate: values.postingStartDate ? new Date(values.postingStartDate) : undefined,
      postingEndDate: values.postingEndDate ? new Date(values.postingEndDate) : undefined,
    };

    createPost.mutate(
      { data: submittedData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["portal"] });
          queryClient.invalidateQueries({ queryKey: ["employer-job-posts"] });
          toast({
            title: "Post submitted",
            description:
              "Your job post is pending admin review. It will go live for applicants once approved.",
          });
          router.push("/employer/my-job-posts");
        },
        onError: (error: unknown) => {
          toast({
            title: "Submission failed",
            description: error instanceof Error ? error.message : "Failed to create job post. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild className="mt-0.5 shrink-0 rounded-xl border-[#d6e1eb]">
            <Link href="/employer/my-job-posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Create New Post</h2>
            <p className="mt-1 text-sm text-[#73869a]">
              Publish a job or service opportunity for Barangay 634 applicants.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#dce8f3] bg-[#f8fbfd] px-4 py-3 text-sm text-[#4d6277]">
        <span className="font-medium text-[#2f6fa4]">Admin review required.</span> Posts stay hidden until approved.
        Include inclusive hiring details when applicable.
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <SectionCard
            icon={Briefcase}
            title="Basic information"
            description="Core details applicants will see on the job board."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="postType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#24364a]">Post type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="establishment_job">Establishment job</SelectItem>
                        <SelectItem value="resident_service">Resident service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#24364a]">Position / role</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Cashier, Rider"
                        className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#24364a]">Post title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Store staff needed — morning shift"
                      className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Short headline shown in job listings.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#24364a]">Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Role overview, responsibilities, and work environment..."
                      className="min-h-[110px] resize-y rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>

          <SectionCard
            icon={CalendarRange}
            title="Schedule & posting period"
            description="When the post is active and what shifts are available."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="postingStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#24364a]">Start date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postingEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#24364a]">End date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-xl border-[#d6e1eb] bg-[#fbfdff]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shifts"
              render={() => (
                <FormItem>
                  <FormLabel className="text-[#24364a]">Available shifts</FormLabel>
                  <FormDescription>Select all that apply.</FormDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SHIFT_OPTIONS.map((shift) => (
                      <FormField
                        key={shift.id}
                        control={form.control}
                        name="shifts"
                        render={({ field }) => {
                          const selected = field.value?.includes(shift.id);
                          return (
                            <FormItem>
                              <FormControl>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = selected
                                      ? field.value?.filter((value) => value !== shift.id) || []
                                      : [...(field.value || []), shift.id];
                                    field.onChange(next);
                                  }}
                                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                                    selected
                                      ? "border-[#2f6fa4] bg-[#2f6fa4] text-white"
                                      : "border-[#d6e1eb] bg-white text-[#506274] hover:border-[#b9d0e8]"
                                  }`}
                                >
                                  {shift.label}
                                </button>
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>

          <SectionCard
            icon={ClipboardList}
            title="Qualifications & requirements"
            description="What candidates need to apply and get verified."
          >
            <FormField
              control={form.control}
              name="qualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#24364a]">Candidate qualifications</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. At least 18 years old, HS graduate, basic computer skills"
                      className="min-h-[100px] resize-y rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="employerRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#24364a]">Employer requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Resume, ID, certificates"
                        className="min-h-[100px] resize-y rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated documents you need from applicants.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#24364a]">Admin requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Valid ID, barangay clearance"
                        className="min-h-[100px] resize-y rounded-xl border-[#d6e1eb] bg-[#fbfdff]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Files admin must verify before the post goes live.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={HeartHandshake}
            title="Inclusive hiring"
            description="PWD and senior-friendly options for R.A. compliance."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="pwdFriendly"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-xl border border-[#e2ecf5] bg-[#f8fbfd] p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                    </FormControl>
                    <div>
                      <FormLabel className="cursor-pointer font-medium text-[#24364a]">PWD friendly</FormLabel>
                      <FormDescription className="text-xs">Welcomes applicants with disabilities.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seniorFriendly"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-xl border border-[#e2ecf5] bg-[#f8fbfd] p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                    </FormControl>
                    <div>
                      <FormLabel className="cursor-pointer font-medium text-[#24364a]">Senior friendly (60+)</FormLabel>
                      <FormDescription className="text-xs">Open to senior citizen applicants.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accessibilityFeatures"
              render={() => (
                <FormItem>
                  <FormLabel className="text-[#24364a]">Accessibility features</FormLabel>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ACCESSIBILITY_OPTIONS.map((feature) => (
                      <FormField
                        key={feature.id}
                        control={form.control}
                        name="accessibilityFeatures"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border border-[#e8f0f6] bg-white px-3 py-2.5">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                  const next = checked
                                    ? [...(field.value || []), feature.id]
                                    : field.value?.filter((value) => value !== feature.id) || [];
                                  field.onChange(next);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-sm font-normal text-[#506274]">
                              {feature.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>

          <div className="sticky bottom-0 z-10 -mx-1 rounded-2xl border border-[#d6e1eb] bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(37,91,142,0.08)] backdrop-blur sm:px-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-[#6d8195]">
                <ShieldCheck className="h-4 w-4 text-[#2f6fa4]" />
                Submissions are reviewed by barangay admin before going live.
              </p>
              <div className="flex gap-2 sm:justify-end">
                <Button type="button" variant="outline" asChild className="rounded-xl border-[#d6e1eb]">
                  <Link href="/employer/my-job-posts">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={createPost.isPending}
                  className="rounded-xl bg-[#2f6fa4] px-6 hover:bg-[#255b89]"
                >
                  {createPost.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit for review
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
