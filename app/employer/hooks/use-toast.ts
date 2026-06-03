"use client";

import { toast } from "sonner";

export function useToast() {
  return {
    toast: toast as any,
  };
}
