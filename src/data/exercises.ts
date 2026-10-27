import type { ClickSettings, Exercise, Goal } from "../lib/types";

const beats = (subdivision: ClickSettings["subdivision"] = "none"): ClickSettings => ({
  mode: "all",
  subdivision,
  gap: null,
});

const SIXTEENTHS = "x".repeat(16);
const EIGHTHS = "x.".repeat(8);

export const GOAL_NAMES: Record<Goal, string> = {
  time: "Time feel",
  right: "Right hand",
  left: "Left hand",
  rhythm: "Rhythm",
};

export const EXERCISES: Exercise[] = [
  {
    id: "quarter-pump",
    title: "Quarter-note pump",
    goal: "time",
    summary: "Steady quarters locked to the click, then holding time as the click thins out.",
    steps: [
      "Play quarter notes on one note. Open E or A is fine.",
      "Alternate index and middle on every note, no exceptions.",
      "Let each note ring right up to the next one: same length, same volume.",
      "When the click drops out, keep going. You should land right back on it when it returns.",
    ],
    focus: "When you're locked in, the click disappears under your note. If you can hear it clearly, you're early or late.",
    pattern: "x...".repeat(4),
    click: beats(),
    progression: {
      type: "stages",
      stages: [
        { label: "Click on every beat", bpm: 80, click: beats() },
        { label: "Click on 2 and 4", bpm: 80, click: { mode: "twoFour", subdivision: "none", gap: null } },
        { label: "Click on 2 and 4, every fourth bar silent", bpm: 80, click: { mode: "twoFour", subdivision: "none", gap: { on: 3, off: 1 } } },
        { label: "Click on beat 1 only", bpm: 80, click: { mode: "one", subdivision: "none", gap: null } },
        { label: "One bar of click, three bars silent", bpm: 80, click: { mode: "all", subdivision: "none", gap: { on: 1, off: 3 } } },
        { label: "Slow: click on 2 and 4 at 60", bpm: 60, click: { mode: "twoFour", subdivision: "none", gap: null } },
        { label: "Slow: one bar on, three bars silent", bpm: 60, click: { mode: "all", subdivision: "none", gap: { on: 1, off: 3 } } },
        { label: "Fast: one bar on, three bars silent at 120", bpm: 120, click: { mode: "all", subdivision: "none", gap: { on: 1, off: 3 } } },
      ],
    },
  },
  {
    id: "staccato-16ths",
    title: "Staccato sixteenths",
    goal: "right",
    summary: "Continuous, even sixteenths, each one cut short. The goal is 100 bpm, clean.",
    steps: [
      "Fret one note. A string, 5th fret is a good place to start.",
      "Alternate index and middle strictly, never the same finger twice in a row.",
      "Cut every note short: ease off the fretting pressure right after each pluck so the note stops, without lifting off the string.",
      "Stay loose. If your forearm or shoulder tightens up, you're past today's tempo.",
    ],
    focus: "Equal gaps between notes, equal volume, and real silence between them.",
    pattern: SIXTEENTHS,
    click: beats(),
    progression: { type: "tempo", start: 70, step: 2, target: 100, max: 120, min: 50 },
    rampIn: true,
    staccato: true,
  },
  {
    id: "dotted-long-short",
    title: "Dotted eighth and sixteenth",
    goal: "rhythm",
    summary: "The long-short figure: one note on the beat, one on the last sixteenth before the next beat.",
    steps: [
      "Count sixteenths out loud: 1 e & a, 2 e & a.",
      "Play on the beat and on the a. The beat note is long, so hold it through e and &.",
      "Use one note, or root on the beat and octave on the a.",
      "Keep the short note tight. It's a pickup into the next beat.",
    ],
    focus: "The a sits just before the next beat, later than a swung eighth would.",
    pattern: "x..x".repeat(4),
    click: beats("16ths"),
    progression: { type: "tempo", start: 60, step: 3, target: 110, max: 130, min: 50 },
  },
  {
    id: "tresillo",
    title: "Three-three-two",
    goal: "rhythm",
    summary: "Dotted eighth, dotted eighth, eighth. A grouping that drives a lot of rock, funk and soul lines.",
    steps: [
      "Count 1 e & a 2 e & a. The notes fall on 1, the a of 1, and the & of 2. Then the same on beats 3 and 4.",
      "Start on one note, then try root, root, fifth.",
      "Hold the two dotted notes full length. The eighth is the pickup into the next group.",
    ],
    focus: "Three even-feeling notes that don't line up with the click, resolving on beats 1 and 3.",
    pattern: "x..x..x.".repeat(2),
    click: beats("8ths"),
    progression: { type: "tempo", start: 60, step: 3, target: 110, max: 130, min: 50 },
  },
  {
    id: "dotted-pulse",
    title: "Dotted-eighth pulse",
    goal: "rhythm",
    summary: "A note every three sixteenths. It crosses the bar line and comes back to beat 1 every three bars.",
    steps: [
      "Count sixteenths and play on every third one.",
      "Cycle three notes, root, fifth, octave, so each one starts a group.",
      "It lines up with beat 1 again after three bars. Aim to land it.",
    ],
    focus: "Hold your line against the click. Don't let the click pull your notes onto the beat.",
    pattern: "x..".repeat(16),
    click: beats("16ths"),
    progression: { type: "tempo", start: 60, step: 2, target: 100, max: 120, min: 50 },
  },
  {
    id: "string-crossing-16ths",
    title: "Sixteenths across strings",
    goal: "right",
    summary: "Four sixteenths on each string, E to G and back, with strict alternation through every crossing.",
    steps: [
      "Play four sixteenths on each open string: E, A, D, G, then back down.",
      "Keep alternating. String changes are where fingers want to repeat. Don't let them.",
      "Mute the string you just left, with your thumb going up and the next finger coming down.",
    ],
    focus: "No strings ringing behind you, and no jump in volume when you change strings.",
    pattern: SIXTEENTHS,
    click: beats(),
    progression: { type: "tempo", start: 60, step: 2, target: 100, max: 120, min: 50 },
    rampIn: true,
  },
  {
    id: "octave-16ths",
    title: "Octave sixteenths",
    goal: "right",
    summary: "Root and octave on alternating sixteenths. Busy, driving, and a real test of staccato.",
    steps: [
      "Fret a root with your index (A string, 5th fret) and the octave two strings up with your ring finger or pinky.",
      "Alternate root and octave on every sixteenth.",
      "Pick a plucking pattern, index on the low note and middle on the high one, and keep it.",
      "Keep it short: release pressure with both fretting fingers between notes.",
    ],
    focus: "Both notes the same length and volume. The octave shouldn't jump out.",
    pattern: SIXTEENTHS,
    click: beats(),
    progression: { type: "tempo", start: 60, step: 2, target: 100, max: 120, min: 50 },
    rampIn: true,
    staccato: true,
  },
  {
    id: "spider",
    title: "Spider: 1-2-3-4",
    goal: "left",
    summary: "One finger per fret across all four strings. The left-hand warm-up.",
    steps: [
      "Start at the 5th fret on E and play frets 5-6-7-8 with fingers 1-2-3-4.",
      "Repeat on A, D and G. Then move up one fret and come back down.",
      "Leave each finger down until it's needed elsewhere, and keep the others hovering close to the strings.",
      "Thumb behind the neck, roughly behind your middle finger. Don't squeeze.",
    ],
    focus: "Every note full and buzz-free, with no finger flying away from the fretboard.",
    pattern: EIGHTHS,
    click: beats(),
    progression: { type: "tempo", start: 60, step: 4, target: 120, max: 140, min: 50 },
  },
  {
    id: "permutations",
    title: "Finger permutations",
    goal: "left",
    summary: "A different finger order each day to build independence. Today's order: {variant}.",
    steps: [
      "Use the same one-finger-per-fret box as the spider, frets 5 to 8.",
      "Play today's finger order on each string, E to G and back.",
      "Go slow enough that you never hesitate on the next finger.",
    ],
    focus: "Fingers 3 and 4 move independently, without dragging their neighbours.",
    pattern: SIXTEENTHS,
    click: beats(),
    progression: { type: "tempo", start: 50, step: 2, target: 90, max: 110, min: 40 },
    variants: ["1-3-2-4", "1-4-2-3", "1-2-4-3", "1-3-4-2", "1-4-3-2", "2-1-3-4", "2-4-1-3", "3-1-4-2", "4-2-3-1", "4-3-2-1"],
  },
  {
    id: "trills",
    title: "Hammer-on and pull-off trills",
    goal: "left",
    summary: "One-bar trills between finger pairs to build fretting strength.",
    steps: [
      "Pluck once on each beat, then hammer and pull between two fingers for the rest of the beat.",
      "Work through the pairs, one bar each: 1-2, 1-3, 1-4, 2-3, 2-4, 3-4.",
      "Every hammered and pulled note should be as loud as the plucked one.",
    ],
    focus: "The pull-offs especially: pull slightly sideways so the string sounds, don't just lift.",
    pattern: SIXTEENTHS,
    click: beats(),
    progression: { type: "tempo", start: 60, step: 2, target: 100, max: 120, min: 50 },
  },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** The free metronome is a quarter-note "exercise" with no progression saved. */
export const FREE_METRONOME: Exercise = {
  id: "free",
  title: "Metronome",
  goal: "time",
  summary: "Just the click.",
  steps: [],
  focus: "",
  pattern: "x...".repeat(4),
  click: beats(),
  progression: { type: "tempo", start: 90, step: 0, target: 90, max: 300, min: 30 },
};
