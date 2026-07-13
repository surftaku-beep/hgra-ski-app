// SAJ成績データバンクなどからコピペした成績表を解析する。
//
// 想定する1行の形式(例):
//   2025/2026 2026/3/26 42 JOC ジュニアオリンピックカップ第43回大会 SL SAJ-A（K2） 166.42
//   [シーズン]  [日付]     [順位] [------- 大会名(自由文字列) -------] [種目] [クラス]     [ポイント]
//
// シーズン(YYYY/YYYY)は日付(YYYY/M/D)と桁数の構造が異なるため誤認しない。
// 種目はSL/GS/SG/DHのホワイトリストでのみ判定し、"JOC"のような大文字の略称を
// 種目と誤認しないようにしている。
// 大会名は「日付+順位の直後」から「種目(見つからなければポイント)の直前」までを
// 切り出すことで、間に挟まれた自由文字列をそのまま取得できるようにしている。

export type ParsedRaceResultRow = {
  line: number;
  raw: string;
  tournament_date: string; // ISO yyyy-mm-dd
  tournament_name: string;
  discipline: string | null;
  rank: number | null;
  saj_points: number | null;
};

export type BulkParseRowError = {
  line: number;
  raw: string;
  message: string;
};

export type BulkParseResult = {
  rows: ParsedRaceResultRow[];
  errors: BulkParseRowError[];
};

const DATE_PATTERN = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;
const DISCIPLINE_PATTERN = /\b(SL|GS|SG|DH)\b/;
const DECIMAL_PATTERN = /\d+\.\d+/g;

function toIsoDate(y: string, m: string, d: string): string | null {
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseBulkRaceResults(input: string): BulkParseResult {
  const rows: ParsedRaceResultRow[] = [];
  const errors: BulkParseRowError[] = [];

  const lines = input
    .split(/\r\n|\r|\n/)
    .map((raw, index) => ({ line: index + 1, raw }))
    .filter(({ raw }) => raw.trim() !== "");

  for (const { line, raw } of lines) {
    const normalized = raw.trim().replace(/\s+/g, " ");

    const dateMatch = normalized.match(DATE_PATTERN);
    if (!dateMatch || dateMatch.index === undefined) {
      errors.push({ line, raw, message: "日付が見つかりませんでした。" });
      continue;
    }

    const isoDate = toIsoDate(dateMatch[1], dateMatch[2], dateMatch[3]);
    if (!isoDate) {
      errors.push({
        line,
        raw,
        message: "日付の形式を解釈できませんでした。",
      });
      continue;
    }

    let cursor = dateMatch.index + dateMatch[0].length;

    // 日付の直後にある数値は順位とみなす
    const rankMatch = normalized.slice(cursor).match(/^\s*(\d+)\b/);
    let rank: number | null = null;
    if (rankMatch) {
      rank = Number(rankMatch[1]);
      cursor += rankMatch[0].length;
    }

    const rest = normalized.slice(cursor);

    const disciplineMatch = rest.match(DISCIPLINE_PATTERN);
    const decimalMatches = [...rest.matchAll(DECIMAL_PATTERN)];
    const pointsMatch =
      decimalMatches.length > 0
        ? decimalMatches[decimalMatches.length - 1]
        : null;

    let nameEnd = rest.length;
    if (disciplineMatch && disciplineMatch.index !== undefined) {
      nameEnd = disciplineMatch.index;
    } else if (pointsMatch && pointsMatch.index !== undefined) {
      nameEnd = pointsMatch.index;
    }

    const tournamentName = rest
      .slice(0, nameEnd)
      .trim()
      .replace(/[\s、,]+$/, "");

    if (!tournamentName) {
      errors.push({ line, raw, message: "大会名を抽出できませんでした。" });
      continue;
    }

    rows.push({
      line,
      raw,
      tournament_date: isoDate,
      tournament_name: tournamentName,
      discipline: disciplineMatch ? disciplineMatch[1] : null,
      rank,
      saj_points: pointsMatch ? Number(pointsMatch[0]) : null,
    });
  }

  return { rows, errors };
}
