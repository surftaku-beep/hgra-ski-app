import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { TEAM_PROFILE_ID, type TeamImage, type TeamProfile } from "@/app/types";

export default async function Results202122Page() {
  const supabase = await createClient();

  const [{ data: teamProfile }, { data: images }] = await Promise.all([
    supabase
      .from("team_profile")
      .select("id, achievements_2021_22")
      .eq("id", TEAM_PROFILE_ID)
      .maybeSingle<Pick<TeamProfile, "id" | "achievements_2021_22">>(),
    supabase
      .from("team_images")
      .select("id, section, image_url, caption, sort_order, created_at")
      .eq("section", "achievements")
      .order("sort_order")
      .returns<TeamImage[]>(),
  ]);

  const imageList = images ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">2021-22実績</h1>
      {imageList.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {imageList.map((image, index) => (
            <div key={image.id}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200">
                <Image
                  src={image.image_url}
                  alt={image.caption || `2021-22実績 ${index + 1}`}
                  fill
                  loading="lazy"
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              {image.caption ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {image.caption}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-sm whitespace-pre-wrap text-muted-foreground">
        {teamProfile?.achievements_2021_22 || "現在準備中です。"}
      </p>
    </div>
  );
}
