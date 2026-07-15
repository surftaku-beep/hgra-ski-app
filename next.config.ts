import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  experimental: {
    // チーム紹介編集フォームは1回の送信でhero(1枚)+training/price/coach(各3枚)
    // +achievements(8枚)、合計最大18枚(各5MBまで)を同時アップロードしうるため
    // (理論上限 約90MB)、multipart境界等のオーバーヘッドも見込んで余裕を持たせている。
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
