import { useEffect, useMemo, useRef, useState } from "react";
import { metronome } from "../audio/metronome";
import { keepAwake } from "../audio/wakeLock";
import type { ScheduleConfig, StepInfo } from "../lib/schedule";
import type { ClickMode, ClickSettings, Gap, Result, Subdivision, Swing } from "../lib/types";
import { useStore } from "../state";
import { Fingerboard } from "./Fingerboard";
import type { PlayItem } from "./playItem";

interface Props {
  item: PlayItem;
  /** Planned length of this block. */
  minutes?: number;
  inRoutine: boolean;
  /** Called after a result is logged, with what changes next time. */
  onRecorded?: (message: string) => void;
  onSkip?: () => void;
}

const CLICK_MODES: { value: ClickMode; label: string }[] = [
  { value: "all", label: "Every beat" },
  { value: "twoFour", label: "2 and 4" },
  { value: "one", label: "Beat 1" },
];

const SUBDIVISIONS: { value: Subdivision; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "8ths", label: "8ths" },
  { value: "16ths", label: "16ths" },
];

const SWINGS: { value: Swing; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "light", label: "Light swing" },
  { value: "shuffle", label: "Shuffle" },
];

const GAPS: { value: string; label: string; gap: Gap | null }[] = [
  { value: "none", label: "Off", gap: null },
  { value: "3-1", label: "3 on, 1 off", gap: { on: 3, off: 1 } },
  { value: "2-2", label: "2 on, 2 off", gap: { on: 2, off: 2 } },
  { value: "1-3", label: "1 on, 3 off", gap: { on: 1, off: 3 } },
];

const gapKey = (g: Gap | null) => (g ? `${g.on}-${g.off}` : "none");

