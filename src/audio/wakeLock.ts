/** Keeps the screen on while practicing, where the browser allows it. */
type Sentinel = { release: () => Promise<void> };

let sentinel: Sentinel | null = null;
let wanted = false;

async function acquire() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    if (!nav.wakeLock || document.visibilityState !== "visible") return;
    sentinel = await nav.wakeLock.request("screen");
  } catch {
    sentinel = null;
  }
}

export function keepAwake(on: boolean) {
  wanted = on;
  if (on) void acquire();
  else {
    void sentinel?.release().catch(() => undefined);
    sentinel = null;
  }
}

if (typeof document !== "undefined") {
  // The lock is dropped whenever the page is hidden; take it back when the player returns.
  document.addEventListener("visibilitychange", () => {
    if (wanted && document.visibilityState === "visible") void acquire();
  });
}
