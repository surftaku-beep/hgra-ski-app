"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { TEAM_PROFILE_ID } from "@/app/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type TeamProfileFormState = {
  error?: string;
  success?: boolean;
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

const GOOGLE_MAPS_URL_PATTERN =
  /^https:\/\/(www\.)?(google\.com\/maps|maps\.google\.com)/;

const TEAM_ASSETS_BUCKET = "team-assets";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_FIELDS = [
  { formField: "hero_image", column: "hero_image_url", pathSlug: "hero" },
  { formField: "about_image", column: "about_image_url", pathSlug: "about" },
] as const;

const MULTI_IMAGE_SECTIONS = [
  { formField: "training_image", section: "training", max: 3 },
  { formField: "price_image", section: "price", max: 3 },
  { formField: "coach_image", section: "coach", max: 3 },
  { formField: "achievements_image", section: "achievements", max: 8 },
] as const;

function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${TEAM_ASSETS_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

async function uploadImageFile(
  supabase: SupabaseServerClient,
  file: File,
  pathSlug: string,
  suffix: string | number = "",
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイルを選択してください。" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "画像サイズは5MB以下にしてください。" };
  }

  const extension = file.type.split("/")[1] || "jpg";
  const path = `${pathSlug}/${TEAM_PROFILE_ID}-${Date.now()}-${suffix}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(TEAM_ASSETS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error(`[saveTeamProfile] upload failed (${pathSlug}):`, uploadError);
    return { error: `画像のアップロードに失敗しました: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(TEAM_ASSETS_BUCKET).getPublicUrl(path);
  return { url: publicUrl };
}

async function uploadImageIfPresent(
  supabase: SupabaseServerClient,
  formData: FormData,
  formField: string,
  pathSlug: string,
): Promise<{ url?: string; error?: string }> {
  const file = formData.get(formField);
  if (!(file instanceof File) || file.size === 0) {
    return {};
  }
  return uploadImageFile(supabase, file, pathSlug);
}

// team_images テーブルへ直接書き込む: 残す画像のキャプション更新、
// 外された画像の削除、新規アップロード分のINSERTをまとめて行う。
async function saveSectionImages(
  supabase: SupabaseServerClient,
  formData: FormData,
  section: (typeof MULTI_IMAGE_SECTIONS)[number],
): Promise<{ error?: string }> {
  const keptIds = formData
    .getAll(`${section.formField}_keep_id`)
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );

  const newFiles: { index: number; file: File }[] = [];
  for (let i = 0; i < section.max; i++) {
    const file = formData.get(`${section.formField}_new_${i}`);
    if (file instanceof File && file.size > 0) {
      newFiles.push({ index: i, file });
    }
  }

  if (keptIds.length + newFiles.length > section.max) {
    return { error: `画像は最大${section.max}枚までです。` };
  }

  const { data: existingRows, error: fetchError } = await supabase
    .from("team_images")
    .select("id, image_url")
    .eq("section", section.section);

  if (fetchError) {
    console.error(
      `[saveTeamProfile] failed to fetch existing team_images (${section.section}):`,
      fetchError,
    );
    return { error: `画像情報の取得に失敗しました: ${fetchError.message}` };
  }

  const existingRowsList = existingRows ?? [];
  const existingIds = existingRowsList.map((row) => row.id as string);
  const removedIds = existingIds.filter((id) => !keptIds.includes(id));

  if (removedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("team_images")
      .delete()
      .in("id", removedIds);
    if (deleteError) {
      console.error(
        `[saveTeamProfile] failed to delete team_images (${section.section}):`,
        deleteError,
      );
      return { error: `画像の削除に失敗しました: ${deleteError.message}` };
    }

    // DBの行削除が成功した後、対応するStorage上のファイルも削除する。
    // 失敗してもファイルが孤立するだけで表示上の問題にはならないため、
    // ここではエラーを保存失敗として扱わずログのみ残す。
    const removedPaths = existingRowsList
      .filter((row) => removedIds.includes(row.id as string))
      .map((row) => storagePathFromPublicUrl(row.image_url as string))
      .filter((path): path is string => path !== null);

    if (removedPaths.length > 0) {
      const { error: storageDeleteError } = await supabase.storage
        .from(TEAM_ASSETS_BUCKET)
        .remove(removedPaths);
      if (storageDeleteError) {
        console.error(
          `[saveTeamProfile] failed to remove storage objects (${section.section}):`,
          storageDeleteError,
        );
      }
    }
  }

  for (const id of keptIds) {
    const caption = normalizeOptional(
      formData.get(`${section.formField}_caption_${id}`),
    );
    const { error: updateError } = await supabase
      .from("team_images")
      .update({ caption })
      .eq("id", id);
    if (updateError) {
      console.error(
        `[saveTeamProfile] failed to update caption (${section.section}, ${id}):`,
        updateError,
      );
      return { error: `コメントの保存に失敗しました: ${updateError.message}` };
    }
  }

  let sortOrder = keptIds.length;
  for (const { index, file } of newFiles) {
    const uploadResult = await uploadImageFile(
      supabase,
      file,
      section.section,
      index,
    );
    if (uploadResult.error) {
      return { error: uploadResult.error };
    }

    const caption = normalizeOptional(
      formData.get(`${section.formField}_new_caption_${index}`),
    );
    const { error: insertError } = await supabase.from("team_images").insert({
      section: section.section,
      image_url: uploadResult.url,
      caption,
      sort_order: sortOrder,
    });
    if (insertError) {
      console.error(
        `[saveTeamProfile] failed to insert team_images (${section.section}):`,
        insertError,
      );
      return { error: `画像の保存に失敗しました: ${insertError.message}` };
    }
    sortOrder += 1;
  }

  return {};
}

