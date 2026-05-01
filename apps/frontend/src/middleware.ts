import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED: Record<string, Array<"kitchen" | "admin">> = {
  "/kitchen": ["kitchen", "admin"],
  "/admin": ["admin"],
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const matchedPrefix = Object.keys(PROTECTED).find((prefix) => pathname.startsWith(prefix));
  const requiredRoles = matchedPrefix ? PROTECTED[matchedPrefix] : null;

  // Unauthenticated user hitting a protected route
  if (requiredRoles && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting /login - redirect them home
  if (pathname === "/login" && data.user) {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
    });
    if (res.ok) {
      const user = await res.json() as { role: string };
      const dest = user.role === "admin" ? "/admin" : user.role === "kitchen" ? "/kitchen" : "/";
      return NextResponse.redirect(new URL(dest, request.nextUrl.origin));
    }
  }

  return response;
}

export const config = {
  matcher: ["/kitchen", "/admin", "/admin/:path*", "/login"],
};
