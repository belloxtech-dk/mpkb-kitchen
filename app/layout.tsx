import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { I18nProvider } from "@/lib/i18n/context";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPKB — Kitchen Integrity",
  description: "Real-time AI monitoring of kitchen SOP compliance and financial integrity.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale}>
          <SiteHeader />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
