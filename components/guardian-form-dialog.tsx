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
  createGuardian,
  updateGuardian,
  type GuardianFormState,
} from "@/app/dashboard/guardians/actions";
import type { Guardian } from "@/app/dashboard/types";

const initialState: GuardianFormState = {};

export function GuardianFormDialog({
  mode,
  guardian,
  trigger,
}: {
  mode: "create" | "edit";
  guardian?: Guardian;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = mode === "create" ? createGuardian : updateGuardian;
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
            {mode === "create" ? "保護者・関係者を登録" : "情報を編集"}
          </DialogTitle>
          <DialogDescription>
            氏名は必須です。その他の項目は空欄のままでも登録できます。
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && guardian ? (
            <input type="hidden" name="id" value={guardian.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">氏名 *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={guardian?.name ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={guardian?.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={guardian?.email ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">メモ</Label>
            <Input
              id="note"
              name="note"
              placeholder="例: ◯◯選手の保護者"
              defaultValue={guardian?.note ?? ""}
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
