import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// "/dashboard" 配下のみ認証必須。それ以外(公開サイト側)は誰でも閲覧可能。
const PROTECTED_PREFIX = "/dashboard";
// ログイン済みユーザーがアクセスすると /dashboard へ転送するパス
const AUTH_ONLY_PREFIX = "/login";

// "/dashboard-preview" のような別ルートを誤って保護対象にしないよう、
// 完全一致 または "/prefix/" で始まる場合のみマッチさせる
function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() は毎回Supabaseにセッションの有効性を問い合わせるため、
  // ミドルウェアでの認証チェックにはgetSession()ではなくこちらを使う
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedPath = matchesPrefix(pathname, PROTECTED_PREFIX);
  const isAuthOnlyPath = matchesPrefix(pathname, AUTH_ONLY_PREFIX);

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
