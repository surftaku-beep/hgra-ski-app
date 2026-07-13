"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { removeTournamentEntry } from "@/app/dashboard/tournaments/[id]/actions";

export function RemoveTournamentEntryButton({
  entryId,
  tournamentId,
  label,
}: {
  entryId: string;
  tournamentId: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeTournamentEntry(entryId, tournamentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            解除
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label} を解除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この大会からの登録が解除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleRemove();
            }}
            disabled={isPending}
          >
            {isPending ? "解除中..." : "解除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
