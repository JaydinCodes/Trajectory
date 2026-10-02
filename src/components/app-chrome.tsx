"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BriefcaseBusiness, ChartNoAxesCombined, CircleUserRound, Home, Lightbulb, Map, Search, Settings, Sparkles } from "lucide-react";

const nav = [
  { href: "/", icon: Home, label: "Today" }, { href: "/trajectory", icon: ChartNoAxesCombined, label: "Trajectory" },
  { href: "/areas", icon: Sparkles, label: "Areas" }, { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/insights", icon: Lightbulb, label: "Insights" }, { href: "/review", icon: BriefcaseBusiness, label: "Review" },
  { href: "/review/season", icon: ChartNoAxesCombined, label: "Season Review" }, { href: "/plan/season", icon: Map, label: "Plan season" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="app-content"><aside className="icon-rail"><Link className="brand" href="/">T<i>·</i></Link>{nav.map(({ href, icon: Icon, label }) => <Link key={href} href={href} className={pathname === href ? "active" : ""} aria-label={label} title={label}><Icon size={20} /></Link>)}<div className="rail-bottom"><Link href="/search" aria-label="Search" title="Search"><Search size={19} /></Link><Link href="/settings" aria-label="Settings" title="Settings"><Settings size={19} /></Link><Link href="/settings" aria-label="Profile" title="Profile"><CircleUserRound size={19} /></Link></div></aside>{children}</div>;
}