export function describeClick(c: ClickSettings): string {
  const mode = c.mode === "all" ? "Click on every beat" : c.mode === "twoFour" ? "Click on 2 and 4" : "Click on beat 1";
  const sub = c.subdivision === "none" ? "" : `, ${c.subdivision === "8ths" ? "eighths" : "sixteenths"} between`;
  const feel = c.swing === "shuffle" ? ", shuffle feel" : c.swing === "light" ? ", light swing" : "";
  const gap = c.gap ? `, ${c.gap.on} bar${c.gap.on > 1 ? "s" : ""} on and ${c.gap.off} off` : "";
  return mode + sub + feel + gap;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const clampBpm = (n: number) => Math.min(300, Math.max(30, Math.round(n)));

export function Player({ item, minutes, inRoutine, onRecorded, onSkip }: Props) {
  const { state, record } = useStore();
  const { settings } = state;
  const [bpm, setBpm] = useState(item.bpm);
  const [click, setClick] = useState<ClickSettings>(item.click);
  const [guide, setGuide] = useState(false);
  const [rampOn, setRampOn] = useState(Boolean(item.rampIn));
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState<StepInfo | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const banked = useRef(0);
  const chimed = useRef(false);
  const taps = useRef<number[]>([]);

  const ramp = rampOn ? { from: Math.max(40, bpm - 8), to: bpm, step: 2, everyBars: 4 } : null;
  const config: ScheduleConfig = useMemo(
    () => ({ bpm, pattern: item.pattern, click, guide, countIn: settings.countIn, ramp }),
    // `ramp` is derived from bpm and rampOn, which are both listed.
    [bpm, item.pattern, click, guide, settings.countIn, rampOn],
  );

  // Follow the audio clock for the fingerboard and tempo display.
  useEffect(() => metronome.subscribe(setStep), []);

  // Push changes to the engine while playing.
  useEffect(() => {
    if (playing) metronome.update(config);
  }, [config, playing]);

  // Practice timer, counting only time actually played.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const total = banked.current + metronome.elapsed();
      setElapsed(total);
      if (minutes && !chimed.current && total >= minutes * 60) {
        chimed.current = true;
        metronome.chime();
      }
    }, 250);
    return () => clearInterval(id);
  }, [playing, minutes]);

  // Stop when leaving this exercise.
  useEffect(
    () => () => {
      metronome.stop();
      keepAwake(false);
    },
    [],
  );

  const start = async () => {
    setMessage(null);
    await metronome.start(config);
    setPlaying(true);
    if (settings.keepAwake) keepAwake(true);
  };

  const stop = () => {
    banked.current += metronome.elapsed();
    setElapsed(banked.current);
    metronome.stop();
    keepAwake(false);
    setPlaying(false);
    setStep(null);
  };

  const nudge = (d: number) => {
    setRampOn(false);
    setBpm((b) => clampBpm(b + d));
  };

  const tap = () => {
    const now = performance.now();
    const recent = [...taps.current.filter((t) => now - t < 2500), now];
    taps.current = recent;
    if (recent.length >= 3) {
      const gaps = recent.slice(1).map((t, i) => t - recent[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setRampOn(false);
      setBpm(clampBpm(60000 / avg));
    }
  };

  const finish = (result: Result) => {
    if (playing) stop();
    const seconds = banked.current + (playing ? metronome.elapsed() : 0);
    const msg = record({ itemId: item.itemId, result, bpm, stage: item.stage, seconds, inRoutine });
    setMessage(msg);
    onRecorded?.(msg);
  };

  const shownBpm = playing && step ? step.bpm : rampOn && playing ? ramp!.from : bpm;
  const beatFlash = playing && step !== null && step.stepInBar % 4 === 0 && (step.click === "accent" || step.click === "beat");
  const climbing = playing && rampOn && step !== null && step.bpm < bpm;

  return (
    <section className="player" aria-label={item.title}>
      <header className="player-head">
        <h2 className="ex-title">{item.title}</h2>
        <p className="ex-summary">{item.summary}</p>
        {item.stageLabel && (
          <p className="ex-stage">
            Stage {item.stage! + 1} of {item.stageCount}: {item.stageLabel}
          </p>
        )}
        {item.notes && <p className="ex-notes">{item.notes}</p>}
      </header>

      <Fingerboard pattern={item.pattern} step={step} playing={playing} />

      <div className="tempo">
        <div className="tempo-readout" aria-live="off">
          <span className="tempo-num">{shownBpm}</span>
          <span className="tempo-unit">bpm</span>
        </div>
        <p className="tempo-note">
          {climbing
            ? `Warming up to ${bpm}`
            : item.target
              ? bpm >= item.target
                ? `At or past the goal of ${item.target}`
                : `Goal ${item.target}`
              : " "}
        </p>
      </div>

      <div className="transport">
        <button className="nudge" onClick={() => nudge(-5)} aria-label="Slower by 5">
          −5
        </button>
        <button className="nudge" onClick={() => nudge(-1)} aria-label="Slower by 1">
          −1
        </button>
        <button
          className={`jewel${playing ? " lit" : ""}${beatFlash ? " flash" : ""}${beatFlash && step?.click === "accent" ? " accent" : ""}`}
          onClick={playing ? stop : start}
          aria-label={playing ? "Stop" : "Start"}
        >
          <span className="jewel-icon" aria-hidden="true">
            {playing ? "■" : "▶"}
          </span>
        </button>
        <button className="nudge" onClick={() => nudge(1)} aria-label="Faster by 1">
          +1
        </button>
        <button className="nudge" onClick={() => nudge(5)} aria-label="Faster by 5">
          +5
        </button>
      </div>
      <p className="transport-label">{playing ? "Stop" : "Start"}</p>

      {minutes ? (
        <div className="timer">
          <div className="timer-bar">
            <span style={{ width: `${Math.min(100, (elapsed / (minutes * 60)) * 100)}%` }} />
          </div>
          <p>
            {formatTime(elapsed)} of {minutes}:00
            {elapsed >= minutes * 60 ? ". Time's up when you're ready." : ""}
          </p>
        </div>
      ) : (
        elapsed > 0 && <p className="timer-plain">{formatTime(elapsed)} played</p>
      )}

      <div className="options">
        <div className="options-row">
          <p className="options-summary">
            {describeClick(click)}
            {guide ? ". Rhythm guide on." : "."}
          </p>
          <button className="link" onClick={() => setShowOptions((v) => !v)} aria-expanded={showOptions}>
            {showOptions ? "Done" : "Change"}
          </button>
        </div>
        {showOptions && (
          <div className="options-panel">
            <Segmented label="Click" options={CLICK_MODES} value={click.mode} onChange={(mode) => setClick({ ...click, mode })} />
            <Segmented
              label="Between beats"
              options={SUBDIVISIONS}
              value={click.subdivision}
              onChange={(subdivision) => setClick({ ...click, subdivision })}
            />
            <Segmented
              label="Feel"
              options={SWINGS}
              value={click.swing ?? "straight"}
              onChange={(swing) => setClick({ ...click, swing })}
            />
            <Segmented
              label="Silent bars"
              options={GAPS.map(({ value, label }) => ({ value, label }))}
              value={gapKey(click.gap)}
              onChange={(v) => setClick({ ...click, gap: GAPS.find((g) => g.value === v)!.gap })}
            />
            <label className="toggle">
              <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
              <span>Play the rhythm with a guide tone</span>
            </label>
            {item.rampIn && (
              <label className="toggle">
                <input type="checkbox" checked={rampOn} onChange={(e) => setRampOn(e.target.checked)} />
                <span>Start 8 bpm slower and climb 2 bpm every 4 bars</span>
              </label>
            )}
            {item.kind === "free" && (
              <button className="secondary" onClick={tap}>
                Tap tempo
              </button>
            )}
          </div>
        )}
      </div>

      {item.steps.length > 0 && (
        <div className="how">
          <button className="how-toggle" onClick={() => setShowHow((v) => !v)} aria-expanded={showHow}>
            {showHow ? "Hide how to play" : "How to play"}
          </button>
          {showHow && (
            <div className="how-body">
              <ol>
                {item.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {item.focus && <p className="how-focus">{item.focus}</p>}
            </div>
          )}
        </div>
      )}

      {item.kind !== "free" && (
        <div className="verdict">
          <p className="verdict-q">How did it go at {bpm} bpm?</p>
          <div className="verdict-buttons">
            <button className="verdict-btn clean" onClick={() => finish("clean")}>
              Clean
            </button>
            <button className="verdict-btn almost" onClick={() => finish("almost")}>
              Almost
            </button>
            <button className="verdict-btn hard" onClick={() => finish("tooHard")}>
              Too hard
            </button>
          </div>
          {message && !inRoutine && <p className="verdict-msg">{message}</p>}
          {onSkip && (
            <button className="link skip" onClick={onSkip}>
              Skip this today
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="seg">
      <legend>{label}</legend>
      <div className="seg-options">
        {options.map((o) => (
          <button key={o.value} className={o.value === value ? "on" : ""} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
