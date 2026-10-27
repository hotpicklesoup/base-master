import { EXERCISE_BY_ID, FREE_METRONOME } from "../data/exercises";
import { currentSetting, summaryFor } from "../lib/progression";
import type { AppState, ClickSettings } from "../lib/types";

/** Everything the player needs, whether it's an exercise, a song or the free metronome. */
export interface PlayItem {
  itemId: string;
  kind: "exercise" | "song" | "free";
  title: string;
  summary: string;
  steps: string[];
  focus: string;
  notes?: string;
  pattern: string;
  bpm: number;
  click: ClickSettings;
  target?: number;
  stage?: number;
  stageLabel?: string;
  stageCount?: number;
  rampIn?: boolean;
  staccato?: boolean;
}

const SONG_PATTERN = "x...".repeat(4);

export function toPlayItem(itemId: string, state: AppState, date: string): PlayItem | null {
  if (itemId === "free") {
    return {
      itemId,
      kind: "free",
      title: "Metronome",
      summary: "Just the click, with the same options as the exercises.",
      steps: [],
      focus: "",
      pattern: FREE_METRONOME.pattern,
      bpm: 90,
      click: FREE_METRONOME.click,
    };
  }
  if (itemId.startsWith("song:")) {
    const song = state.songs.find((s) => `song:${s.id}` === itemId);
    if (!song) return null;
    return {
      itemId,
      kind: "song",
      title: song.title,
      summary: song.artist ? `${song.artist}. Record tempo ${song.targetBpm} bpm.` : `Record tempo ${song.targetBpm} bpm.`,
      steps: [
        "Work the hardest section first, looped, at the tempo shown.",
        "Mark it clean when you get through it twice in a row without stopping.",
        "Then play the whole song through once at the same tempo.",
      ],
      focus: "Lock the groove first; fills come second.",
      notes: song.notes || undefined,
      pattern: SONG_PATTERN,
      bpm: song.practiceBpm,
      click: { mode: "all", subdivision: "none", gap: null },
      target: song.targetBpm,
    };
  }
  const ex = EXERCISE_BY_ID[itemId];
  if (!ex) return null;
  const setting = currentSetting(ex, state.progress[itemId]);
  const stageCount = ex.progression.type === "stages" ? ex.progression.stages.length : undefined;
  return {
    itemId,
    kind: "exercise",
    title: ex.title,
    summary: summaryFor(ex, date),
    steps: ex.steps,
    focus: ex.focus,
    pattern: ex.pattern,
    bpm: setting.bpm,
    click: setting.click,
    target: setting.target,
    stage: setting.stage,
    stageLabel: setting.stageLabel,
    stageCount,
    rampIn: ex.rampIn,
    staccato: ex.staccato,
  };
}
