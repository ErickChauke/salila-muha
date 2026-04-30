import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          cookiesToSet.push(...(toSet as CookieToSet[]));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const meRes = await fetch(`${origin}/api/auth/me`, {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  });

  let dest = "/";
  if (meRes.ok) {
    const user = (await meRes.json()) as { role: string };
    if (user.role === "kitchen") dest = "/kitchen";
    else if (user.role === "admin") dest = "/admin";
  }

  const response = NextResponse.redirect(`${origin}${dest}`);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
