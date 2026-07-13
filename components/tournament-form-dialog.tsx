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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createTournament,
  updateTournament,
  type TournamentFormState,
} from "@/app/dashboard/tournaments/actions";
import {
  TOURNAMENT_AGE_CATEGORIES,
  TOURNAMENT_GRADES,
  type Tournament,
} from "@/app/dashboard/types";

const initialState: TournamentFormState = {};

export function TournamentFormDialog({
  mode,
  tournament,
  trigger,
}: {
  mode: "create" | "edit";
  tournament?: Tournament;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(tournament?.grade ?? "unset");
  const [ageCategory, setAgeCategory] = useState(
    tournament?.age_category ?? "unset",
  );
  const action = mode === "create" ? createTournament : updateTournament;
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
            {mode === "create" ? "大会を登録" : "大会情報を編集"}
          </DialogTitle>
          <DialogDescription>大会名・開始日は必須です。</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && tournament ? (
            <input type="hidden" name="id" value={tournament.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">大会名 *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={tournament?.name ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">開始日 *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                required
                defaultValue={tournament?.start_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">終了日</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={tournament?.end_date ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">開催地</Label>
            <Input
              id="location"
              name="location"
              placeholder="例: 北海道 ◯◯スキー場"
              defaultValue={tournament?.location ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">グレード</Label>
              <Select
                name="grade"
                value={grade}
                onValueChange={(value) => setGrade(value ?? "unset")}
              >
                <SelectTrigger id="grade" className="w-full">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">未設定</SelectItem>
                  {TOURNAMENT_GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age_category">対象カテゴリ</Label>
              <Select
                name="age_category"
                value={ageCategory}
                onValueChange={(value) => setAgeCategory(value ?? "unset")}
              >
                <SelectTrigger id="age_category" className="w-full">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">未設定</SelectItem>
                  {TOURNAMENT_AGE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">概要・メモ</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="大会の概要や注意事項など"
              defaultValue={tournament?.description ?? ""}
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
