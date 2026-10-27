# Woodshed

A practice app for one electric bass player. It runs a daily routine against a metronome, tracks tempo per exercise, and nudges the tempo up as runs come out clean. It is used on an iPhone in Safari, propped on a music stand, while holding a bass. Hands are busy, so every control must be big, readable at arm's length and quick to hit.

Changes arrive as GitHub issues that mention @claude. Each run is a fresh session: this file is the brief.

## The player's goals

These drive every decision. If a change doesn't serve one of them, say so in the PR.

1. **Metronome time.** Lock to the click, then keep time as the click thins out (2 and 4, beat 1, silent bars).
2. **Right-hand speed and evenness.** The headline target is **continuous staccato sixteenths at 100 bpm, clean**.
3. **Left-hand dexterity.** One finger per fret, permutations, trills, muting for staccato.
4. **Rhythm vocabulary.** Quarter-note pump, dotted eighths (long-short, 3-3-2, the dotted-eighth pulse).
5. **Songs.** They also learn songs for a band. Songs climb from a practice tempo to the record tempo.

## How the practice program works

- `src/data/exercises.ts` holds every exercise: instructions, rhythm pattern, click, and progression.
- **Tempo progression** (most exercises): *Clean* adds `step` bpm next time, *Almost* holds, *Too hard* drops two steps. Based on the tempo actually played. See `src/lib/progression.ts`.
- **Stage progression** (quarter-note pump): Clean moves to the next click challenge, Too hard goes back one.
- **Daily routine** (`src/lib/routine.ts`): warm-up, time, speed, rhythm, dexterity, songs, in that order, sized to 15/30/45/60 minutes. Staccato sixteenths and the pump are in every session; rhythm and dexterity rotate by day. Routines are deterministic for a given date.
- Patterns are strings on a sixteenth grid: `x` = play, `.` = rest, 16 characters per 4/4 bar. Multi-bar patterns loop.

## Stack

- Vite + React 18 + TypeScript, plain CSS. No router, no backend, no CSS framework.
- Data lives in `localStorage` under `woodshed:v1` (`src/lib/storage.ts`). There's a JSON backup/restore on the Progress tab.
- Deployed by Vercel from `main`; every PR gets a Vercel preview link. The owner tests previews on their phone.

```
src/
  audio/metronome.ts     Web Audio lookahead scheduler (the click, guide tone, chime)
  audio/wakeLock.ts      keeps the screen on while playing
  lib/schedule.ts        pure: what sounds at each sixteenth (clicks, gaps, count-in, ramps)
  lib/progression.ts     pure: tempo/stage changes after a result
  lib/routine.ts         pure: builds the day's routine
  lib/types.ts           shared types
  data/exercises.ts      the exercise library
  components/            Player (the practice screen), Fingerboard (rhythm display), TempoChart
  screens/               Today, Exercises, Songs, Progress
  state.tsx              app state + persistence
```

## Commands

```
npm ci              install
npm test            unit tests (vitest)
npm run typecheck   TypeScript
npm run build       typecheck + production build
npm run dev         local dev server
```

Before opening a PR, run `npm run typecheck`, `npm test` and `npm run build`. All three must pass.

## Rules

- **Audio timing.** All sound is scheduled on the `AudioContext` clock in `metronome.ts`. Never time sounds with `setTimeout`, `setInterval` or React state; those drift. New timing behaviour goes in `describeStep()` in `schedule.ts` as pure logic, with tests.
- **Test the logic.** Any change to scheduling, progression, routines or storage gets unit tests next to the file (`*.test.ts`).
- **Don't lose progress.** Keep `localStorage` data backward compatible. Add fields with defaults in `normalize()`. If a breaking change is unavoidable, migrate old data, don't discard it.
- **iPhone Safari first.** Audio must start from a tap. Test layouts at 390px wide. Touch targets at least 44px. No hover-only features.
- **Keep it small.** No new dependencies unless they clearly earn it; say why in the PR.
- **Musical accuracy matters.** Count syllables are `1 e & a`. Check that rhythms land where the instructions say they do.

## Design

Amp-and-bass look: dark mode is a blackface amp (tolex panels, bone text, rosewood neck with pearl inlays), light mode is silverface with a maple neck. The amber "jewel" pilot light is the Start button and the beat flash. All colors are CSS variables at the top of `src/styles.css`, defined for both modes; use those tokens, never raw hex in components.

- Type: Big Shoulders Display for titles and the tempo number, Atkinson Hyperlegible Next for everything else.
- Sentence case, plain verbs, no all-caps labels. Buttons say what they do.
- The fingerboard and the tempo number are the loud parts. Keep everything else quiet.

## Pull requests

- One issue, one PR. Reference the issue (`Closes #12`).
- Describe the change in plain words and list what to try on the phone preview (which tab, what to tap, what should happen).
- If the issue is ambiguous, make the most sensible call, say which call you made, and keep it easy to change.
