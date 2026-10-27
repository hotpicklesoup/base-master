import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID } from "../data/exercises";
import { buildRoutine, nextSong, totalMinutes } from "./routine";
import type { Song } from "./types";

const song = (id: string, lastPracticed: string | null): Song => ({
  id,
  title: id,
  artist: "",
  targetBpm: 120,
  practiceBpm: 90,
  notes: "",
  lastPracticed,
});

describe("buildRoutine", () => {
  for (const minutes of [15, 30, 45, 60] as const) {
    it(`fills a ${minutes}-minute session exactly, with or without songs`, () => {
      expect(totalMinutes(buildRoutine("2026-10-27", minutes, []))).toBe(minutes);
      if (minutes > 15) expect(totalMinutes(buildRoutine("2026-10-27", minutes, [song("a", null)]))).toBe(minutes);
    });
  }

  it("always includes the pump and staccato sixteenths, in order", () => {
    for (const date of ["2026-10-27", "2026-10-28", "2026-10-29"]) {
      const ids = buildRoutine(date, 30, []).map((b) => b.itemId);
      expect(ids[0]).toBe("spider");
      expect(ids[1]).toBe("quarter-pump");
      expect(ids[2]).toBe("staccato-16ths");
    }
  });

  it("rotates rhythm work across days", () => {
    const rhythm = (date: string) => buildRoutine(date, 30, []).find((b) => b.role === "rhythm")!.itemId;
    const days = ["2026-10-27", "2026-10-28", "2026-10-29"].map(rhythm);
    expect(new Set(days).size).toBe(3);
  });

  it("is the same all day", () => {
    expect(buildRoutine("2026-10-27", 45, [])).toEqual(buildRoutine("2026-10-27", 45, []));
  });

  it("only references real exercises", () => {
    for (const b of buildRoutine("2026-10-27", 60, [])) {
      expect(EXERCISE_BY_ID[b.itemId]).toBeDefined();
    }
  });

  it("does not repeat an exercise in a long session", () => {
    const ids = buildRoutine("2026-10-27", 60, []).map((b) => b.itemId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("adds the least recently practiced song", () => {
    const blocks = buildRoutine("2026-10-27", 30, [song("old", "2026-10-01"), song("new", "2026-10-20")]);
    expect(blocks.at(-1)!.itemId).toBe("song:old");
  });
});

describe("nextSong", () => {
  it("prefers songs never practiced", () => {
    expect(nextSong([song("a", "2026-10-01"), song("b", null)])!.id).toBe("b");
  });
});