// Googleマップの「地図を埋め込む」パネルは <iframe src="..."> のHTMLをそのまま
// 提供するため、iframeタグが貼り付けられた場合はsrc属性のURLだけを抽出する。
function extractGoogleMapsUrl(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const iframeMatch = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(trimmed);
  const candidate = iframeMatch ? iframeMatch[1] : trimmed;

  return GOOGLE_MAPS_URL_PATTERN.test(candidate) ? candidate : null;
}

export async function saveTeamProfile(
  _prevState: TeamProfileFormState,
  formData: FormData,
): Promise<TeamProfileFormState> {
  const supabase = await createClient();

  const rawGoogleMapsInput = normalizeOptional(
    formData.get("google_maps_url"),
  );
  let googleMapsUrl: string | null = null;
  if (rawGoogleMapsInput) {
    googleMapsUrl = extractGoogleMapsUrl(rawGoogleMapsInput);
    if (!googleMapsUrl) {
      return {
        error:
          "GoogleマップのURLが正しくありません。Googleマップの「共有」→「地図を埋め込む」で取得したURL、またはiframeタグをそのまま貼り付けてください。",
      };
    }
  }

  const imageUrlByColumn: Record<string, string> = {};
  for (const field of IMAGE_FIELDS) {
    const result = await uploadImageIfPresent(
      supabase,
      formData,
      field.formField,
      field.pathSlug,
    );
    if (result.error) {
      return { error: result.error };
    }
    if (result.url) {
      imageUrlByColumn[field.column] = result.url;
    }
  }

  for (const section of MULTI_IMAGE_SECTIONS) {
    const result = await saveSectionImages(supabase, formData, section);
    if (result.error) {
      return { error: result.error };
    }
  }

  const payload: Record<string, string | null> = {
    mission_statement: normalizeOptional(formData.get("mission_statement")),
    history: normalizeOptional(formData.get("history")),
    coaching_philosophy: normalizeOptional(
      formData.get("coaching_philosophy"),
    ),
    training_info: normalizeOptional(formData.get("training_info")),
    price_info: normalizeOptional(formData.get("price_info")),
    coach_info: normalizeOptional(formData.get("coach_info")),
    achievements_2021_22: normalizeOptional(
      formData.get("achievements_2021_22"),
    ),
    address: normalizeOptional(formData.get("address")),
    google_maps_url: googleMapsUrl,
    ...imageUrlByColumn,
  };
  console.log("[saveTeamProfile] payload:", payload);

  const { error, data, status } = await supabase
    .from("team_profile")
    .update(payload)
    .eq("id", TEAM_PROFILE_ID)
    .select();

  console.log("[saveTeamProfile] result:", { status, rowsUpdated: data?.length ?? 0 });

  if (error) {
    console.error("[saveTeamProfile] failed:", error);
    return {
      error: `保存に失敗しました(${error.code ?? "unknown"}): ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    console.error(
      "[saveTeamProfile] update matched 0 rows — RLSポリシーで拒否されたか、対象行が存在しない可能性があります。",
    );
    return {
      error:
        "保存に失敗しました: 更新対象の行が見つからないか、権限がありません(RLS)。",
    };
  }

  revalidatePath("/dashboard/team-profile");
  revalidatePath("/team");
  revalidatePath("/access");
  revalidatePath("/");
  revalidatePath("/results/2021-22");
  return { success: true };
}
