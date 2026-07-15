import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TeamProfileForm } from "@/components/team-profile-form";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import { TEAM_PROFILE_ID, type TeamImage, type TeamProfile } from "@/app/types";

export default async function TeamProfileAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  const [{ data: teamProfile }, { data: teamImages, error: teamImagesError }] =
    await Promise.all([
      supabase
        .from("team_profile")
        .select("*")
        .eq("id", TEAM_PROFILE_ID)
        .maybeSingle<TeamProfile>(),
      supabase
        .from("team_images")
        .select("id, section, image_url, caption, sort_order, created_at")
        .order("sort_order")
        .returns<TeamImage[]>(),
    ]);

  if (teamImagesError) {
    console.error(
      "[TeamProfileAdminPage] failed to load team_images:",
      teamImagesError,
    );
  }

  const imagesBySection = (section: TeamImage["section"]) =>
    (teamImages ?? []).filter((image) => image.section === section);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          チーム紹介編集
        </h1>
        <p className="text-muted-foreground text-sm">
          公開サイトの「チーム紹介」ページ(/team)に表示される内容です。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>内容編集</CardTitle>
          <CardDescription>
            空欄の項目は公開ページに表示されません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCoachOrAdmin ? (
            <TeamProfileForm
              teamProfile={teamProfile}
              trainingImages={imagesBySection("training")}
              priceImages={imagesBySection("price")}
              coachImages={imagesBySection("coach")}
              achievementsImages={imagesBySection("achievements")}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              この内容を編集する権限がありません。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
