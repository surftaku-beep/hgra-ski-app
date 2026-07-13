"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Gantt from "frappe-gantt";
// frappe-ganttのpackage.jsonのexportsフィールドが `dist/*` への直接importを
// ブロックしているため、CSSはstyles/にコピーして読み込む。
import "../styles/frappe-gantt.css";

export type GanttTournament = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

export function GanttChart({
  tournaments,
}: {
  tournaments: GanttTournament[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const tasks = tournaments
    .filter((tournament) => tournament.start_date)
    .map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      start: tournament.start_date as string,
      end: tournament.end_date ?? (tournament.start_date as string),
      progress: 0,
    }));

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) {
      return;
    }

    // frappe-ganttはコンテナへ直接SVGを描画するため、Reactの管理外で
    // 再マウントのたびにクリアしてから初期化する
    containerRef.current.innerHTML = "";

    new Gantt(containerRef.current, tasks, {
      view_mode: "Month",
      readonly: true,
      on_click: (task: { id: string }) => {
        router.push(`/dashboard/gantt?tournament=${task.id}`, {
          scroll: false,
        });
      },
    });
    // tasksはtournaments propから毎レンダー新しい配列として作られるため、
    // 依存配列にはtournaments自体を使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments, router]);

  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        表示できる大会がありません。開始日が設定された大会を登録してください。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div ref={containerRef} />
    </div>
  );
}
