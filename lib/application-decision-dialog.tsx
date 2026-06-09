"use client";

import { Loader2, Send } from "lucide-react";
import { ApplicationDecisionPreview } from "@/lib/application-decision-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ApplicationDecisionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  employerName: string;
  decision: "hired" | "rejected";
  isSubmitting?: boolean;
  onConfirm: () => void;
};

export function ApplicationDecisionDialog({
  open,
  onOpenChange,
  applicantName,
  applicantEmail,
  jobTitle,
  employerName,
  decision,
  isSubmitting = false,
  onConfirm,
}: ApplicationDecisionDialogProps) {
  const isHired = decision === "hired";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border bg-white p-0 shadow-xl sm:max-w-xl">
        <DialogHeader className="shrink-0 space-y-1.5 border-b bg-white px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {isHired ? "Confirm hire" : "Confirm decision"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {applicantName} will be marked as {isHired ? "hired" : "not selected"} for {jobTitle} and receive an email
            plus in-app notification.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto overscroll-contain bg-white px-6 py-5">
          <ApplicationDecisionPreview
            applicantName={applicantName}
            applicantEmail={applicantEmail}
            jobTitle={jobTitle}
            employerName={employerName}
            decision={decision}
          />
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-white px-6 py-4 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting} variant={isHired ? "default" : "destructive"}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {isHired ? "Hire & send email" : "Confirm & send email"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
