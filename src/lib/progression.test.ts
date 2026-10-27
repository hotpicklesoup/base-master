import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID } from "../data/exercises";
import { applyResult, applySongResult, currentSetting, summaryFor } from "./progression";
import type { Song } from "./types";

const staccato = EXERCISE_BY_ID["staccato-16ths"];
const pump = EXERCISE_BY_ID["quarter-pump"];

describe("tempo progression", () => {
  it("starts at the exercise's starting tempo", () => {
    expect(currentSetting(staccato, undefined).bpm).toBe(70);
  });

  it("goes up one step after a clean run", () => {
    const { progress } = applyResult(staccato, { bpm: 70 }, "clean", 70);
    expect(progress.bpm).toBe(72);
    expect(progress.bestClean).toBe(70);
  });

  it("holds after an almost", () => {
    expect(applyResult(staccato, { bpm: 80 }, "almost", 80).progress.bpm).toBe(80);
  });

  it("backs off two steps after too hard, not below the floor", () => {
    expect(applyResult(staccato, { bpm: 80 }, "tooHard", 80).progress.bpm).toBe(76);
    expect(applyResult(staccato, { bpm: 51 }, "tooHard", 51).progress.bpm).toBe(50);
  });

  it("uses the tempo actually played", () => {
    expect(applyResult(staccato, { bpm: 80 }, "clean", 84).progress.bpm).toBe(86);
  });

  it("calls out reaching the goal", () => {
    const { message } = applyResult(staccato, { bpm: 100, bestClean: 98 }, "clean", 100);
    expect(message).toMatch(/goal/);
  });

  it("caps at the ceiling", () => {
    expect(applyResult(staccato, { bpm: 120 }, "clean", 120).progress.bpm).toBe(120);
  });
});

describe("stage progression", () => {
  it("starts at stage 0", () => {
    const s = currentSetting(pump, undefined);
    expect(s.stage).toBe(0);
    expect(s.click.mode).toBe("all");
  });

  it("moves through stages", () => {
    expect(applyResult(pump, { stage: 0 }, "clean", 80).progress.stage).toBe(1);
    expect(applyResult(pump, { stage: 3 }, "tooHard", 80).progress.stage).toBe(2);
    expect(applyResult(pump, { stage: 0 }, "tooHard", 80).progress.stage).toBe(0);
  });

  it("stays on the last stage", () => {
    const last = pump.progression.type === "stages" ? pump.progression.stages.length - 1 : 0;
    expect(applyResult(pump, { stage: last }, "clean", 120).progress.stage).toBe(last);
  });
});

describe("songs", () => {
  const song: Song = { id: "a", title: "La Grange", artist: "ZZ Top", targetBpm: 162, practiceBpm: 120, notes: "", lastPracticed: null };

  it("climbs 4 bpm at a time up to the record tempo", () => {
    expect(applySongResult(song, "clean", 120).song.practiceBpm).toBe(124);
    expect(applySongResult({ ...song, practiceBpm: 160 }, "clean", 160).song.practiceBpm).toBe(162);
  });
});

describe("variants", () => {
  it("rotates the finger order by day", () => {
    const ex = EXERCISE_BY_ID.permutations;
    const a = summaryFor(ex, "2026-10-27");
    const b = summaryFor(ex, "2026-10-28");
    expect(a).not.toContain("{variant}");
    expect(a).not.toEqual(b);
  });
});
