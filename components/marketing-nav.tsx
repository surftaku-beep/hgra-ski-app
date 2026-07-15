"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { PRIMARY_NAV_ITEMS } from "@/lib/primary-nav";

function isPathActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass =
  "text-sm font-medium text-slate-600 transition-colors hover:text-slate-900";
const linkActiveClass = "text-sm font-medium text-slate-900";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center gap-5 lg:flex">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              isPathActive(pathname, item.href) ? linkActiveClass : linkClass
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-muted hover:text-slate-900 lg:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-border bg-white/95 backdrop-blur-md lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`${
                  isPathActive(pathname, item.href)
                    ? linkActiveClass
                    : linkClass
                } rounded-md px-2 py-2 hover:bg-muted`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
