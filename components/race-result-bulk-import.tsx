"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogFooter } from "@/components/ui/dialog";
import {
  parseBulkRaceResults,
  type ParsedRaceResultRow,
  type BulkParseRowError,
} from "@/app/dashboard/athletes/[id]/parse-bulk-race-results";
import {
  bulkInsertRaceResults,
  type BulkInsertState,
} from "@/app/dashboard/athletes/[id]/actions";

const BULK_PLACEHOLDER =
  "2025/2026 2026/3/26 42 JOC ジュニアオリンピックカップ第43回大会 SL SAJ-A（K2） 166.42";

const initialInsertState: BulkInsertState = {};

export function RaceResultBulkImport({
  athleteId,
  onDone,
}: {
  athleteId: string;
  onDone: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [parsed, setParsed] = useState<{
    rows: ParsedRaceResultRow[];
    errors: BulkParseRowError[];
  } | null>(null);
  const [checkedLines, setCheckedLines] = useState<Set<number>>(new Set());

  const [insertState, insertAction, insertPending] = useActionState(
    bulkInsertRaceResults,
    initialInsertState,
  );

  // 挿入結果(state)が変わった直後にダイアログを閉じる。
  // useEffectではなくレンダー中の比較で行うことで余分な再レンダーを避ける。
  const [handledInsertState, setHandledInsertState] = useState(insertState);
  if (insertState !== handledInsertState) {
    setHandledInsertState(insertState);
    if (insertState.success) {
      onDone();
    }
  }

  function handleParse() {
    const text = textareaRef.current?.value ?? "";
    const result = parseBulkRaceResults(text);
    setParsed(result);
    setCheckedLines(new Set(result.rows.map((row) => row.line)));
  }

  function toggleLine(line: number) {
    setCheckedLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
  }

  const selectedRows = useMemo(
    () =>
      parsed ? parsed.rows.filter((row) => checkedLines.has(row.line)) : [],
    [parsed, checkedLines],
  );

  if (!parsed) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bulk_text">SAJサイトから成績表を貼り付け</Label>
          <Textarea
            id="bulk_text"
            ref={textareaRef}
            rows={8}
            placeholder={BULK_PLACEHOLDER}
            className="font-mono text-xs"
          />
          <p className="text-muted-foreground text-xs">
            SAJ成績データバンクの行をそのまま貼り付けてください。1行1件、
            「日付 順位 大会名 種目 クラス ポイント」のように並んでいれば
            自動で解析します。解析後に内容を確認してから登録できます。
          </p>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleParse}>
            解析してプレビュー
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {parsed.rows.length}件解析できました({checkedLines.size}件を選択中)
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setParsed(null)}
        >
          貼り付けに戻る
        </Button>
      </div>

      {parsed.errors.length > 0 ? (
        <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <p className="font-medium">読み取れなかった行:</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {parsed.errors.map((rowError) => (
              <li key={rowError.line}>
                {rowError.line}行目: {rowError.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsed.rows.length > 0 ? (
        <div className="max-h-64 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>日付</TableHead>
                <TableHead>大会名</TableHead>
                <TableHead>種目</TableHead>
                <TableHead>順位</TableHead>
                <TableHead>ポイント</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsed.rows.map((row) => (
                <TableRow key={row.line}>
                  <TableCell>
                    <Checkbox
                      checked={checkedLines.has(row.line)}
                      onCheckedChange={() => toggleLine(row.line)}
                      aria-label={`${row.tournament_name}を登録対象に含める`}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.tournament_date.replaceAll("-", "/")}
                  </TableCell>
                  <TableCell
                    className="max-w-48 truncate font-medium"
                    title={row.tournament_name}
                  >
                    {row.tournament_name}
                  </TableCell>
                  <TableCell>
                    {row.discipline ? (
                      <Badge variant="secondary">{row.discipline}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{row.rank ?? "-"}</TableCell>
                  <TableCell>{row.saj_points ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          解析できる行がありませんでした。貼り付け内容の形式を確認してください。
        </p>
      )}

      {insertState.error ? (
        <p className="text-destructive text-sm">{insertState.error}</p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          disabled={selectedRows.length === 0 || insertPending}
          onClick={() =>
            insertAction({
              athleteId,
              rows: selectedRows.map((row) => ({
                tournament_date: row.tournament_date,
                tournament_name: row.tournament_name,
                discipline: row.discipline,
                rank: row.rank,
                saj_points: row.saj_points,
              })),
            })
          }
        >
          {insertPending
            ? "登録中..."
            : `選択した${selectedRows.length}件を登録`}
        </Button>
      </DialogFooter>
    </div>
  );
}
