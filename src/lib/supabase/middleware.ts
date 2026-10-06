import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "./config";

const authPaths = new Set(["/auth/login", "/auth/sign-up", "/auth/callback"]);
const publicPaths = new Set(["/auth/login", "/auth/sign-up", "/auth/callback", "/api/health"]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let configured = true;
  let config: ReturnType<typeof supabaseConfig> | undefined;

  try {
    config = supabaseConfig();
  } catch {
    configured = false;
  }

  // SQLite remains deliberately usable for local test/dev rollback until cutover is complete.
  // Hosted runtimes must be configured for Supabase; Vercel can never use its ephemeral filesystem.
  if (!configured && process.env.TRAJECTORY_DATA_BACKEND !== "supabase" && process.env.VERCEL !== "1") return response;
  if (!configured) return new NextResponse("Supabase is not configured.", { status: 503 });

  const supabase = createServerClient(config!.url, config!.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;
  const { pathname } = request.nextUrl;
  const isAuthPath = authPaths.has(pathname);
  const isApi = pathname.startsWith("/api/");

  if (!userId && !publicPaths.has(pathname)) {
    if (isApi) return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "Authentication is required." } }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (userId && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
