import type { ClickSettings } from "./types";

export const STEPS_PER_BAR = 16;
export const STEPS_PER_BEAT = 4;

export type ClickKind = "accent" | "beat" | "sub";

export interface Ramp {
  from: number;
  to: number;
  /** BPM added each time. */
  step: number;
  /** Bars between increases. */
  everyBars: number;
}

export interface ScheduleConfig {
  bpm: number;
  pattern: string;
  click: ClickSettings;
  /** Play the exercise rhythm as a guide tone. */
  guide: boolean;
  /** One bar of clicks before the exercise starts. */
  countIn: boolean;
  ramp: Ramp | null;
  /** Staccato exercise: guide notes are cut short instead of held to the next hit. */
  staccato?: boolean;
  /**
   * Example mode: play the rhythm as the model of what "correct" sounds like, then stop after `bars`.
   * The guide keeps playing through silent click bars, because that is the point of those bars.
   */
  example?: { bars: number };
}

export interface StepInfo {
  /** Absolute step since start, including count-in. */
  index: number;
  phase: "countIn" | "play";
  /** Bar number within the play phase (0-based). -1 during count-in. */
  bar: number;
  /** 0..15 within the bar. */
  stepInBar: number;
  /** Index into the pattern (play phase only). */
  patternStep: number;
  click: ClickKind | null;
  guide: boolean;
  /** Sixteenths from this step to the next hit in the pattern, for how long a guide note rings. */
  holdSteps: number;
  /** True during a silent gap bar. */
  muted: boolean;
  bpm: number;
}

export function countInSteps(cfg: ScheduleConfig): number {
  return cfg.countIn ? STEPS_PER_BAR : 0;
}

export function bpmForBar(cfg: ScheduleConfig, bar: number): number {
  if (!cfg.ramp || bar < 0) return cfg.ramp ? cfg.ramp.from : cfg.bpm;
  const { from, to, step, everyBars } = cfg.ramp;
  if (step <= 0 || everyBars <= 0) return to;
  const climbed = from + step * Math.floor(bar / everyBars);
  return Math.min(to, climbed);
}

export function isMutedBar(click: ClickSettings, bar: number): boolean {
  if (!click.gap || bar < 0) return false;
  const { on, off } = click.gap;
  if (off <= 0) return false;
  return bar % (on + off) >= on;
}

function clickFor(click: ClickSettings, stepInBar: number): ClickKind | null {
  if (stepInBar % STEPS_PER_BEAT === 0) {
    const beat = stepInBar / STEPS_PER_BEAT;
    switch (click.mode) {
      case "all":
        return beat === 0 ? "accent" : "beat";
      case "twoFour":
        return beat === 1 || beat === 3 ? "beat" : null;
      case "one":
        return beat === 0 ? "accent" : null;
    }
  }
  if (click.subdivision === "16ths") return "sub";
  if (click.subdivision === "8ths" && stepInBar % 2 === 0) return "sub";
  return null;
}

/** Sixteenths until the next "x" after this one, wrapping around the loop. */
export function holdStepsAt(pattern: string, patternStep: number): number {
  const len = pattern.length;
  for (let n = 1; n <= len; n++) {
    if (pattern[(patternStep + n) % len] === "x") return n;
  }
  return len || 1;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Bars for an example: at least four, whole trips round the pattern and the gap cycle. */
export function exampleBars(pattern: string, click: ClickSettings): number {
  const patternBars = Math.max(1, Math.ceil(pattern.length / STEPS_PER_BAR));
  const gapBars = click.gap ? click.gap.on + click.gap.off : 1;
  const cycle = (patternBars * gapBars) / gcd(patternBars, gapBars);
  return Math.ceil(Math.max(4, gapBars) / cycle) * cycle;
}

/** Describe what happens at an absolute step. Pure, so it can be tested without audio. */
export function describeStep(cfg: ScheduleConfig, index: number): StepInfo {
  const lead = countInSteps(cfg);
  if (index < lead) {
    const stepInBar = index % STEPS_PER_BAR;
    const onBeat = stepInBar % STEPS_PER_BEAT === 0;
    return {
      index,
      phase: "countIn",
      bar: -1,
      stepInBar,
      patternStep: -1,
      click: onBeat ? (stepInBar === 0 ? "accent" : "beat") : null,
      guide: false,
      holdSteps: 1,
      muted: false,
      bpm: bpmForBar(cfg, -1),
    };
  }
  const playStep = index - lead;
  const bar = Math.floor(playStep / STEPS_PER_BAR);
  const stepInBar = playStep % STEPS_PER_BAR;
  const len = Math.max(cfg.pattern.length, 1);
  const patternStep = playStep % len;
  const muted = isMutedBar(cfg.click, bar);
  const hit = cfg.pattern[patternStep] === "x";
  return {
    index,
    phase: "play",
    bar,
    stepInBar,
    patternStep,
    click: muted ? null : clickFor(cfg.click, stepInBar),
    guide: (cfg.guide || Boolean(cfg.example)) && hit && (!muted || Boolean(cfg.example)),
    holdSteps: holdStepsAt(cfg.pattern, patternStep),
    muted,
    bpm: bpmForBar(cfg, bar),
  };
}

export function stepSeconds(bpm: number): number {
  return 60 / bpm / STEPS_PER_BEAT;
}

/** Count syllables for each sixteenth in a bar: 1 e & a 2 e & a ... */
export const COUNT_LABELS = Array.from({ length: STEPS_PER_BAR }, (_, i) => {
  const sub = i % STEPS_PER_BEAT;
  if (sub === 0) return String(i / STEPS_PER_BEAT + 1);
  return ["", "e", "&", "a"][sub];
});
