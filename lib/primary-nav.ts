// ヘッダー(ログイン状態を問わず)とフッターで共有する、統一されたメイン導線。
// 個別ページ・ドロップダウン経由でのみ到達させたい項目(選手一覧、大会実績など)は含めない。
export type PrimaryNavItem = { href: string; label: string };

export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { href: "/", label: "HOME" },
  { href: "/news", label: "ニュース" },
  { href: "/team", label: "チーム紹介" },
  { href: "/access", label: "お問い合わせ・アクセス" },
];
