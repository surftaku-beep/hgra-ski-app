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
  TOURNAMENT_DAY_DISCIPLINES,
  TOURNAMENT_DAY_GENDERS,
  TOURNAMENT_GRADES,
  TOURNAMENT_MAX_DAYS,
  type Tournament,
  type TournamentDay,
} from "@/app/dashboard/types";

const initialState: TournamentFormState = {};

function dayFieldName(dayNumber: number, field: "date" | "discipline" | "gender") {
  return `day_${dayNumber}_${field}`;
}

export function TournamentFormDialog({
  mode,
  tournament,
  days,
  trigger,
}: {
  mode: "create" | "edit";
  tournament?: Tournament;
  days?: TournamentDay[];
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(tournament?.grade ?? "unset");
  const dayByIndex = new Map((days ?? []).map((day) => [day.day_index, day]));
  const [dayValues, setDayValues] = useState(() =>
    Array.from({ length: TOURNAMENT_MAX_DAYS }, (_, i) => {
      const day = dayByIndex.get(i + 1);
      return {
        discipline: day?.discipline ?? "unset",
        gender: day?.gender ?? "unset",
      };
    }),
  );

  function updateDayValue(
    index: number,
    patch: Partial<{ discipline: string; gender: string }>,
  ) {
    setDayValues((prev) =>
      prev.map((value, i) => (i === index ? { ...value, ...patch } : value)),
    );
  }

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
            <Label>日程(最大{TOURNAMENT_MAX_DAYS}日分)</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
              {Array.from({ length: TOURNAMENT_MAX_DAYS }, (_, i) => i + 1).map(
                (dayNumber) => {
                  const existing = dayByIndex.get(dayNumber);
                  const values = dayValues[dayNumber - 1];
                  return (
                    <div
                      key={dayNumber}
                      className="grid grid-cols-[2.5rem_1fr_1fr_1fr] items-center gap-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        {dayNumber}日目
                      </span>
                      <Input
                        type="date"
                        name={dayFieldName(dayNumber, "date")}
                        defaultValue={existing?.event_date ?? ""}
                      />
                      <Select
                        name={dayFieldName(dayNumber, "discipline")}
                        value={values.discipline}
                        onValueChange={(value) =>
                          updateDayValue(dayNumber - 1, {
                            discipline: value ?? "unset",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="競技" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">未設定</SelectItem>
                          {TOURNAMENT_DAY_DISCIPLINES.map((discipline) => (
                            <SelectItem key={discipline} value={discipline}>
                              {discipline}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        name={dayFieldName(dayNumber, "gender")}
                        value={values.gender}
                        onValueChange={(value) =>
                          updateDayValue(dayNumber - 1, {
                            gender: value ?? "unset",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="男女" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">未設定</SelectItem>
                          {TOURNAMENT_DAY_GENDERS.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournament_url">大会URL</Label>
            <Input
              id="tournament_url"
              name="tournament_url"
              type="url"
              placeholder="https://..."
              defaultValue={tournament?.tournament_url ?? ""}
            />
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
