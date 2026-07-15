"use client";

import { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";

export function HeroImageUploadField({
  name,
  label,
  currentImageUrl,
  previewHeightClassName = "h-40",
}: {
  name: string;
  label: string;
  currentImageUrl: string | null;
  previewHeightClassName?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  const displayUrl = previewUrl ?? currentImageUrl;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
      />
      {displayUrl ? (
        <div
          className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 ${previewHeightClassName}`}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- ローカルのblob URLはnext/imageで最適化できないためプレビュー専用にimgを使用
            <img
              src={previewUrl}
              alt={`選択した${label}のプレビュー`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={currentImageUrl as string}
              alt={`現在の${label}`}
              fill
              className="object-cover"
            />
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          画像は未設定です。選択すると即座にプレビューが表示されます。
        </p>
      )}
    </div>
  );
}
