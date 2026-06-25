import { redirect } from "next/navigation";

// Auth bypassed for demo — go straight to the dashboard
export default function LandingPage() {
  redirect("/");
}
