"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type NewsFormState = {
  error?: string;
  success?: boolean;
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function parseNewsFormData(formData: FormData) {
  const title = normalizeOptional(formData.get("title"));
  const slug = normalizeOptional(formData.get("slug"));
  const isPublished = formData.get("is_published") === "on";
  const publishedAtRaw = normalizeOptional(formData.get("published_at"));

  return {
    title,
    slug,
    body: normalizeOptional(formData.get("body")),
    cover_image_url: normalizeOptional(formData.get("cover_image_url")),
    is_published: isPublished,
    // 公開ONで公開日未指定なら「今」を公開日にする
    published_at: publishedAtRaw ?? (isPublished ? new Date().toISOString() : null),
  };
}

export async function createNews(
  _prevState: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const values = parseNewsFormData(formData);

  if (!values.title || !values.slug) {
    return { error: "タイトル・スラッグは必須です。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("news").insert({
    ...values,
    author_id: user?.id ?? null,
  });

  if (error) {
    console.error("[createNews] failed:", error);
    if (error.code === "23505") {
      return { error: "このスラッグは既に使われています。" };
    }
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/news");
  revalidatePath("/news");
  revalidatePath("/");
  return { success: true };
}

export async function updateNews(
  _prevState: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "更新対象が特定できませんでした。" };
  }

  const values = parseNewsFormData(formData);

  if (!values.title || !values.slug) {
    return { error: "タイトル・スラッグは必須です。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("news").update(values).eq("id", id);

  if (error) {
    console.error("[updateNews] failed:", error);
    if (error.code === "23505") {
      return { error: "このスラッグは既に使われています。" };
    }
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/news");
  revalidatePath("/news");
  revalidatePath("/");
  return { success: true };
}

export async function deleteNews(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", id);

  if (error) {
    console.error("[deleteNews] failed:", error);
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/news");
  revalidatePath("/news");
  revalidatePath("/");
  return {};
}
