"use client";

import { format } from 'date-fns';
import { useState } from 'react';
import { useListHiredApplicants } from '@workspace/api-client-react';
import { Search, Phone, Mail, Award, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { getMailtoHref } from '@/app/employer/lib/portal-actions';
import { ApplicantAvatar } from '@/components/applicant-avatar';

interface HiredApplicant {
  id: string;
  fullName: string;
  position: string;
  title?: string;
  hiredDate?: string;
  contact?: string;
  email?: string;
  photoUrl?: string | null;
}

export default function Hired() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: hiredApplicants = [], isLoading } = useListHiredApplicants();
  const typedApplicants = hiredApplicants as HiredApplicant[];

  const filteredHired = typedApplicants.filter((app) => 
    app && (
      (app.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const safeDateFormat = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Not recorded';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Not recorded' : format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hired Candidates</h2>
          <p className="text-muted-foreground">Your successful hires and current employees from the portal.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search employees..."
            className="pl-8 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Successful Hires
          </CardTitle>
          <CardDescription>
            You have hired {filteredHired?.length || 0} candidates through Barangay 634 Portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Employee Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Date Hired</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6"><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredHired?.length ? (
                  filteredHired.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium pl-6">
                        <div className="flex items-center gap-3">
                          <ApplicantAvatar name={employee.fullName} photoUrl={employee.photoUrl} size="sm" />
                          {employee.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal bg-muted/50">
                          {employee.title ?? employee.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {safeDateFormat(employee.hiredDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {employee.contact || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <a
                            href={getMailtoHref(
                              employee.email || '',
                              'Barangay 634 Employment Check-in',
                              `Hello ${employee.fullName},\n\nThis is a quick follow-up regarding your employment with Barangay 634 Portal.`,
                            )}
                          >
                            <Mail className="h-4 w-4" />
                            Message
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No hired candidates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
