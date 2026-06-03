"use client";

import { format } from "date-fns";
import { useState } from "react";
import { useListInterviews, useRescheduleInterview } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Phone, MapPin, Mail, RefreshCw, Eye, MapPinned } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const rescheduleSchema = z.object({
  interviewDate: z.string().min(1, { message: "Date is required" }),
  interviewTime: z.string().min(1, { message: "Time is required" }),
});

const scheduleSchema = z.object({
  interviewDate: z.string().min(1, { message: "Date is required" }),
  interviewTime: z.string().min(1, { message: "Time is required" }),
  location: z.string().min(1, { message: "Location is required" }),
});

interface InterviewRecord {
  id: string;
  applicationId: string;
  applicantName: string;
  position: string;
  jobTitle?: string;
  contact: string;
  applicantEmail?: string;
  interviewDate: string;
  interviewTime: string;
  location?: string;
}

export default function ForInterview() {
  const { data: interviews = [], isLoading } = useListInterviews();
  const rescheduleInterview = useRescheduleInterview();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const rescheduleForm = useForm<z.infer<typeof rescheduleSchema>>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      interviewDate: "",
      interviewTime: "",
    },
  });

  const scheduleForm = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      interviewDate: "",
      interviewTime: "",
      location: "Barangay 634 Hall",
    },
  });

  const openRescheduleModal = (interview: InterviewRecord) => {
    setSelectedInterviewId(interview.id);
    rescheduleForm.reset({
      interviewDate: interview.interviewDate,
      interviewTime: interview.interviewTime,
    });
    setRescheduleModalOpen(true);
  };

  const openScheduleModal = (interview: InterviewRecord) => {
    setSelectedInterviewId(interview.id);
    setSelectedApplicationId(interview.applicationId);
    scheduleForm.reset({
      interviewDate: interview.interviewDate || "",
      interviewTime: interview.interviewTime || "",
      location: interview.location || "Barangay 634 Hall",
    });
    setScheduleModalOpen(true);
  };

  const onRescheduleSubmit = (values: z.infer<typeof rescheduleSchema>) => {
    if (!selectedInterviewId) return;
    
    rescheduleInterview.mutate(
      { id: selectedInterviewId, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["portal"] });
          setRescheduleModalOpen(false);
          toast({
            title: "Interview Rescheduled",
            description: "The candidate has been notified of the new schedule.",
          });
        }
      }
    );
  };

  const onScheduleSubmit = (values: z.infer<typeof scheduleSchema>) => {
    if (!selectedInterviewId) return;
    
    rescheduleInterview.mutate(
      { id: selectedInterviewId, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["portal"] });
          setScheduleModalOpen(false);
          toast({
            title: "Interview Schedule Updated",
            description: "The schedule has been updated successfully.",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">For Interview</h2>
        <p className="text-muted-foreground">Manage your upcoming interviews with shortlisted candidates.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-3 border-b border-border/50">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="py-4 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : interviews?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(interviews as InterviewRecord[]).map((interview) => {
            const dateObj = new Date(interview.interviewDate);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            
            return (
              <Card key={interview.id} className={`flex flex-col ${isToday ? 'border-cyan-500 shadow-sm' : ''}`}>
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-lg mb-1">{interview.applicantName}</CardTitle>
                      <CardDescription className="font-medium text-foreground">{interview.position}</CardDescription>
                    </div>
                    {isToday && (
                      <Badge className="bg-cyan-500/20 text-cyan-700 border-cyan-500/30 shrink-0">Today</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-4 flex-1 space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4 space-y-3 border border-primary/10">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {format(dateObj, "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {interview.interviewTime}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{interview.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{interview.location || "Barangay 634 Hall"}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 pb-4 border-t border-border flex flex-wrap justify-between gap-2">
                  <Button asChild variant="outline" className="flex-1 gap-2 min-w-[90px]">
                    <a
                      href={`sms:${interview.contact}?body=${encodeURIComponent(
                        `Hello ${interview.applicantName}, this is regarding your interview for ${interview.position}.`,
                      )}`}
                    >
                      <Mail className="h-4 w-4" /> Message
                    </a>
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2 min-w-[110px]"
                    onClick={() => openScheduleModal(interview)}
                  >
                    <Eye className="h-4 w-4" /> Schedule
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1 gap-2 min-w-[110px]"
                    onClick={() => openRescheduleModal(interview)}
                  >
                    <RefreshCw className="h-4 w-4" /> Reschedule
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No Upcoming Interviews</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              You haven&apos;t scheduled any interviews yet. Check your Pending Review tab to find candidates to interview.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="w-full sm:max-w-[425px] max-h-[calc(100vh-4rem)] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              View or update the interview schedule for this candidate.
            </DialogDescription>
          </DialogHeader>
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="space-y-4 py-4">
              <FormField
                control={scheduleForm.control}
                name="interviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="interviewTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter interview location..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                {selectedApplicationId && (
                  <Button asChild variant="secondary" className="w-full sm:w-auto gap-2">
                    <Link href={`/employer/applicants/${selectedApplicationId}`}>
                      <MapPinned className="h-4 w-4" /> Go to Applicant Page
                    </Link>
                  </Button>
                )}
                <Button type="submit" disabled={rescheduleInterview.isPending} className="w-full sm:w-auto">
                  {rescheduleInterview.isPending ? "Saving..." : "Save Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="w-full sm:max-w-[425px] max-h-[calc(100vh-4rem)] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription>
              Set a new date and time for this interview. The candidate will be notified.
            </DialogDescription>
          </DialogHeader>
          <Form {...rescheduleForm}>
            <form onSubmit={rescheduleForm.handleSubmit(onRescheduleSubmit)} className="space-y-4 py-4">
              <FormField
                control={rescheduleForm.control}
                name="interviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rescheduleForm.control}
                name="interviewTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setRescheduleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={rescheduleInterview.isPending}>
                  {rescheduleInterview.isPending ? "Saving..." : "Save Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

