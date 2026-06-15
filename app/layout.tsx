import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPKB — Kitchen Integrity",
  description: "Real-time AI monitoring of kitchen SOP compliance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
