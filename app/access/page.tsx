import { ContactForm } from "@/components/contact-form";
import { createClient } from "@/utils/supabase/server";
import { TEAM_PROFILE_ID, type TeamProfile } from "@/app/types";

export default async function AccessPage() {
  const supabase = await createClient();

  const { data: teamProfile } = await supabase
    .from("team_profile")
    .select("id, address, google_maps_url")
    .eq("id", TEAM_PROFILE_ID)
    .maybeSingle<Pick<TeamProfile, "id" | "address" | "google_maps_url">>();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          お問い合わせ・アクセス
        </h1>
        <p className="text-muted-foreground text-sm">
          チームへのアクセス方法とお問い合わせフォームです。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            ACCESS
          </h2>
          {teamProfile?.address ? (
            <p className="text-sm whitespace-pre-wrap">
              {teamProfile.address}
            </p>
          ) : null}
          {teamProfile?.google_maps_url ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                src={teamProfile.google_maps_url}
                title="アクセスマップ"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-72 w-full border-0"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              地図情報は準備中です。
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            CONTACT
          </h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
