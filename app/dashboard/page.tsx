import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";

type TimelineItemType = "news" | "schedule" | "evaluation";

type TimelineItem = {
  id: string;
  type: TimelineItemType;
  title: string;
  date: string;
  href?: string;
  description?: string | null;
};

const TYPE_LABELS: Record<TimelineItemType, string> = {
  news: "ニュース",
  schedule: "予定",
  evaluation: "コーチング記録",
};

type EvaluationTimelineRow = {
  id: string;
  athlete_id: string;
  updated_at: string;
  athlete: { id: string; name: string } | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nowIso = new Date().toISOString();

  const [
    { data: newsList },
    { data: scheduleEntries },
    { data: evaluations },
  ] = await Promise.all([
    supabase
      .from("news")
      .select("id, title, slug, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(5),
    user
      ? supabase
          .from("personal_schedule")
          .select("id, title, start_at")
          .eq("coach_id", user.id)
          .gte("start_at", nowIso)
          .order("start_at", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("evaluations")
          .select("id, athlete_id, updated_at, athlete:athletes(id, name)")
          .eq("coach_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5)
          .returns<EvaluationTimelineRow[]>()
      : Promise.resolve({ data: null }),
  ]);

  const timeline: TimelineItem[] = [
    ...(newsList ?? [])
      .filter((item) => item.published_at)
      .map(
        (item): TimelineItem => ({
          id: `news-${item.id}`,
          type: "news",
          title: item.title,
          date: item.published_at as string,
          href: `/news/${item.slug}`,
        }),
      ),
    ...(scheduleEntries ?? []).map(
      (entry): TimelineItem => ({
        id: `schedule-${entry.id}`,
        type: "schedule",
        title: entry.title,
        date: entry.start_at,
      }),
    ),
    ...(evaluations ?? []).map(
      (evaluation): TimelineItem => ({
        id: `evaluation-${evaluation.id}`,
        type: "evaluation",
        title: evaluation.athlete
          ? `${evaluation.athlete.name} の評価を更新`
          : "評価を更新",
        date: evaluation.updated_at,
        href: `/dashboard/athletes/${evaluation.athlete_id}`,
      }),
    ),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <Image
          src="/HGRA_BLACK.png"
          alt="HGRA スキーチーム ロゴ"
          width={120}
          height={152}
          priority
          className="h-20 w-auto"
        />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">ホーム</h1>
        <p className="text-muted-foreground text-sm">
          ニュース・個人の予定・コーチング記録をまとめて表示します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>タイムライン</CardTitle>
          <CardDescription>
            {timeline.length > 0
              ? `${timeline.length}件の更新があります。`
              : "表示できる更新はまだありません。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              ニュースが公開されたり、予定・評価メモを登録すると、ここに表示されます。
            </p>
          ) : (
            <ul className="divide-y">
              {timeline.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <Badge variant="secondary" className="mt-0.5 shrink-0">
                    {TYPE_LABELS[item.type]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="font-medium hover:underline"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="font-medium">{item.title}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(item.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
