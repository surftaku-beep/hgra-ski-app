import Link from "next/link";
import { PRIMARY_NAV_ITEMS } from "@/lib/primary-nav";

const footerLinkClass =
  "rounded-full px-2.5 py-1 transition-colors hover:bg-muted hover:text-foreground";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl justify-center px-4 py-5 text-sm text-muted-foreground sm:px-6">
        <nav className="flex items-center gap-1">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={footerLinkClass}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
