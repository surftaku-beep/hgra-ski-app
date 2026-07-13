import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          スキーチーム コーチシステム
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                選手
              </Link>
              <Link
                href="/dashboard/tournaments"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                大会
              </Link>
              <Link
                href="/dashboard/guardians"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                保護者
              </Link>
              <Link
                href="/dashboard/gantt"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                ガントチャート
              </Link>
              <Link
                href="/dashboard/users"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                ユーザー管理
              </Link>
              <span className="text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
