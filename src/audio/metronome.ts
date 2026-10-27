import { describeStep, stepSeconds, type ScheduleConfig, type StepInfo } from "../lib/schedule";

/**
 * Web Audio metronome with a lookahead scheduler.
 *
 * A short setInterval wakes up every 25 ms and schedules any sounds due in the next ~120 ms
 * directly on the AudioContext clock, so timing stays sample-accurate even when the UI thread is busy.
 * The UI follows along with requestAnimationFrame, reading which scheduled steps have now sounded.
 *
 * Do not move sound timing onto setTimeout/setInterval or React state. See CLAUDE.md.
 */

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;
const START_DELAY_S = 0.08;

type Listener = (info: StepInfo) => void;

/** Share of the gap to the next hit that a guide note rings for. */
const SUSTAIN = 0.9;
const STACCATO = 0.35;
const MAX_NOTE_S = 1.5;

interface Scheduled {
  time: number;
  info: StepInfo;
}

class Metronome {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private cfg: ScheduleConfig | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private raf: number | null = null;
  private index = 0;
  private nextTime = 0;
  private playStart: number | null = null;
  private queue: Scheduled[] = [];
  private listeners = new Set<Listener>();
  private endListeners = new Set<() => void>();
  /** Audio-clock time when an example finishes, once everything has been scheduled. */
  private endTime: number | null = null;
  private volume = 0.8;
  playing = false;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Called when an example reaches its last bar and stops by itself. */
  onEnd(fn: () => void): () => void {
    this.endListeners.add(fn);
    return () => this.endListeners.delete(fn);
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }

  /** Must be called from a user gesture (tap) so browsers allow audio. */
  async start(cfg: ScheduleConfig) {
    const ctx = this.ensureContext();
    if (ctx.state !== "running") await ctx.resume();
    this.stopTimers();
    this.cfg = cfg;
    this.index = 0;
    this.queue = [];
    this.playStart = null;
    this.endTime = null;
    this.nextTime = ctx.currentTime + START_DELAY_S;
    this.playing = true;
    this.timer = setInterval(() => this.tick(), LOOKAHEAD_MS);
    this.tick();
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Change tempo, click or pattern while playing. Takes effect on the next scheduled step. */
  update(cfg: ScheduleConfig) {
    if (!this.cfg) return;
    // The count-in is fixed once started; changing it mid-run would shift the bar count.
    this.cfg = { ...cfg, countIn: this.cfg.countIn, example: this.cfg.example };
  }

  stop() {
    this.playing = false;
    this.stopTimers();
    this.queue = [];
    this.playStart = null;
  }

  /** Seconds since the first played (non count-in) step sounded. */
  elapsed(): number {
    if (!this.ctx || this.playStart === null) return 0;
    return Math.max(0, this.ctx.currentTime - this.playStart);
  }

  /** Two soft notes to say the block's time is up. */
  chime() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + 0.02;
    this.tone(t, 880, 0.25, 0.35, "sine");
    this.tone(t + 0.18, 1320, 0.35, 0.3, "sine");
  }

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx;
    // iOS Safari: route Web Audio as media playback so the silent switch doesn't mute the click.
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    try {
      if (nav.audioSession) nav.audioSession.type = "playback";
    } catch {
      /* not supported */
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor({ latencyHint: "interactive" });
    const master = ctx.createGain();
    master.gain.value = this.volume;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    return ctx;
  }

  private stopTimers() {
    if (this.timer !== null) clearInterval(this.timer);
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.timer = null;
    this.raf = null;
  }

  private tick() {
    const ctx = this.ctx;
    const cfg = this.cfg;
    if (!ctx || !cfg || !this.playing) return;
    while (this.endTime === null && this.nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const info = describeStep(cfg, this.index);
      if (cfg.example && info.phase === "play" && info.bar >= cfg.example.bars) {
        this.endTime = this.nextTime;
        break;
      }
      const dur = stepSeconds(info.bpm);
      if (info.phase === "play" && this.playStart === null) this.playStart = this.nextTime;
      if (info.click) this.click(this.nextTime, info.click);
      if (info.guide) {
        const share = cfg.staccato ? STACCATO : SUSTAIN;
        this.guide(this.nextTime, Math.min(dur * info.holdSteps * share, MAX_NOTE_S));
      }
      this.queue.push({ time: this.nextTime, info });
      this.nextTime += dur;
      this.index += 1;
    }
  }

  private frame = () => {
    if (!this.playing || !this.ctx) return;
    const now = this.ctx.currentTime;
    let latest: StepInfo | null = null;
    while (this.queue.length && this.queue[0].time <= now) {
      latest = this.queue.shift()!.info;
    }
    if (latest) for (const fn of this.listeners) fn(latest);
    if (this.endTime !== null && now >= this.endTime) {
      this.stop();
      for (const fn of this.endListeners) fn();
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private click(time: number, kind: "accent" | "beat" | "sub") {
    const freq = kind === "accent" ? 1568 : kind === "beat" ? 1175 : 880;
    const gain = kind === "sub" ? 0.28 : kind === "accent" ? 0.9 : 0.7;
    this.tone(time, freq, 0.045, gain, "triangle");
  }

  /** A short plucked tone that plays the exercise rhythm. */
  private guide(time: number, dur: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 110;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + dur);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(0.35, time + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filter).connect(env).connect(this.master!);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private tone(time: number, freq: number, dur: number, peak: number, type: OscillatorType) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(peak, time + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env).connect(this.master!);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }
}

export const metronome = new Metronome();
