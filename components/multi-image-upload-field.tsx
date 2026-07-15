"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ExistingImage = { id: string; url: string; caption: string | null };

export function MultiImageUploadField({
  name,
  label,
  currentImages,
  maxImages,
}: {
  name: string;
  label: string;
  currentImages: ExistingImage[];
  maxImages: number;
}) {
  const [keptImages, setKeptImages] = useState<ExistingImage[]>(currentImages);
  const [previews, setPreviews] = useState<Record<number, string>>({});

  const emptySlotCount = Math.max(maxImages - keptImages.length, 0);

  function removeExisting(id: string) {
    setKeptImages((prev) => prev.filter((image) => image.id !== id));
  }

  function handleFileChange(
    slotIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    setPreviews((prev) => {
      const next = { ...prev };
      if (file) {
        next[slotIndex] = URL.createObjectURL(file);
      } else {
        delete next[slotIndex];
      }
      return next;
    });
  }

  const filledCount = keptImages.length + Object.keys(previews).length;

  return (
    <div className="space-y-2">
      <Label>
        {label}(最大{maxImages}枚 / {filledCount}枚選択中)
      </Label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {keptImages.map((image) => (
          <div key={image.id} className="space-y-1.5">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200">
              <Image
                src={image.url}
                alt={label}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeExisting(image.id)}
                aria-label="この画像を削除"
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
              <input type="hidden" name={`${name}_keep_id`} value={image.id} />
            </div>
            <Textarea
              name={`${name}_caption_${image.id}`}
              placeholder="コメント(任意)"
              defaultValue={image.caption ?? ""}
              rows={2}
              className="text-xs"
            />
          </div>
        ))}

        {Array.from({ length: emptySlotCount }).map((_, slotIndex) => (
          <div key={`new-${slotIndex}`} className="space-y-1.5">
            <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-dashed border-slate-300 text-muted-foreground transition-colors hover:border-slate-400 hover:text-slate-600">
              {previews[slotIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element -- ローカルのblob URLはnext/imageで最適化できないためプレビュー専用にimgを使用
                <img
                  src={previews[slotIndex]}
                  alt="選択した画像のプレビュー"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <Plus className="size-5" />
                  <span className="text-xs">追加</span>
                </>
              )}
              <input
                type="file"
                name={`${name}_new_${slotIndex}`}
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileChange(slotIndex, event)}
              />
            </label>
            <Textarea
              name={`${name}_new_caption_${slotIndex}`}
              placeholder="コメント(任意)"
              rows={2}
              className="text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
