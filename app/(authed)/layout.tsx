import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { FleetBar } from "@/components/fleet/fleet-bar";
import { MobileNav } from "@/components/mobile-nav";
import { getAppSession } from "@/lib/auth/session";

/** Gate: only authenticated users see the app. Renders the chrome for them. */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  if (!session) redirect("/landing");

  return (
    <>
      <SiteHeader email={session.email} role={session.role} />
      <FleetBar />
      <div className="fade-up pb-20 sm:pb-0" style={{ paddingBottom: 'max(5rem, calc(4rem + env(safe-area-inset-bottom)))' }}>
        {children}
      </div>
      <MobileNav />
    </>
  );
}
