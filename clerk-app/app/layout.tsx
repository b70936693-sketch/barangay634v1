import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const clerkMetadataBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(clerkMetadataBaseUrl),
  title: "Clerk App",
  description: "Authenticated Clerk app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
