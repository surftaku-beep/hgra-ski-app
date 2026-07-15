import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { News } from "@/app/types";

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  // このNext.jsでは動的セグメントがURLエンコードされたまま渡されるため、
  // 日本語などASCII外の文字を含むslugはデコードしないとDBの値と一致しない。
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    slug = rawSlug;
  }
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("news")
    .select(
      "id, title, slug, body, cover_image_url, is_published, published_at, created_at",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<News>();

  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-10">
      <Link
        href="/news"
        className="text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        ← ニュース一覧に戻る
      </Link>

      <div>
        <p className="text-sm text-muted-foreground">
          {formatDate(article.published_at)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {article.title}
        </h1>
      </div>

      {article.body ? (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {article.body}
        </div>
      ) : null}
    </div>
  );
}
