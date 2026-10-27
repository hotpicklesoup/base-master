import { dayNumber } from "./dates";
import type { ClickSettings, Exercise, ExerciseProgress, Result, Song, TempoProgression } from "./types";

export interface Setting {
  bpm: number;
  click: ClickSettings;
  /** Stage index for stage exercises. */
  stage?: number;
  /** Human label for the current stage. */
  stageLabel?: string;
  /** Goal tempo, when there is one. */
  target?: number;
}

export function currentSetting(ex: Exercise, p: ExerciseProgress | undefined): Setting {
  const prog = ex.progression;
  if (prog.type === "stages") {
    const stage = clamp(p?.stage ?? 0, 0, prog.stages.length - 1);
    const s = prog.stages[stage];
    return { bpm: s.bpm, click: s.click, stage, stageLabel: s.label };
  }
  return { bpm: p?.bpm ?? prog.start, click: ex.click, target: prog.target };
}

export interface Outcome {
  progress: ExerciseProgress;
  /** Short line telling the player what changes next time. */
  message: string;
}

export function applyResult(ex: Exercise, p: ExerciseProgress | undefined, result: Result, playedBpm: number): Outcome {
  const prog = ex.progression;
  const prev = p ?? {};
  if (prog.type === "stages") {
    const last = prog.stages.length - 1;
    const stage = clamp(prev.stage ?? 0, 0, last);
    let next = stage;
    if (result === "clean") next = Math.min(last, stage + 1);
    if (result === "tooHard") next = Math.max(0, stage - 1);
    const bestClean = result === "clean" ? Math.max(prev.bestClean ?? -1, stage) : prev.bestClean;
    const label = prog.stages[next].label;
    let message: string;
    if (result === "clean" && stage === last) message = "Top stage, clean. Keep it in the rotation.";
    else if (next === stage) message = `Same again next time: ${lower(label)}.`;
    else message = `Next time: ${lower(label)}.`;
    return { progress: { ...prev, stage: next, bestClean }, message };
  }
  const { bpm, bestClean } = nextTempo(prog, prev.bpm ?? prog.start, prev.bestClean, result, playedBpm);
  let message: string;
  if (result === "clean" && playedBpm >= prog.target && (prev.bestClean ?? 0) < prog.target) {
    message = `Clean at ${playedBpm}. That's the goal. Next time: ${bpm} bpm.`;
  } else if (bpm === playedBpm) {
    message = `Same tempo next time: ${bpm} bpm.`;
  } else {
    message = `Next time: ${bpm} bpm.`;
  }
  return { progress: { ...prev, bpm, bestClean }, message };
}

export function nextTempo(
  prog: Pick<TempoProgression, "step" | "min" | "max">,
  _working: number,
  bestClean: number | undefined,
  result: Result,
  playedBpm: number,
): { bpm: number; bestClean: number | undefined } {
  const base = Math.round(playedBpm);
  if (result === "clean") {
    return { bpm: Math.min(prog.max, base + prog.step), bestClean: Math.max(bestClean ?? 0, base) };
  }
  if (result === "tooHard") {
    return { bpm: Math.max(prog.min, base - prog.step * 2), bestClean };
  }
  return { bpm: clamp(base, prog.min, prog.max), bestClean };
}

/** Songs climb toward their target in 4 bpm steps. */
export function applySongResult(song: Song, result: Result, playedBpm: number): { song: Song; message: string } {
  const prog = { step: 4, min: 40, max: song.targetBpm };
  const { bpm } = nextTempo(prog, song.practiceBpm, undefined, result, playedBpm);
  const message =
    result === "clean" && playedBpm >= song.targetBpm
      ? `Clean at full tempo. Play it with the record next.`
      : bpm === playedBpm
        ? `Same tempo next time: ${bpm} bpm.`
        : `Next time: ${bpm} bpm.`;
  return { song: { ...song, practiceBpm: bpm }, message };
}

export function variantFor(ex: Exercise, date: string): string | undefined {
  if (!ex.variants?.length) return undefined;
  return ex.variants[dayNumber(date) % ex.variants.length];
}

export function summaryFor(ex: Exercise, date: string): string {
  const v = variantFor(ex, date);
  return v ? ex.summary.replace("{variant}", v) : ex.summary;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
