import { redirect } from "next/navigation";
import { TodayDashboard } from "@/components/today-dashboard";
import { onboardingStatus } from "@/lib/local-db";
import { isLocalPersistenceAvailable } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export default function Home() {
  if (!isLocalPersistenceAvailable()) redirect("/onboarding?storage=unavailable");
  if (!onboardingStatus().completed) redirect("/onboarding");
  return <TodayDashboard />;
}
