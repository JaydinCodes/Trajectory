"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CalendarDays, ChartNoAxesCombined, History, Home, Lightbulb, Map, Menu, Search, Settings, Sparkles, Target, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { QuickLogDialog } from "@/components/quick-log-dialog";

type QuickLogContextValue = { openQuickLog: () => void };
const QuickLogContext = createContext<QuickLogContextValue | null>(null);
export function useQuickLog() { return useContext(QuickLogContext); }

const primaryNav = [
  { href: "/", icon: Home, label: "Today" },
  { href: "/review", icon: CalendarDays, label: "Review", matches: ["/review", "/review/season", "/plan/season"] },
  { href: "/direction", icon: Map, label: "Direction" },
  { href: "/history", icon: History, label: "History" },
  { href: "/patterns", icon: Lightbulb, label: "Patterns" },
];
const moreNav = [
  { href: "/areas", icon: Sparkles, label: "Areas & goals" }, { href: "/journal", icon: BookOpen, label: "Journal" }, { href: "/milestones", icon: Target, label: "Milestones" }, { href: "/trajectory", icon: ChartNoAxesCombined, label: "Current trajectory" }, { href: "/search", icon: Search, label: "Search" }, { href: "/settings", icon: Settings, label: "Settings" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const [quickLogOpen, setQuickLogOpen] = useState(false); const [paletteOpen, setPaletteOpen] = useState(false); const [moreOpen, setMoreOpen] = useState(false); const [notice, setNotice] = useState(""); const [onboardingChecked, setOnboardingChecked] = useState(false); const [onboardingComplete, setOnboardingComplete] = useState(true); const [persistence, setPersistence] = useState<"checking" | "ready" | "unavailable">("checking"); const lastFocused = useRef<HTMLElement | null>(null);
  const inOnboarding = pathname === "/onboarding";
  const openQuickLog = () => { lastFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setQuickLogOpen(true); };
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { const editable = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement; if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(true); } if (event.key === "Escape") { setMoreOpen(false); setPaletteOpen(false); } if (!editable && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === "l") { event.preventDefault(); openQuickLog(); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, []);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(""), 4000); return () => window.clearTimeout(timeout); }, [notice]);
  useEffect(() => { if (inOnboarding) return; let current = true; void fetch("/api/health").then((response) => { if (current) setPersistence(response.ok ? "ready" : "unavailable"); }).catch(() => current && setPersistence("unavailable")); return () => { current = false; }; }, [inOnboarding]);
  useEffect(() => { if (inOnboarding || persistence !== "ready") return; let current = true; void fetch("/api/onboarding").then(async (response) => ({ response, body: await response.json() as { completed?: boolean } })).then(({ response, body }) => { if (!current || !response.ok) return; setOnboardingComplete(body.completed === true); setOnboardingChecked(true); }).catch(() => current && setOnboardingChecked(true)); return () => { current = false; }; }, [inOnboarding, persistence]);
  useEffect(() => { const completed = () => setOnboardingComplete(true); window.addEventListener("trajectory:onboarding-completed", completed); return () => window.removeEventListener("trajectory:onboarding-completed", completed); }, []);
  useEffect(() => { if (onboardingChecked && !onboardingComplete && pathname !== "/onboarding") router.replace("/onboarding"); }, [onboardingChecked, onboardingComplete, pathname, router]);
  const navigate = (href: string) => { setPaletteOpen(false); setMoreOpen(false); router.push(href); };
  const isActive = (item: { href: string; matches?: string[] }) => item.matches ? item.matches.some((route) => pathname === route || pathname.startsWith(`${route}/`)) : pathname === item.href;
  const action = (label: string, fn: () => void) => <button key={label} onClick={fn}>{label}</button>;
  if (!inOnboarding && persistence !== "ready") return <main className="section-page"><p className="eyebrow">{persistence === "checking" ? "Opening Trajectory" : "Storage unavailable"}</p><h1>{persistence === "checking" ? "Preparing your local record." : "This deployment cannot access durable Trajectory storage."}</h1><p>{persistence === "checking" ? "Checking local SQLite before loading your record." : "Local SQLite is authoritative at this stage. This hosted deployment does not display empty data as though it were your record."}</p></main>;
  return <QuickLogContext.Provider value={{ openQuickLog }}><div className="app-content">
    {!inOnboarding && <>
    <aside className="product-nav" aria-label="Primary navigation"><Link className="product-brand" href="/" aria-label="Trajectory home">T<span>·</span></Link><nav>{primaryNav.map(({ href, icon: Icon, label, ...item }) => <Link key={href} href={href} className={isActive({ href, ...item }) ? "active" : ""}><Icon size={18} /><span>{label}</span></Link>)}</nav><div className="product-nav-footer"><button onClick={openQuickLog}><span className="nav-plus">+</span><span>Log</span><kbd>L</kbd></button><button onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><Menu size={18} /><span>More</span></button></div></aside>
    <nav className="mobile-nav" aria-label="Primary navigation">{primaryNav.map(({ href, icon: Icon, label, ...item }) => <Link key={href} href={href} className={isActive({ href, ...item }) ? "active" : ""}><Icon size={18} /><span>{label}</span></Link>)}<button onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><Menu size={18} /><span>More</span></button></nav>
    {moreOpen && <div className="more-menu" role="menu">{moreNav.map(({ href, icon: Icon, label }) => <Link key={href} href={href} role="menuitem" onClick={() => setMoreOpen(false)}><Icon size={17} />{label}</Link>)}</div>}</>}
    {children}
    {!inOnboarding && <QuickLogDialog open={quickLogOpen} onOpenChange={(value) => { setQuickLogOpen(value); if (!value) requestAnimationFrame(() => lastFocused.current?.focus()); }} onSaved={setNotice} />}
    {notice && <div className="product-toast" role="status"><span aria-hidden="true">✓</span>{notice}</div>}
    {!inOnboarding && paletteOpen && <div className="command-overlay" role="presentation" onMouseDown={() => setPaletteOpen(false)}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Quick actions" onMouseDown={(event) => event.stopPropagation()}><header><span>Quick actions</span><button aria-label="Close quick actions" onClick={() => setPaletteOpen(false)}><X size={18} /></button></header><div>{action("Log evidence", () => { setPaletteOpen(false); openQuickLog(); })}{action("Go to weekly review", () => navigate("/review"))}{action("Go to current season", () => navigate("/trajectory"))}{action("Open history", () => navigate("/history"))}{action("Search your record", () => navigate("/search"))}</div><small><kbd>Ctrl K</kbd> to open · <kbd>Esc</kbd> to close</small></section></div>}
  </div></QuickLogContext.Provider>;
}
