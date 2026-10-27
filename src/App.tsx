import { useEffect, useRef, useState } from "react";
import { metronome } from "./audio/metronome";
import { Player } from "./components/Player";
import { toPlayItem } from "./components/playItem";
import { Exercises } from "./screens/Exercises";
import { Progress } from "./screens/Progress";
import { Songs } from "./screens/Songs";
import { Today } from "./screens/Today";
import { useStore } from "./state";

type Tab = "today" | "exercises" | "songs" | "progress";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "exercises", label: "Exercises" },
  { id: "songs", label: "Songs" },
  { id: "progress", label: "Progress" },
];

export function App() {
  const { state, today, updateSettings } = useStore();
  const [tab, setTab] = useState<Tab>("today");
  const [detail, setDetail] = useState<string | null>(null);
  const settingsRef = useRef<HTMLDialogElement>(null);

  useEffect(() => metronome.setVolume(state.settings.volume), [state.settings.volume]);

  const go = (t: Tab) => {
    setDetail(null);
    setTab(t);
    window.scrollTo(0, 0);
  };

  const open = (itemId: string) => {
    setDetail(itemId);
    window.scrollTo(0, 0);
  };

  const item = detail ? toPlayItem(detail, state, today.date) : null;

  return (
    <div className="app">
      <main className="main">
        {item ? (
          <div className="screen">
            <button className="back" onClick={() => setDetail(null)}>
              Back to {TABS.find((t) => t.id === tab)?.label}
            </button>
            <Player key={item.itemId} item={item} inRoutine={false} />
          </div>
        ) : tab === "today" ? (
          <Today onOpenSettings={() => settingsRef.current?.showModal()} onBrowse={() => go("exercises")} />
        ) : tab === "exercises" ? (
          <Exercises open={open} />
        ) : tab === "songs" ? (
          <Songs open={open} />
        ) : (
          <Progress />
        )}
      </main>

      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? "on" : ""} aria-current={t.id === tab ? "page" : undefined} onClick={() => go(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <dialog ref={settingsRef} className="sheet" aria-label="Settings" onClick={(e) => e.target === settingsRef.current && settingsRef.current?.close()}>
        <div className="sheet-body">
          <h2 className="screen-title">Settings</h2>
          <label className="toggle">
            <input type="checkbox" checked={state.settings.countIn} onChange={(e) => updateSettings({ countIn: e.target.checked })} />
            <span>One bar of count-in before each start</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={state.settings.keepAwake} onChange={(e) => updateSettings({ keepAwake: e.target.checked })} />
            <span>Keep the screen on while playing</span>
          </label>
          <label className="slider">
            <span>Click volume</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={state.settings.volume}
              onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            />
          </label>
          <p className="screen-intro">On iPhone, the click plays even with the ring switch on silent. Turn the volume up with the side buttons.</p>
          <button className="primary" onClick={() => settingsRef.current?.close()}>
            Done
          </button>
        </div>
      </dialog>
    </div>
  );
}
