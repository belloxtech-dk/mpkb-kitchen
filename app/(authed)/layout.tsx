import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { FleetBar } from "@/components/fleet/fleet-bar";
import { getAppSession } from "@/lib/auth/session";
import { getModel } from "@/lib/anthropic";

/** Gate: only authenticated users see the app. Renders the chrome for them. */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  if (!session) redirect("/landing");
  const model = await getModel();

  return (
    <>
      <SiteHeader email={session.email} role={session.role} model={model} />
      <FleetBar />
      {children}
    </>
  );
}
