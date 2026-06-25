import { SiteHeader } from "@/components/site-header";
import { FleetBar } from "@/components/fleet/fleet-bar";
import { MobileNav } from "@/components/mobile-nav";

/** Auth bypassed for demo — open access. */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = { email: "demo@mbg.id", role: "admin" as const };

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
