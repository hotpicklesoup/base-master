# Woodshed

Bass practice on your phone: a daily routine, a metronome built for time-feel training, and tempos that climb as your runs come out clean.

- **Today** builds a 15–60 minute session: warm-up, quarter-note pump, staccato sixteenths toward 100 bpm, a rotating rhythm drill (dotted eighths, 3-3-2, dotted-eighth pulse), a rotating dexterity drill, and a song.
- **The metronome** does clicks on every beat, 2 and 4, or beat 1; eighth or sixteenth subdivisions; silent bars to test your internal clock; a count-in; a warm-up ramp; and an optional guide tone that plays the rhythm.
- **After each run** tap Clean, Almost or Too hard. The app sets next time's tempo.
- **Progress** charts your fastest clean staccato sixteenths against the 100 bpm goal.

Progress is saved in the browser on your device. Use Progress > Download a backup to keep a copy.

## Setup

1. **Vercel:** import this repo at vercel.com/new. It detects Vite; no settings to change. Every push to `main` deploys, and every pull request gets a preview link.
2. **Claude GitHub app:** install it from github.com/apps/claude on this repo.
3. **Secret:** in the repo, Settings > Secrets and variables > Actions > New repository secret. Name it `CLAUDE_CODE_OAUTH_TOKEN`; the value comes from running `claude setup-token` on a computer with Claude Code. Runs count toward your Pro plan's usage limits, shared with your Claude chats. The token lasts a year. To pay per use instead, see the comment in `.github/workflows/claude.yml`.

On iPhone, GitHub hides repo Settings in the mobile layout. In Safari tap **aA > Request Desktop Website**.

## Asking Claude for changes

Open an issue with **@claude** in the title or body (the "Change for Claude" template does this for you). Claude reads `CLAUDE.md`, makes the change on a branch, runs the tests, and opens a pull request. Vercel posts a preview link on the PR: try it on your phone, then merge to ship it. To ask for tweaks, comment on the PR with @claude.

`ROADMAP.md` has ready-to-post ideas.

## Developing locally

```
npm ci
npm run dev        # http://localhost:5173
npm test
npm run build
```
