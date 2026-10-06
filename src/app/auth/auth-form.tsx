"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const signUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    const result = signUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) { setError(result.error.message); setSubmitting(false); return; }
    if (signUp && !result.data.session) { setError("Check your email to confirm your account, then sign in."); setSubmitting(false); return; }
    router.replace(searchParams.get("next") || "/");
    router.refresh();
  }

  return <main className="auth-page"><section className="auth-shell"><p className="onboarding-mark">T<span>·</span> TRAJECTORY</p><p className="eyebrow">Your private record</p><h1>{signUp ? "Create your account" : "Welcome back"}</h1><p className="onboarding-copy">{signUp ? "Start a private record of where your life is moving." : "Sign in to continue your trajectory."}</p><form onSubmit={submit} className="auth-form"><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" minLength={8} autoComplete={signUp ? "new-password" : "current-password"} required /></label>{error && <p className="onboarding-error" role="alert">{error}</p>}<button className="onboarding-primary" disabled={submitting}>{submitting ? "Please wait…" : signUp ? "Create account" : "Sign in"}</button></form><p className="auth-switch">{signUp ? "Already have an account?" : "New to Trajectory?"} <Link href={signUp ? "/auth/login" : "/auth/sign-up"}>{signUp ? "Sign in" : "Create an account"}</Link></p></section></main>;
}
