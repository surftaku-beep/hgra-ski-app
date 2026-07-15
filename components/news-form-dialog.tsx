"use client";

import { useActionState, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createNews,
  updateNews,
  type NewsFormState,
} from "@/app/dashboard/news/actions";
import type { News } from "@/app/types";

const initialState: NewsFormState = {};

export function NewsFormDialog({
  mode,
  news,
  trigger,
}: {
  mode: "create" | "edit";
  news?: News;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = mode === "create" ? createNews : updateNews;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [isPublished, setIsPublished] = useState(news?.is_published ?? false);

  // 送信結果(state)が変わった直後にダイアログを閉じる。
  // useEffectではなくレンダー中の比較で行うことで余分な再レンダーを避ける。
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "ニュースを登録" : "ニュースを編集"}
          </DialogTitle>
          <DialogDescription>
            タイトル・スラッグは必須です。スラッグはURL(/news/スラッグ)に使われます。
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && news ? (
            <input type="hidden" name="id" value={news.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={news?.title ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">スラッグ *</Label>
            <Input
              id="slug"
              name="slug"
              required
              placeholder="例: 2026-winter-training-camp"
              defaultValue={news?.slug ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">本文</Label>
            <Textarea
              id="body"
              name="body"
              rows={6}
              defaultValue={news?.body ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image_url">カバー画像URL</Label>
            <Input
              id="cover_image_url"
              name="cover_image_url"
              placeholder="https://..."
              defaultValue={news?.cover_image_url ?? ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="hidden"
              name="is_published"
              value={isPublished ? "on" : ""}
            />
            <Checkbox
              id="is_published"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <Label htmlFor="is_published" className="font-normal">
              公開する(未チェックは下書き。コーチ・管理者のみ閲覧可)
            </Label>
          </div>

          {state.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
