export type Goal = "time" | "right" | "left" | "rhythm";

/** Which beats get a click. */
export type ClickMode = "all" | "twoFour" | "one";

/** Extra quiet clicks between beats. */
export type Subdivision = "none" | "8ths" | "16ths";

export interface Gap {
  /** Bars with the click on. */
  on: number;
  /** Bars with the click silent. */
  off: number;
}

export interface ClickSettings {
  mode: ClickMode;
  subdivision: Subdivision;
  gap: Gap | null;
}

export interface TempoProgression {
  type: "tempo";
  /** Starting working tempo for a new player. */
  start: number;
  /** BPM added after a clean run. */
  step: number;
  /** The goal tempo. */
  target: number;
  /** Ceiling once past the goal. */
  max: number;
  /** Floor when backing off. */
  min: number;
}

export interface Stage {
  label: string;
  bpm: number;
  click: ClickSettings;
}

export interface StageProgression {
  type: "stages";
  stages: Stage[];
}

export type Progression = TempoProgression | StageProgression;

export interface Exercise {
  id: string;
  title: string;
  goal: Goal;
  /** One sentence shown under the title. May contain {variant}. */
  summary: string;
  /** How to play it, in order. */
  steps: string[];
  /** What to listen for. */
  focus: string;
  /**
   * Rhythm on a sixteenth-note grid: "x" = play, "." = rest.
   * Length is a multiple of 16 (one bar of 4/4 per 16 steps).
   */
  pattern: string;
  /** Default click for tempo-based exercises. Stage exercises use each stage's click. */
  click: ClickSettings;
  progression: Progression;
  /** Start each run a little below working tempo and climb to it. */
  rampIn?: boolean;
  /** Rotating daily variants, e.g. finger orders. Replaces {variant} in the summary. */
  variants?: string[];
}

export type Result = "clean" | "almost" | "tooHard";

export interface ExerciseProgress {
  /** Working tempo for tempo exercises. */
  bpm?: number;
  /** Current stage index for stage exercises. */
  stage?: number;
  /** Highest tempo (or stage) logged as clean. */
  bestClean?: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  targetBpm: number;
  practiceBpm: number;
  notes: string;
  lastPracticed: string | null;
}

export interface LogEntry {
  /** Local date, YYYY-MM-DD. */
  date: string;
  /** Exercise id, or "song:<id>". */
  itemId: string;
  bpm: number;
  stage?: number;
  result: Result;
  seconds: number;
}

export type BlockRole = "warmup" | "time" | "speed" | "rhythm" | "dexterity" | "songs";

export interface Block {
  role: BlockRole;
  /** Exercise id, or "song:<id>". */
  itemId: string;
  minutes: number;
}

export interface TodayRecord {
  result: Result | "skipped";
  /** What the app said will change next time. */
  message: string;
}

export interface TodayState {
  date: string;
  /** Results by block item id, so changing session length keeps finished work. */
  results: Record<string, TodayRecord>;
  /** Block the player chose to jump to, if not the first unfinished one. */
  focus: string | null;
}

export interface Settings {
  sessionMinutes: 15 | 30 | 45 | 60;
  countIn: boolean;
  volume: number;
  keepAwake: boolean;
}

export interface AppState {
  version: 1;
  settings: Settings;
  progress: Record<string, ExerciseProgress>;
  songs: Song[];
  log: LogEntry[];
  today: TodayState | null;
}
