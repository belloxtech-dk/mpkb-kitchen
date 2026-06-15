import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPKB — Kitchen Integrity",
  description: "Real-time AI monitoring of kitchen SOP compliance and financial integrity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
