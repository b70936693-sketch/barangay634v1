"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJobPost } from "../api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  postType: z.enum(["establishment_job", "resident_service"]),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).trim(),
  position: z.string().min(1, { message: "Position is required." }).trim(),
  qualifications: z.string().trim().min(1, "Qualifications required"),
  employerRequirements: z.string().min(5, {
    message: "Enter at least one requirement (e.g. Resume, ID)",
  }).trim().refine((val) => val.split(",").some(item => item.trim()), {
    message: "At least one non-empty requirement needed after splitting by comma.",
  }),
  adminRequirements: z.string().min(5, {
    message: "Enter at least one requirement (e.g. Valid ID, Clearance)",
  }).trim().refine((val) => val.split(",").some(item => item.trim()), {
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
  { id: "flexible", label: "Flexible/Part-time" },
  { id: "fulltime", label: "Full-time (Fixed)" },
];

const ACCESSIBILITY_OPTIONS = [
  { id: "wheelchair_access", label: "Wheelchair Accessible" },
  { id: "accessible_restroom", label: "Accessible Restrooms" },
  { id: "hearing_assistance", label: "Hearing Assistance Available" },
  { id: "visual_assistance", label: "Visual Assistance Available" },
  { id: "transportation", label: "Transportation Assistance" },
  { id: "flexible_hours", label: "Flexible Work Hours" },
  { id: "remote_option", label: "Remote Work Option" },
  { id: "reasonable_accommodations", label: "Reasonable Accommodations" },
];

export default function CreatePost() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPost = useCreateJobPost();

  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postType: "establishment_job",
      title: "Store Staff Needed",
      position: "Cashier",
      qualifications: "HS grad, computer skills, good comm.",
      employerRequirements: "Resume, ID",
      adminRequirements: "Valid ID, Clearance",
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
            title: "Success",
            description: "Your job post has been submitted for admin review. It will appear to applicants once approved.",
          });
          router.push("/employer/my-job-posts");
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.message ?? "Failed to create job post. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href="/employer/my-job-posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Post</h2>
          <p className="text-muted-foreground">Fill out the details below to publish a new job or service opportunity.</p>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Republic Act 9165 Compliance:</strong> Indicate if this position is PWD or Senior Citizen-friendly to ensure inclusive hiring practices and compliance with local regulations.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>The core details about this opportunity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="postType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Post Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a post type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="establishment_job">Establishment Job</SelectItem>
                          <SelectItem value="resident_service">Resident Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Is this a formal job in your business or a one-off service request?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Position / Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Cashier, Delivery Rider" {...field} />
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
                    <FormLabel required>Post Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Urgent: Looking for Full-Time Cashier" {...field} />
                    </FormControl>
                    <FormDescription>
                      A catchy title that will appear in the job board list.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide an overview of the role, responsibilities, and working environment..." 
                        className="min-h-[100px] resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posting Period & Schedule</CardTitle>
              <CardDescription>Set when this job posting is active and what work hours are available.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="postingStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posting Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When should this posting become visible to applicants?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postingEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posting End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When should this posting expire or be closed?
                      </FormDescription>
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
                    <FormLabel>Available Work Shifts/Hours</FormLabel>
                    <FormDescription>Select all shift options available for this position.</FormDescription>
                    <div className="space-y-3 mt-4">
                      {SHIFT_OPTIONS.map((shift) => (
                        <FormField
                          key={shift.id}
                          control={form.control}
                          name="shifts"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(shift.id)}
                                  onCheckedChange={(checked) => {
                                    const newShifts = checked
                                      ? [...(field.value || []), shift.id]
                                      : field.value?.filter((v) => v !== shift.id) || [];
                                    field.onChange(newShifts);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">{shift.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Qualifications & Requirements</CardTitle>
              <CardDescription>What candidates need to apply and get hired.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="qualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Candidate Qualifications</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List qualifications needed (e.g. age 18+, HS diploma, 1yr exp). Min 10 chars." 
                        className="min-h-[120px] resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      List the skills, education, or experience needed for the role.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employerRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Employer Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g. Updated resume/CV, Barangay clearance" 
                        className="min-h-[120px] resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      List the documents or role-specific files the employer needs to review.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Admin Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g. Valid ID, Proof of address" 
                        className="min-h-[120px] resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      List the verification files the admin will require before the posting goes live.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inclusive Hiring & Accessibility (R.A. Compliance)</CardTitle>
              <CardDescription>Indicate support for persons with disabilities and senior citizens as per Republic Act requirements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="pwdFriendly"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 flex-1">
                        <FormLabel className="font-semibold cursor-pointer">PWD (Person with Disability) Friendly</FormLabel>
                        <FormDescription>
                          Check if this position welcomes applicants with disabilities and accommodations can be provided.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seniorFriendly"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 flex-1">
                        <FormLabel className="font-semibold cursor-pointer">Senior Citizen Friendly (60+ years)</FormLabel>
                        <FormDescription>
                          Check if this position is open to senior citizens and appropriate accommodations are available.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6">
                <FormField
                  control={form.control}
                  name="accessibilityFeatures"
                  render={() => (
                    <FormItem>
                      <FormLabel>Available Accessibility Features</FormLabel>
                      <FormDescription>Select all applicable accessibility features for this position.</FormDescription>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {ACCESSIBILITY_OPTIONS.map((feature) => (
                          <FormField
                            key={feature.id}
                            control={form.control}
                            name="accessibilityFeatures"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                      const newFeatures = checked
                                        ? [...(field.value || []), feature.id]
                                        : field.value?.filter((v) => v !== feature.id) || [];
                                      field.onChange(newFeatures);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{feature.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

            <CardFooter className="bg-muted/30 border-t border-border flex justify-end gap-4 py-4 px-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/employer/my-job-posts">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createPost.isPending}>
                {createPost.isPending ? (
                  "Publishing..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Publish Job Post
                  </>
                )}
              </Button>
            </CardFooter>
        </form>
      </Form>
    </div>
  );
}
