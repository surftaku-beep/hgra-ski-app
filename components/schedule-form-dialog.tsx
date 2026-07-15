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
import {
  createScheduleEntry,
  updateScheduleEntry,
  type ScheduleFormState,
} from "@/app/dashboard/schedule/actions";
import type { PersonalScheduleEntry } from "@/app/types";

const initialState: ScheduleFormState = {};

// <input type="datetime-local"> は "YYYY-MM-DDTHH:mm" 形式を要求するため、
// timestamptz(ISO文字列)をローカルタイムゾーンでその形式に変換する
function toDatetimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function ScheduleFormDialog({
  mode,
  entry,
  trigger,
}: {
  mode: "create" | "edit";
  entry?: PersonalScheduleEntry;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = mode === "create" ? createScheduleEntry : updateScheduleEntry;
  const [state, formAction, pending] = useActionState(action, initialState);

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "予定を登録" : "予定を編集"}
          </DialogTitle>
          <DialogDescription>タイトル・開始日時は必須です。</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && entry ? (
            <input type="hidden" name="id" value={entry.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="例: 遠征引率、保護者面談"
              defaultValue={entry?.title ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_at">開始日時 *</Label>
              <Input
                id="start_at"
                name="start_at"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocalValue(entry?.start_at ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_at">終了日時</Label>
              <Input
                id="end_at"
                name="end_at"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(entry?.end_at ?? null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">メモ</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={entry?.description ?? ""}
            />
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
