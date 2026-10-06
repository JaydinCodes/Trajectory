"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/** The only browser Supabase client. It only has the publishable key and is RLS-bound. */
export function createClient() {
  if (!browserClient) {
    const { url, publishableKey } = supabaseConfig();
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}
