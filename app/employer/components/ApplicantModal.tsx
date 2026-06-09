"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Mail, Phone, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useListJobPostApplicants, useUpdateApplicantStatus } from "../api-client-react";
import { getApplicantAppliedDate, getApplicantContact, getApplicantName } from "@/app/employer/lib/applicant-display";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface ApplicantModalProps {
  jobPostId: string;
  open: boolean;
  onClose: () => void;
}

export function ApplicantModal({ jobPostId, open, onClose }: ApplicantModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const updateStatus = useUpdateApplicantStatus();

  const { data: applicants = [], isLoading } = useListJobPostApplicants(jobPostId);

  const filteredApplicants = applicants.filter((app: any) => {
    const name = getApplicantName(app);
    const matchesSearch =
      searchTerm === "" ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "yellow", text: "yellow", label: "Pending" },
      reviewing: { bg: "blue", text: "blue", label: "Reviewing" },
      for_interview: { bg: "cyan", text: "cyan", label: "For Interview" },
      hired: { bg: "green", text: "green", label: "Hired" },
      rejected: { bg: "red", text: "red", label: "Rejected" },
    };
    const c = colors[status] || { bg: "slate", text: "slate", label: status };
    return (
      <Badge 
        variant="secondary" 
        className={`bg-${c.bg}-500/20 text-${c.text}-700 border-${c.bg}-500/30`}
      >
        {c.label}
      </Badge>
    );
  };

  const handleStatusUpdate = (applicant: any, status: 'hired' | 'rejected') => {
    updateStatus.mutate(
      { id: applicant.id, data: { status } },
      {
        onSuccess: () => {
          toast({
            title: `Applicant ${status}`,
            description: `${getApplicantName(applicant)} updated to ${status}.`,
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Job Applicants</DialogTitle>
          <DialogDescription>
            Review candidates who applied to this job post. {filteredApplicants.length} found.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applicants..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="for_interview">For Interview</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredApplicants.length ? (
                filteredApplicants.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{getApplicantName(app)}</TableCell>
                    <TableCell>{format(new Date(getApplicantAppliedDate(app)), "MMM dd")}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {app.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {getApplicantContact(app)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {['hired', 'rejected'].includes(app.status) ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/employer/applicants/${app.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Link>
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(app, "hired")}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Hire
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusUpdate(app, "rejected")}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No applicants for this job post yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

