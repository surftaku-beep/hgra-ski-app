export type Athlete = {
  id: string;
  name: string;
  category: string | null;
  grade: string | null;
  affiliation: string | null;
  saj_id: string | null;
  birth_year: number | null;
};

export type RaceResult = {
  id: string;
  tournament_date: string | null;
  tournament_name: string | null;
  discipline: string | null;
  rank: number | null;
  time: string | null;
  saj_points: number | null;
};

export type Evaluation = {
  id: string;
  current_status: string | null;
  future_direction: string | null;
  updated_at: string;
};

export type Guardian = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
};

export const TOURNAMENT_GRADES = ["FIS", "A", "A(YH)", "B", "B(YT)"] as const;
export type TournamentGrade = (typeof TOURNAMENT_GRADES)[number];

export const TOURNAMENT_DAY_DISCIPLINES = ["SG", "GS", "SL", "PGS"] as const;
export type TournamentDayDiscipline = (typeof TOURNAMENT_DAY_DISCIPLINES)[number];

export const TOURNAMENT_DAY_GENDERS = ["Men", "Woman"] as const;
export type TournamentDayGender = (typeof TOURNAMENT_DAY_GENDERS)[number];

export const TOURNAMENT_MAX_DAYS = 10;

export type Tournament = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
  grade: string | null;
  tournament_url: string | null;
};

export type TournamentDay = {
  id: string;
  tournament_id: string;
  day_index: number;
  event_date: string | null;
  discipline: string | null;
  gender: string | null;
};

export type EntryType = "athlete" | "guardian_chaperone" | "coach_chaperone";

export type TournamentEntry = {
  id: string;
  entry_type: EntryType;
  athlete: { id: string; name: string } | null;
  guardian: { id: string; name: string; phone: string | null; email: string | null } | null;
  coach_id: string | null;
};

export type CoachDirectoryEntry = {
  id: string;
  email: string | null;
  role: string;
};
