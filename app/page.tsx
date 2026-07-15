import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import {
  TEAM_PROFILE_ID,
  type News,
  type TeamImage,
  type TeamProfile,
} from "@/app/types";

// Training/Price/Coach向け: 3枚以下を想定したシンプルなグリッド表示。
// スマホでは1列に縦積みし、sm以上で横に並べる。
// キャプションが空の画像は<p>タグ自体をレンダリングせず余白を作らない。
function ImageGrid({ images, alt }: { images: TeamImage[]; alt: string }) {
  if (images.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {images.map((image, index) => (
        <div key={image.id}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200">
            <Image
              src={image.image_url}
              alt={image.caption || `${alt} ${index + 1}`}
              fill
              loading="lazy"
              sizes="(min-width: 640px) 33vw, 100vw"
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
  );
}

// Achievements向け: 最大8枚を横スクロールのスワイプ可能なカルーセルで表示。
// scroll-snapのみで実装しJSライブラリに依存しないため、追加の読み込みコストがない。
// 画面外の画像は next/image のデフォルト(loading="lazy")によって遅延読み込みされる
// (priorityを付けていないため)。
function ImageCarousel({ images, alt }: { images: TeamImage[]; alt: string }) {
  if (images.length === 0) return null;
  return (
    <div className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="w-64 shrink-0 snap-start sm:w-72"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200">
            <Image
              src={image.image_url}
              alt={image.caption || `${alt} ${index + 1}`}
              fill
              loading="lazy"
              sizes="(min-width: 640px) 288px, 256px"
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
  );
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: teamProfile }, { data: newsList }, { data: teamImages }] =
    await Promise.all([
      supabase
        .from("team_profile")
        .select("*")
        .eq("id", TEAM_PROFILE_ID)
        .maybeSingle<TeamProfile>(),
      supabase
        .from("news")
        .select(
          "id, title, slug, body, cover_image_url, is_published, published_at, created_at",
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3)
        .returns<News[]>(),
      supabase
        .from("team_images")
        .select("id, section, image_url, caption, sort_order, created_at")
        .order("sort_order")
        .returns<TeamImage[]>(),
    ]);

  console.log("[HomePage] teamProfile:", teamProfile);

  const imagesBySection = (section: TeamImage["section"]) =>
    (teamImages ?? []).filter((image) => image.section === section);

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative h-72 sm:h-96">
        <Image
          src={teamProfile?.hero_image_url || "/images/HGRA.png"}
          alt="HGRA スキーチーム"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {teamProfile?.hero_image_url ? (
          // ヒーロー画像が設定されている場合は紫の全面オーバーレイは無効にし、
          // 下部のテキスト可読性のためだけの軽い暗転グラデーションのみ入れる
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        ) : (
          // 画像未設定時のフォールバック(ロゴ画像)向け: 紫のトーンを保つ半透明レイヤー
          <>
            <div className="absolute inset-0 bg-purple-950/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-900/40 to-transparent" />
          </>
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          {teamProfile?.mission_statement ? (
            <p className="max-w-xl text-sm text-white/80">
              {teamProfile.mission_statement}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-10">
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              最新ニュース
            </h2>
            <Link
              href="/news"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              すべて見る →
            </Link>
          </div>

          {!newsList || newsList.length === 0 ? (
            <p className="mt-4 text-muted-foreground text-sm">
              まだお知らせはありません。
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {newsList.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardDescription>
                      {formatDate(item.published_at)}
                    </CardDescription>
                    <CardTitle className="text-base">
                      <Link
                        href={`/news/${item.slug}`}
                        className="hover:underline"
                      >
                        {item.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center">
          {teamProfile?.about_image_url ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 sm:w-48 sm:shrink-0">
              <Image
                src={teamProfile.about_image_url}
                alt="チームについて"
                fill
                loading="lazy"
                sizes="(min-width: 640px) 192px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-1 flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                チームについて
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                沿革や指導方針をご紹介しています。
              </p>
            </div>
            <Button
              render={<Link href="/team" />}
              variant="outline"
              nativeButton={false}
            >
              チーム紹介を見る
            </Button>
          </div>
        </section>

        <section id="training" className="scroll-mt-24 rounded-xl border p-6">
          <h2 className="text-lg font-semibold tracking-tight">TRAINING</h2>
          <ImageGrid images={imagesBySection("training")} alt="TRAINING" />
          <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
            {teamProfile?.training_info || "現在準備中です。"}
          </p>
        </section>

        <section id="price" className="scroll-mt-24 rounded-xl border p-6">
          <h2 className="text-lg font-semibold tracking-tight">PRICE</h2>
          <ImageGrid images={imagesBySection("price")} alt="PRICE" />
          <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
            {teamProfile?.price_info || "現在準備中です。"}
          </p>
        </section>

        <section id="coach" className="scroll-mt-24 rounded-xl border p-6">
          <h2 className="text-lg font-semibold tracking-tight">COACH</h2>
          <ImageGrid images={imagesBySection("coach")} alt="COACH" />
          <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
            {teamProfile?.coach_info || "現在準備中です。"}
          </p>
        </section>

        <section id="achievements" className="scroll-mt-24 rounded-xl border p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            2021-22実績
          </h2>
          <ImageCarousel
            images={imagesBySection("achievements")}
            alt="2021-22実績"
          />
          <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
            {teamProfile?.achievements_2021_22 || "現在準備中です。"}
          </p>
          <Link
            href="/results/2021-22"
            className="mt-3 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            詳しく見る →
          </Link>
        </section>

        <section className="flex flex-col items-start justify-between gap-4 rounded-xl border p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              お問い合わせ・アクセス
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              アクセス情報とお問い合わせフォームはこちらです。
            </p>
          </div>
          <Button
            render={<Link href="/access" />}
            variant="outline"
            nativeButton={false}
          >
            お問い合わせ・アクセスを見る
          </Button>
        </section>
      </div>
    </div>
  );
}
