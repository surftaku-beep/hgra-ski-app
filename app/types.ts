// 公開層(Public Layer)と非公開層(Private Layer)の両方から使う共有の型。
// ダッシュボード専用の型は app/dashboard/types.ts を参照。

export type News = {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export type TeamProfile = {
  id: string;
  mission_statement: string | null;
  history: string | null;
  coaching_philosophy: string | null;
  training_info: string | null;
  price_info: string | null;
  coach_info: string | null;
  achievements_2021_22: string | null;
  address: string | null;
  google_maps_url: string | null;
  hero_image_url: string | null;
  about_image_url: string | null;
  updated_at: string;
};

export type TeamImageSection = "training" | "price" | "coach" | "achievements";

export type TeamImage = {
  id: string;
  section: TeamImageSection;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export type PersonalScheduleEntry = {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  related_tournament_id: string | null;
};

export const TEAM_PROFILE_ID = "00000000-0000-0000-0000-000000000001";
