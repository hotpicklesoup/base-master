import { dayNumber } from "./dates";
import type { Block, BlockRole, Settings, Song } from "./types";

/**
 * Daily routine design
 * --------------------
 * Every session runs in the same order so the hardest speed work happens while the hands are fresh:
 *   warm-up -> time -> speed -> rhythm -> dexterity -> songs
 * Staccato sixteenths (the 100 bpm goal) and the quarter-note pump are in every session.
 * Rhythm and dexterity rotate day by day so each gets regular attention without making sessions longer.
 */

export const ROLE_NAMES: Record<BlockRole, string> = {
  warmup: "Warm-up",
  time: "Time",
  speed: "Speed builder",
  rhythm: "Rhythm",
  dexterity: "Dexterity",
  songs: "Songs",
};

const RHYTHM_ROTATION = ["dotted-long-short", "tresillo", "dotted-pulse"];
const DEXTERITY_ROTATION = ["string-crossing-16ths", "permutations", "octave-16ths", "trills"];

type Slot = { role: BlockRole; minutes: number; pick?: number };

/** Minutes per block for each session length. `pick` offsets the daily rotation for a second block of the same role. */
const TEMPLATES: Record<Settings["sessionMinutes"], Slot[]> = {
  15: [
    { role: "warmup", minutes: 2 },
    { role: "time", minutes: 3 },
    { role: "speed", minutes: 5 },
    { role: "rhythm", minutes: 3 },
    { role: "dexterity", minutes: 2 },
  ],
  30: [
    { role: "warmup", minutes: 3 },
    { role: "time", minutes: 5 },
    { role: "speed", minutes: 7 },
    { role: "rhythm", minutes: 5 },
    { role: "dexterity", minutes: 5 },
    { role: "songs", minutes: 5 },
  ],
  45: [
    { role: "warmup", minutes: 4 },
    { role: "time", minutes: 6 },
    { role: "speed", minutes: 8 },
    { role: "rhythm", minutes: 6 },
    { role: "dexterity", minutes: 6 },
    { role: "rhythm", minutes: 5, pick: 1 },
    { role: "songs", minutes: 10 },
  ],
  60: [
    { role: "warmup", minutes: 5 },
    { role: "time", minutes: 8 },
    { role: "speed", minutes: 10 },
    { role: "rhythm", minutes: 7 },
    { role: "dexterity", minutes: 7 },
    { role: "rhythm", minutes: 6, pick: 1 },
    { role: "dexterity", minutes: 5, pick: 2 },
    { role: "songs", minutes: 12 },
  ],
};

/** The song that has gone longest without practice comes up next. */
export function nextSong(songs: Song[]): Song | undefined {
  return [...songs].sort((a, b) => (a.lastPracticed ?? "").localeCompare(b.lastPracticed ?? ""))[0];
}

export function buildRoutine(date: string, minutes: Settings["sessionMinutes"], songs: Song[]): Block[] {
  const day = dayNumber(date);
  const song = nextSong(songs);
  const slots = TEMPLATES[minutes].map((s) => ({ ...s }));

  // No songs yet: give song time to the speed builder and rhythm.
  const songSlot = slots.find((s) => s.role === "songs");
  if (songSlot && !song) {
    const speed = slots.find((s) => s.role === "speed")!;
    const rhythm = slots.find((s) => s.role === "rhythm")!;
    const toSpeed = Math.ceil(songSlot.minutes / 2);
    speed.minutes += toSpeed;
    rhythm.minutes += songSlot.minutes - toSpeed;
  }

  const blocks: Block[] = [];
  for (const slot of slots) {
    const offset = slot.pick ?? 0;
    switch (slot.role) {
      case "warmup":
        blocks.push({ role: "warmup", itemId: "spider", minutes: slot.minutes });
        break;
      case "time":
        blocks.push({ role: "time", itemId: "quarter-pump", minutes: slot.minutes });
        break;
      case "speed":
        blocks.push({ role: "speed", itemId: "staccato-16ths", minutes: slot.minutes });
        break;
      case "rhythm":
        blocks.push({ role: "rhythm", itemId: RHYTHM_ROTATION[(day + offset) % RHYTHM_ROTATION.length], minutes: slot.minutes });
        break;
      case "dexterity":
        blocks.push({ role: "dexterity", itemId: DEXTERITY_ROTATION[(day + offset) % DEXTERITY_ROTATION.length], minutes: slot.minutes });
        break;
      case "songs":
        if (song) blocks.push({ role: "songs", itemId: `song:${song.id}`, minutes: slot.minutes });
        break;
    }
  }
  return blocks;
}

export function totalMinutes(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + b.minutes, 0);
}
