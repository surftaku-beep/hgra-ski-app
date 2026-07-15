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
import {
  createAthlete,
  updateAthlete,
  type AthleteFormState,
} from "@/app/dashboard/athletes/actions";
import type { Athlete } from "@/app/dashboard/types";

const initialState: AthleteFormState = {};

export function AthleteFormDialog({
  mode,
  athlete,
  trigger,
}: {
  mode: "create" | "edit";
  athlete?: Athlete;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = mode === "create" ? createAthlete : updateAthlete;
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
            {mode === "create" ? "選手を登録" : "選手情報を編集"}
          </DialogTitle>
          <DialogDescription>
            氏名は必須です。その他の項目は空欄のままでも登録できます。
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && athlete ? (
            <input type="hidden" name="id" value={athlete.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">氏名 *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={athlete?.name ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">学年</Label>
              <Input
                id="grade"
                name="grade"
                placeholder="例: 高校2年"
                defaultValue={athlete?.grade ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_year">生年</Label>
              <Input
                id="birth_year"
                name="birth_year"
                type="number"
                defaultValue={athlete?.birth_year ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliation">所属</Label>
            <Input
              id="affiliation"
              name="affiliation"
              placeholder="例: ◯◯高校スキー部"
              defaultValue={athlete?.affiliation ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">クラス</Label>
              <Input
                id="category"
                name="category"
                placeholder="例: 高校生, K2"
                defaultValue={athlete?.category ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saj_id">SAJ ID</Label>
              <Input
                id="saj_id"
                name="saj_id"
                defaultValue={athlete?.saj_id ?? ""}
              />
            </div>
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
