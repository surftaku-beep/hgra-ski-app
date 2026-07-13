"use client";

import { useRouter } from "next/navigation";
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
import { deleteTournament } from "@/app/dashboard/tournaments/actions";

export function DeleteTournamentButton({
  id,
  name,
  redirectTo,
}: {
  id: string;
  name: string;
  /** 削除成功後に遷移させたいパス(一覧ページなど)。省略時は遷移しない */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTournament(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
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
            削除
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{name} を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。参加選手・引率者の登録もあわせて削除されます。
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
              handleDelete();
            }}
            disabled={isPending}
          >
            {isPending ? "削除中..." : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
