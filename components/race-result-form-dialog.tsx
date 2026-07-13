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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { RaceResultBulkImport } from "@/components/race-result-bulk-import";
import {
  createRaceResult,
  updateRaceResult,
  type RaceResultFormState,
} from "@/app/dashboard/athletes/[id]/actions";
import type { RaceResult } from "@/app/dashboard/types";

const DISCIPLINES = ["SL", "GS", "SG", "DH"] as const;

const singleInitialState: RaceResultFormState = {};

function RaceResultFields({ raceResult }: { raceResult?: RaceResult }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="tournament_name">大会名 *</Label>
        <Input
          id="tournament_name"
          name="tournament_name"
          required
          defaultValue={raceResult?.tournament_name ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tournament_date">日付 *</Label>
          <Input
            id="tournament_date"
            name="tournament_date"
            type="date"
            required
            defaultValue={raceResult?.tournament_date ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discipline">種目 *</Label>
          <Select
            name="discipline"
            required
            defaultValue={raceResult?.discipline ?? undefined}
          >
            <SelectTrigger id="discipline" className="w-full">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {DISCIPLINES.map((discipline) => (
                <SelectItem key={discipline} value={discipline}>
                  {discipline}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rank">順位</Label>
          <Input
            id="rank"
            name="rank"
            type="number"
            min={1}
            defaultValue={raceResult?.rank ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">タイム</Label>
          <Input
            id="time"
            name="time"
            placeholder="例: 1:23.45"
            defaultValue={raceResult?.time ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="saj_points">SAJポイント</Label>
          <Input
            id="saj_points"
            name="saj_points"
            type="number"
            step="0.01"
            defaultValue={raceResult?.saj_points ?? ""}
          />
        </div>
      </div>
    </>
  );
}

export function RaceResultFormDialog({
  athleteId,
  mode,
  raceResult,
  trigger,
}: {
  athleteId: string;
  mode: "create" | "edit";
  raceResult?: RaceResult;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const singleAction = mode === "create" ? createRaceResult : updateRaceResult;
  const [singleState, singleFormAction, singlePending] = useActionState(
    singleAction,
    singleInitialState,
  );

  // 送信結果(state)が変わった直後にダイアログを閉じる。
  // useEffectではなくレンダー中の比較で行うことで余分な再レンダーを避ける。
  const [handledSingleState, setHandledSingleState] = useState(singleState);
  if (singleState !== handledSingleState) {
    setHandledSingleState(singleState);
    if (singleState.success) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className={mode === "create" ? "sm:max-w-lg" : undefined}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "成績を登録" : "成績を編集"}
          </DialogTitle>
          <DialogDescription>
            大会名・日付・種目は必須です。
          </DialogDescription>
        </DialogHeader>

        {mode === "edit" ? (
          <form action={singleFormAction} className="space-y-4">
            <input type="hidden" name="id" value={raceResult?.id} />
            <input type="hidden" name="athlete_id" value={athleteId} />
            <RaceResultFields raceResult={raceResult} />
            {singleState.error ? (
              <p className="text-destructive text-sm">{singleState.error}</p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={singlePending}>
                {singlePending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <Tabs defaultValue="single">
            <TabsList className="w-full">
              <TabsTrigger value="single">個別入力</TabsTrigger>
              <TabsTrigger value="bulk">一括貼り付け</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="pt-2">
              <form action={singleFormAction} className="space-y-4">
                <input type="hidden" name="athlete_id" value={athleteId} />
                <RaceResultFields />
                {singleState.error ? (
                  <p className="text-destructive text-sm">
                    {singleState.error}
                  </p>
                ) : null}
                <DialogFooter>
                  <Button type="submit" disabled={singlePending}>
                    {singlePending ? "保存中..." : "保存"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="bulk" className="pt-2">
              <RaceResultBulkImport
                athleteId={athleteId}
                onDone={() => setOpen(false)}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
