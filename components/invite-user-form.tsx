"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteUser,
  type InviteUserFormState,
} from "@/app/dashboard/users/actions";

const initialState: InviteUserFormState = {};

export function InviteUserForm({
  canGrantAdmin,
  athleteOptions,
}: {
  canGrantAdmin: boolean;
  athleteOptions: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    inviteUser,
    initialState,
  );
  const [role, setRole] = useState("coach");
  const [formKey, setFormKey] = useState(0);

  // 送信結果(state)が変わった直後にフォームをリセットする。
  // useEffectではなくレンダー中の比較で行うことで余分な再レンダーを避ける。
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setRole("coach");
      setFormKey((key) => key + 1);
    }
  }

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="user@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">役割</Label>
          <Select
            name="role"
            value={role}
            onValueChange={(value) => setRole(value ?? "coach")}
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coach">コーチ</SelectItem>
              {canGrantAdmin ? (
                <SelectItem value="admin">管理者</SelectItem>
              ) : null}
              <SelectItem value="athlete">選手</SelectItem>
              <SelectItem value="guardian">保護者</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {role === "athlete" ? (
        <div className="space-y-2">
          <Label htmlFor="athlete_id">対象の選手</Label>
          {athleteOptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              紐付け可能な選手がいません(選手が未登録か、全選手が既に別のアカウントと紐付け済みです)。
              先に「選手」ページで選手を登録してください。
            </p>
          ) : (
            <Select name="athlete_id" required>
              <SelectTrigger id="athlete_id" className="w-full">
                <SelectValue placeholder="選手を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {athleteOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-muted-foreground text-xs">
            この選手のマイページとして、招待するアカウントを紐付けます。
          </p>
        </div>
      ) : null}

      {role === "guardian" ? (
        <p className="text-muted-foreground text-xs">
          保護者アカウントはまだ特定の選手と紐付ける機能がありません(今後の対応予定です)。
        </p>
      ) : null}

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-muted-foreground">
          招待メールを送信しました。
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || (role === "athlete" && athleteOptions.length === 0)}
      >
        {pending ? "招待中..." : "招待する"}
      </Button>
    </form>
  );
}
