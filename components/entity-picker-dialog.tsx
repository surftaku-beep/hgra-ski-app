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
import { Label } from "@/components/ui/label";
import {
  addTournamentEntry,
  type TournamentEntryFormState,
} from "@/app/dashboard/tournaments/[id]/actions";
import type { EntryType } from "@/app/dashboard/types";

const initialState: TournamentEntryFormState = {};

export function EntityPickerDialog({
  tournamentId,
  entryType,
  title,
  fieldLabel,
  options,
  trigger,
}: {
  tournamentId: string;
  entryType: EntryType;
  title: string;
  fieldLabel: string;
  options: { value: string; label: string }[];
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addTournamentEntry,
    initialState,
  );

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>一覧から選択して追加します。</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tournament_id" value={tournamentId} />
          <input type="hidden" name="entry_type" value={entryType} />

          <div className="space-y-2">
            <Label htmlFor={`entity-${entryType}`}>{fieldLabel}</Label>
            {options.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                候補がありません。先にマスターへ登録してください。
              </p>
            ) : (
              <Select name="entity_id" required>
                <SelectTrigger id={`entity-${entryType}`} className="w-full">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {state.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending || options.length === 0}>
              {pending ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
