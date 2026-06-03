"use client";

import Link from 'next/link';
import { format } from 'date-fns';
import { useState } from 'react';
import { useListApplicants, useUpdateApplicantStatus } from '@workspace/api-client-react';
import { Search, Eye, Filter, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getDocumentHref, getDocumentName } from '@/app/employer/lib/portal-actions';

interface ApplicantDocument {
  id?: string;
  name?: string;
  url?: string;
  path?: string;
}

interface ApplicantRow {
  id: string;
  fullName: string;
  position: string;
  appliedDate: string;
  status: string;
  contact?: string;
  phone?: string;
  title?: string;
  jobPostTitle?: string;
  documents?: Array<string | ApplicantDocument>;
}

export default function AllApplicants() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeApplicant, setActiveApplicant] = useState<ApplicantRow | null>(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const { toast } = useToast();
  const updateStatus = useUpdateApplicantStatus();

  const { data: applicants = [], isLoading } = useListApplicants();
  const typedApplicants = applicants as ApplicantRow[];

  const openApplicantDocuments = (applicant: ApplicantRow) => {
    setActiveApplicant(applicant);
    setIsDocumentDialogOpen(true);
  };

  const closeApplicantDocuments = () => {
    setActiveApplicant(null);
    setIsDocumentDialogOpen(false);
  };

  const handleApplicantStatus = (
    applicant: ApplicantRow,
    status: 'hired' | 'rejected' | 'for_interview',
  ) => {
    updateStatus.mutate(
      { id: applicant.id, data: { status } },
      {
        onSuccess: () => {
          toast({
            title:
              status === 'hired'
                ? 'Applicant hired'
                : status === 'rejected'
                ? 'Applicant rejected'
                : 'Applicant set for interview',
            description: `${applicant.fullName} has been marked as ${status.replace('_', ' ')}.`,
          });
        },
      }
    );
  };

  const filteredApplicants = typedApplicants.filter((app) => {
    const matchesSearch = searchTerm === '' || 
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.title || app.position || app.jobPostTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const safeDateFormat = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM d, yyyy');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Pending</Badge>;
      case 'reviewing':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30">Reviewing</Badge>;
      case 'for_interview':
        return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-700 border-cyan-500/30">For Interview</Badge>;
      case 'hired':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">Hired</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-700 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Applicants</h2>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium">Applicants</CardTitle>
              <CardDescription>
                {filteredApplicants?.length || 0} candidates found
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or role..."
                  className="pl-8 bg-card"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-card">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="for_interview">For Interview</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[180px] min-w-[140px]">Name</TableHead>
                  <TableHead className="w-[160px] min-w-[120px]">Position</TableHead>
                  <TableHead className="w-[110px] min-w-[90px]">Applied Date</TableHead>
                  <TableHead className="w-[100px] min-w-[80px]">Status</TableHead>
                  <TableHead className="w-[150px] min-w-[120px]">Contact</TableHead>
                  <TableHead className="text-right pr-6 w-[165px] min-w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6"><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredApplicants?.length ? (
                  filteredApplicants.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell className="font-medium pl-6">{applicant.fullName}</TableCell>
                      <TableCell>{applicant.position}</TableCell>
                      <TableCell>{safeDateFormat(applicant.appliedDate)}</TableCell>
                      <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                      <TableCell className="max-w-[150px] min-w-0 truncate">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{applicant.contact || applicant.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 align-top min-w-0">
                        <div className="flex items-center justify-end gap-2 flex-nowrap max-w-[220px]">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 min-w-0 whitespace-nowrap"
                            onClick={() => openApplicantDocuments(applicant)}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Documents</span>
                          </Button>
                          {applicant.status === 'hired' || applicant.status === 'rejected' ? (
                            <Button asChild variant="secondary" size="sm" className="gap-1 min-w-0 whitespace-nowrap">
                              <Link href={`/employer/applicants/${applicant.id}`} className="flex items-center gap-1.5 whitespace-nowrap">
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">View</span>
                              </Link>
                            </Button>
                          ) : (
                            <>
                              {(applicant.status === 'pending' || applicant.status === 'reviewing') && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="gap-1 min-w-0 whitespace-nowrap"
                                  onClick={() => handleApplicantStatus(applicant, 'for_interview')}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span className="hidden xl:inline">Set Interview</span>
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                className="gap-1 min-w-0 whitespace-nowrap"
                                onClick={() => handleApplicantStatus(applicant, 'hired')}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">Hire</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1 min-w-0 whitespace-nowrap"
                                onClick={() => handleApplicantStatus(applicant, 'rejected')}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">Reject</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No applicants match your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDocumentDialogOpen} onOpenChange={(open) => { if (!open) closeApplicantDocuments(); }}>
        <DialogContent className="max-w-2xl bg-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Submitted documents for {activeApplicant?.fullName}</DialogTitle>
            <DialogDescription>Review the files this candidate uploaded with their application.</DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            {activeApplicant?.documents?.length ? (
              activeApplicant.documents.map((doc, index: number) => {
                const documentHref = getDocumentHref(doc);

                return (
                  <div key={`${getDocumentName(doc)}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{getDocumentName(doc)}</p>
                      <p className="text-sm text-muted-foreground">Uploaded document</p>
                    </div>
                    {documentHref ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={documentHref} target="_blank" rel="noreferrer">
                          View
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Document preview unavailable</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No submitted documents were found for this applicant.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={closeApplicantDocuments}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
