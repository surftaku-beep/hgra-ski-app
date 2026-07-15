import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandWatermark } from "@/components/brand-watermark";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid flex-1 md:grid-cols-2">
      <div className="relative h-64 md:h-auto">
        <Image
          src="/images/HGRA.png"
          alt="HGRA スキーチーム"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-center"
        />
        {/* 紫のトーンを保つ半透明レイヤー: 全体の膜 + テキスト側を濃くして可読性を確保 */}
        <div className="absolute inset-0 bg-purple-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-900/40 to-transparent md:bg-gradient-to-r" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 text-white md:justify-center md:p-12">
          <p className="text-xs font-medium tracking-widest text-white/70 uppercase">
            Coach Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            選手の成長を、
            <br />
            チームの力に。
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            大会成績や育成方針をひとつの場所で管理し、コーチ陣の意思決定を支えます。
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center overflow-hidden p-8">
        <BrandWatermark className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Card className="relative z-10 w-full max-w-sm">
          <CardHeader>
            <CardTitle>コーチ ログイン</CardTitle>
            <CardDescription>
              管理者から発行されたメールアドレスとパスワードでログインしてください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}
              <Button type="submit" className="w-full">
                ログイン
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
