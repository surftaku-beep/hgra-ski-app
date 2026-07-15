"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/logout-button";
import { PRIMARY_NAV_ITEMS, type PrimaryNavItem } from "@/lib/primary-nav";

type NavItem = PrimaryNavItem;

// 全ログインユーザー共通で、アカウントメニュー上部に表示するリンク。
const RESULTS_LINK: NavItem = { href: "/results/2021-22", label: "実績" };

// アカウントメニュー内、coach/adminのみに表示する管理系リンク。
// ヘッダー上部のHOMEが公開トップページ(/)を指すようになったため、
// 自分のダッシュボードへの入口もここに含める。
const MANAGEMENT_MENU: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/dashboard/athletes", label: "選手" },
  { href: "/dashboard/tournaments", label: "大会" },
  { href: "/dashboard/guardians", label: "保護者" },
  { href: "/dashboard/schedule", label: "スケジュール" },
  { href: "/dashboard/news", label: "ニュース管理" },
  { href: "/dashboard/team-profile", label: "チーム紹介編集" },
  { href: "/dashboard/gantt", label: "ガントチャート" },
  { href: "/dashboard/users", label: "ユーザー管理" },
];

const navLinkBase = "rounded-full px-3 py-1.5 transition-colors";
const navLinkActive = `${navLinkBase} bg-muted font-medium text-foreground`;
const navLinkInactive = `${navLinkBase} text-muted-foreground hover:bg-muted hover:text-foreground`;

function isPathActive(pathname: string, href: string) {
  if (href === "/" || href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, active }: NavItem & { active: boolean }) {
  return (
    <Link href={href} className={active ? navLinkActive : navLinkInactive}>
      {label}
    </Link>
  );
}

export function SiteNav({
  isAuthenticated,
  isCoachOrAdmin,
  userEmail,
}: {
  isAuthenticated: boolean;
  isCoachOrAdmin: boolean;
  userEmail: string | null;
}) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return (
      <Button
        render={<Link href="/login" />}
        size="sm"
        className="rounded-full"
        nativeButton={false}
      >
        ログイン
      </Button>
    );
  }

  const isAccountSectionActive =
    isPathActive(pathname, RESULTS_LINK.href) ||
    (isCoachOrAdmin &&
      MANAGEMENT_MENU.some((item) => isPathActive(pathname, item.href)));

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={isPathActive(pathname, item.href)}
        />
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          openOnHover
          render={
            <button
              type="button"
              aria-label="アカウントメニュー"
              className={`ml-2 flex size-8 items-center justify-center rounded-full border transition-colors ${
                isAccountSectionActive
                  ? "border-border bg-muted text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <User className="size-3.5" />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {userEmail ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate text-foreground">
                  {userEmail}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          ) : null}

          <DropdownMenuGroup>
            <DropdownMenuItem
              render={
                <Link href={RESULTS_LINK.href}>{RESULTS_LINK.label}</Link>
              }
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {isCoachOrAdmin ? (
            <DropdownMenuGroup>
              <DropdownMenuLabel>管理者用メニュー</DropdownMenuLabel>
              {MANAGEMENT_MENU.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  render={<Link href={item.href}>{item.label}</Link>}
                />
              ))}
            </DropdownMenuGroup>
          ) : (
            <DropdownMenuGroup>
              <DropdownMenuLabel>マイページ</DropdownMenuLabel>
              <DropdownMenuItem
                render={<Link href="/dashboard">ダッシュボード</Link>}
              />
            </DropdownMenuGroup>
          )}

          <DropdownMenuSeparator />
          <div className="px-0.5 py-0.5">
            <LogoutButton />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
