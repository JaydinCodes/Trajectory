import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import "./redesign.css";
import "./trajectory-redesign.css";
import "./dashboard-overrides.css";
import "./shell-overrides.css";
import { AppChrome } from "@/components/app-chrome";

export const metadata: Metadata = { title: "Trajectory — Your life, in motion", description: "A personal goal operating system." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><AppChrome>{children}</AppChrome></body></html>;
}
