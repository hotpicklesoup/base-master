import { describe, expect, it } from "vitest";
import { bpmForBar, COUNT_LABELS, describeStep, type ScheduleConfig } from "./schedule";

const base: ScheduleConfig = {
  bpm: 100,
  pattern: "x...".repeat(4),
  click: { mode: "all", subdivision: "none", gap: null },
  guide: false,
  countIn: false,
  ramp: null,
};

describe("describeStep", () => {
  it("accents beat 1 and clicks the other beats", () => {
    const clicks = Array.from({ length: 16 }, (_, i) => describeStep(base, i).click);
    expect(clicks[0]).toBe("accent");
    expect(clicks[4]).toBe("beat");
    expect(clicks[8]).toBe("beat");
    expect(clicks[12]).toBe("beat");
    expect(clicks.filter((c) => c !== null)).toHaveLength(4);
  });

  it("clicks only on 2 and 4 in twoFour mode", () => {
    const cfg = { ...base, click: { ...base.click, mode: "twoFour" as const } };
    const beats = [0, 4, 8, 12].map((i) => describeStep(cfg, i).click);
    expect(beats).toEqual([null, "beat", null, "beat"]);
  });

  it("adds eighth and sixteenth subdivisions", () => {
    const eighths = { ...base, click: { ...base.click, subdivision: "8ths" as const } };
    const sixteenths = { ...base, click: { ...base.click, subdivision: "16ths" as const } };
    expect(describeStep(eighths, 2).click).toBe("sub");
    expect(describeStep(eighths, 1).click).toBeNull();
    expect(describeStep(sixteenths, 1).click).toBe("sub");
  });

  it("silences the click and guide during gap bars", () => {
    const cfg = { ...base, guide: true, click: { ...base.click, gap: { on: 1, off: 3 } } };
    expect(describeStep(cfg, 0).muted).toBe(false);
    expect(describeStep(cfg, 16).muted).toBe(true);
    expect(describeStep(cfg, 16).click).toBeNull();
    expect(describeStep(cfg, 16).guide).toBe(false);
    expect(describeStep(cfg, 48).muted).toBe(true);
    expect(describeStep(cfg, 64).muted).toBe(false);
  });

  it("plays one bar of count-in before the pattern", () => {
    const cfg = { ...base, countIn: true, guide: true };
    expect(describeStep(cfg, 0).phase).toBe("countIn");
    expect(describeStep(cfg, 0).guide).toBe(false);
    expect(describeStep(cfg, 15).phase).toBe("countIn");
    const first = describeStep(cfg, 16);
    expect(first.phase).toBe("play");
    expect(first.bar).toBe(0);
    expect(first.patternStep).toBe(0);
    expect(first.guide).toBe(true);
  });

  it("loops multi-bar patterns across bars", () => {
    const cfg = { ...base, pattern: "x..".repeat(16) };
    expect(describeStep(cfg, 47).patternStep).toBe(47);
    expect(describeStep(cfg, 48).patternStep).toBe(0);
    expect(describeStep(cfg, 18).bar).toBe(1);
  });
});

describe("bpmForBar", () => {
  it("climbs by step every N bars and stops at the target", () => {
    const cfg = { ...base, ramp: { from: 70, to: 78, step: 2, everyBars: 4 } };
    expect(bpmForBar(cfg, 0)).toBe(70);
    expect(bpmForBar(cfg, 3)).toBe(70);
    expect(bpmForBar(cfg, 4)).toBe(72);
    expect(bpmForBar(cfg, 16)).toBe(78);
    expect(bpmForBar(cfg, 100)).toBe(78);
  });

  it("uses the fixed tempo without a ramp", () => {
    expect(bpmForBar(base, 10)).toBe(100);
  });
});

describe("COUNT_LABELS", () => {
  it("counts sixteenths", () => {
    expect(COUNT_LABELS.slice(0, 8)).toEqual(["1", "e", "&", "a", "2", "e", "&", "a"]);
  });
});
