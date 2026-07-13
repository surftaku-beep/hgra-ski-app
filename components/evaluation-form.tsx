"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  saveEvaluation,
  type EvaluationFormState,
} from "@/app/dashboard/athletes/[id]/actions";

const initialState: EvaluationFormState = {};

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EvaluationForm({
  athleteId,
  currentStatus,
  futureDirection,
  updatedAt,
}: {
  athleteId: string;
  currentStatus: string | null;
  futureDirection: string | null;
  updatedAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveEvaluation,
    initialState,
  );
  const formattedUpdatedAt = formatDateTime(updatedAt);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="athlete_id" value={athleteId} />

      <div className="space-y-2">
        <Label htmlFor="current_status">
          育成状況(現状の課題や良かった点)
        </Label>
        <Textarea
          id="current_status"
          name="current_status"
          rows={4}
          defaultValue={currentStatus ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="future_direction">
          今後の育成方針・進学に関するメモ
        </Label>
        <Textarea
          id="future_direction"
          name="future_direction"
          rows={4}
          defaultValue={futureDirection ?? ""}
        />
      </div>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-xs">
          {formattedUpdatedAt
            ? `最終更新: ${formattedUpdatedAt}`
            : "まだ記録がありません"}
          {state.success ? (
            <span className="ml-2 text-foreground">保存しました</span>
          ) : null}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : "更新"}
        </Button>
      </div>
    </form>
  );
}
