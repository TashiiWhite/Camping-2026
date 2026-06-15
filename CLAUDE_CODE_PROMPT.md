# Starter prompt for a new Claude Code (or Claude) session

Copy everything in the block below into a fresh session that has this repo open. It orients the model fast and front-loads the things most likely to cause mistakes.

---

```
I'm continuing work on "Camping 2026", a static no-build PWA for coordinating a group
car-camping trip. It's plain HTML + CSS + vanilla JS with a Supabase backend (Postgres +
Realtime + Auth), deployed GitHub → Netlify. No framework, no bundler, no build step.

Before doing anything, read these in order:
1. ARCHITECTURE.md  — how everything works (file map, state model, sync engine, auth/roles, i18n, admin).
2. HANDOFF.md       — current status, what's done, what still needs real-world verification.
3. README.md        — user-facing feature changelog.

Critical things I need you to respect (these caused a real production bug before):

1. NEVER hide or transform data by reassigning the global `state` object. A render-time
   state-swap once pushed empty data over good remote data and wiped the trip. Hide data
   with CSS classes or by passing empty arrays into render functions — never by mutating `state`.
2. Render functions must stay pure-display. None of them may call persist()/saveLocal().
3. The connectLive() reconciliation protects remote crew data — don't weaken it. If remote
   has crew (or local is empty), adopt remote; only seed remote from local when local has crew.
4. Keep the i18n key-coverage invariant: every data-i18n* key in index.html must exist in
   i18n.js. Run the comm -23 check in ARCHITECTURE.md §8 after any HTML/i18n change.
5. This is a no-build project. Don't introduce a bundler/framework unless I explicitly ask.

Workflow I want:
- After any change to app.js / i18n.js / content-fr.js, run `node --check` on each.
- Test with Playwright against the static page (see ARCHITECTURE.md §12). Assert zero pageerrors.
- When shipping JS changes, bump the cache in all three places: sw.js CACHE name,
  index.html app.js?v=NN, and (if i18n changed) i18n.js / content-fr.js ?v=N.
- Treat anything needing live Supabase (auth, presence, analytics live data) as
  "needs real-device verification" — say so rather than claiming it's confirmed.

Owner/admin is hardcoded as OWNER_EMAIL = tashiiwhite@gmail.com. TRIP_ID = camping-june-2026.

Here's what I want to work on next: <DESCRIBE YOUR NEW FEATURE / CHANGE HERE>
```

---

## Tips for working with it

- Give it **one feature at a time** and ask it to test before moving on. The big-batch rounds are where the data-loss bug slipped in.
- If it proposes hiding data for a role, remind it of rule #1 above.
- Ask it to show you the Playwright test output, not just "it works."
- Before it finalizes a build, ask it to re-run the i18n key-coverage check and `node --check`.
- Keep a JSON export of your trip data (admin → Data → Export) as a backup before deploying any change that touches sync.
