import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import { SiteNav } from "@/components/site-nav";
import { MarketingNav } from "@/components/marketing-nav";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="トップページ">
          <Image
            src="/HGRA_BLACK.png"
            alt="HGRA スキーチーム"
            width={95}
            height={121}
            priority
            className="h-8 w-auto"
          />
        </Link>
        {!user ? (
          <div className="flex items-center gap-4">
            <MarketingNav />
            <SiteNav
              isAuthenticated={false}
              isCoachOrAdmin={isCoachOrAdmin}
              userEmail={null}
            />
          </div>
        ) : (
          <SiteNav
            isAuthenticated={Boolean(user)}
            isCoachOrAdmin={isCoachOrAdmin}
            userEmail={user?.email ?? null}
          />
        )}
      </div>
    </header>
  );
}
