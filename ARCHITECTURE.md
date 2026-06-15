# Camping 2026 — Architecture & Developer Reference

> Single-file reference for picking this project back up later (e.g. in Claude Code).
> Read this first, then `HANDOFF.md` for "what's done / what's next", then `README.md` for the user-facing feature log.

---

## 1. What this is

A **static, no-build progressive web app** for coordinating a group car-camping trip. No framework, no bundler, no `npm install` to run it — it's plain HTML + CSS + vanilla JS that you can open directly or host on any static host. State syncs live across devices through **Supabase** (Postgres + Realtime + Auth). It works fully offline via a service worker and falls back to per-device `localStorage` when signed out or disconnected.

- **Live site:** https://campingjune2026.netlify.app
- **Hosting:** GitHub repo → Netlify (auto-deploy on push)
- **Backend:** Supabase project `onynooocmvmvozimbuzo`
- **Trip:** Fri June 19 → Sun June 21, 2026, 4–5 people, 2 cars, departing DDO (Dollard-des-Ormeaux), Montréal
- **Two candidate campsites:** Camping de la Plage (Rivière-Rouge, QC) and Ivy Lea (Lansdowne, ON)
- **Owner/admin:** tashiiwhite@gmail.com (hardcoded as `OWNER_EMAIL`)

---

## 2. File map

| File | Lines | Purpose |
|---|---|---|
| `index.html` | ~1384 | All markup + all CSS (one big `<style>` block) + all 9 tab panels + every modal. |
| `app.js` | ~2960 | All logic: state, Supabase sync, auth/roles, rendering, every feature. Also holds the trip-content data arrays. |
| `i18n.js` | ~293 | i18n engine (`window.i18n`, `window.t`) + EN and FR dictionaries. |
| `content-fr.js` | ~114 | French translations of the trip-content data arrays (`window.CONTENT_FR`). |
| `config.js` | 10 | `window.WW_CONFIG` — Supabase URL, anon key (public by design), TRIP_ID. |
| `sw.js` | 54 | Service worker. Cache name `camping2026-v26` (bump to force client update). |
| `manifest.webmanifest` | — | PWA manifest (icons, name, theme color). |
| `netlify.toml` | — | Netlify config. |
| `icons/`, `maps/`, `ivy.jpg` | — | App icons + campsite map images. |
| `supabase-schema.sql` | — | Base `trips` table + RLS. |
| `supabase-v8-admin.sql` | — | Admin/auth hardening (write-requires-auth, etc.). |
| `supabase-v8-analytics.sql` | — | `site_visitors` + `site_daily` analytics tables for the dashboard. |
| `whats-new.html` | — | Standalone changelog page; host it and link from the admin banner. |

**Script load order in `index.html` (matters):**
`config.js` → `i18n.js?v=4` → `content-fr.js?v=4` → `app.js?v=26`

---

## 3. How to run / deploy

**Local dev:** open `index.html` in a browser. Auth/live-sync need to be served over http(s) (the service worker + Supabase redirect won't work from `file://`), so for full testing use any static server:
```
cd <repo> && python3 -m http.server 8000   # then visit http://localhost:8000
```

**Deploy:** push to the GitHub repo; Netlify auto-builds (there is no build step — it just serves the files). To force every device to pick up new JS, bump **all three** of these together:
1. `sw.js`  → `const CACHE = 'camping2026-vNN'`
2. `index.html` → `app.js?v=NN`
3. (if i18n/content changed) `index.html` → `i18n.js?v=N` and `content-fr.js?v=N`

---

## 4. Configuration & secrets

`config.js` holds `window.WW_CONFIG`:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` — **public by design.** Security comes from Supabase Row-Level Security policies, not from hiding the anon key.
- `TRIP_ID` — `"camping-june-2026"`. All data is namespaced under this; `LS_KEY = 'wildweekend_' + TRIP_ID`.
- **Never** put the Google OAuth client secret or the DB password in any client file.

`OWNER_EMAIL` is hardcoded in `app.js` (line ~124) as `tashiiwhite@gmail.com`. This is the only admin. To change owner, edit that constant.

---

## 5. State model

A single object `state`, persisted to `localStorage` and synced to Supabase `trips.data` (one row, `id = TRIP_ID`). Shape (`defaultState()`):

```js
{
  rev:0,            // monotonic revision for last-write-wins conflict handling
  by:'',            // CLIENT_ID of last writer (to ignore our own echoes)
  crew:[],          // ["Tashii","Nick",...] — names drive everything
  crewMeta:{},      // { name: { email, by, at } } — email link is PRIVATE, never shown to others
  gear:null,        // null = use DEFAULT_GEAR; otherwise overridden gear list
  gearArchive:[],   // removed gear items (restorable)
  gearClaims:{},    // { gearId: [names | 'ALL'] }
  gearPacked:{},    // { gearId: bool | { name:bool } }
  personalItems:{}, // { name: [{id,name,qty,packed}] }
  expenses:[],      // [{id,desc,amt,who,cat,split,shareWith}]  split:'all'|'payer'|'custom' (absent ⇒ 'all'); shareWith only when custom
  votes:{},         // { name: 'plage' | 'ivy' }
  roles:{},         // { roleLabel: name }
  checks:{},        // { 'shop-<cat>-<idx>': bool } shopping checkboxes
  stops:[],         // [{name,addr}] route planner
  chosenSite:'',    // '' | 'plage' | 'ivy'
  customFood:[],    // user-added food matrix rows
  timelineExtra:[], // [{id,when,title,desc,sort}] custom timeline points
  timelineEdits:{}, // { defaultPointId: {when?,title?,body?,sort?,hidden?} } overrides for built-in points
  shopBought:{},    // { 'shop-<cat>-<idx>': [names] } who bought what
  prepEdits:{},     // overrides for the prep playbook
  mealEdits:{}       // { mealIndex: { items:[...] } } inline meal-plan edits
}
```

**Trip-content data** (the reference info, not user state) lives as `const` arrays near the top of `app.js`: `FOOD, MEALS, PREP, SHOP, AREA, BRING, GAMES, SITUATIONS, FAQ, TIPS, ROLES, SITES, DEFAULT_GEAR, TIMELINE_DEFAULT`. French versions are index-aligned arrays in `content-fr.js` (`window.CONTENT_FR`), merged at render time by `contentArr(name, enArr)`.

---

## 6. Sync engine (the part to be careful with)

- `loadLocal()` reads `state` from localStorage at boot.
- `persist()` / `saveLocal()` write state. `persist()` bumps `rev`, stamps `by = CLIENT_ID`, saves locally, and upserts to Supabase when live.
- `connectLive()` loads the remote `trips` row, subscribes to Postgres changes + Presence, and reconciles.
- **Conflict rule:** last-write-wins by `rev`. The realtime handler ignores echoes where `d.by === CLIENT_ID && d.rev <= lastRev`.

### ⚠️ Hard-won lesson (read before touching sync)
An earlier version added a **render-time `state` swap** (temporarily replacing `state` with an empty object to "hide" data for some roles, then restoring it). This caused a **production data-loss incident**: combined with the rev-guard in `connectLive`, empty local state could be pushed over good remote data and wipe the crew's trip. **It was removed.**

Rules going forward:
1. **Never mutate the global `state` for display purposes.** Hide data with CSS or by passing an empty array into a render function — never by reassigning `state`.
2. `connectLive` now protects remote data: it adopts remote when remote has crew (or local is empty), and only ever seeds remote from local when **local actually has crew**. Don't weaken this.
3. Render functions must be **pure display** — none of them call `persist()`/`saveLocal()`. Keep it that way.

---

## 7. Auth & roles

Sign-in via Supabase Auth (Google OAuth + email magic-link). Role is computed, not stored as a privilege:

- `realLevel()` → `none` (signed out) | `visitor` (signed in, email not linked to a crew member) | `camper` (linked) | `leader` (owner-granted) | `admin` (owner).
- `accessLevel()` → same, but honors **owner impersonation** via the `viewAs` global (`null | 'none' | 'visitor' | 'camper' | 'leader'`). This is how the admin "preview as role" works.
- Capability helpers: `isOwnerReal()`, `isOwner()`, `isVisitor()`, `isCamper()`, `canEdit()`, `canManage()`, `canReset()`, `requireEdit()`, `requireManage()`, `canEditPacking(name)`.
- `applyGateClasses()` toggles `<html>` classes: `signed-out`, `signed-in`, `lvl-visitor`, `can-edit`, `can-manage`, plus `data-access="<level>"`. **CSS gates UI off these classes** (e.g. `.manage-only`, `.admin-only`, `html.lvl-visitor .visitor-blur-wrap`).
- Email linking: `crewMeta[name] = {email, by, at}`. The email is **private** — never rendered to other users; only the owner sees emails (Users tab + Reports).

### Role visibility rules (current, intended behavior)
- **Signed-out:** locked tabs (Gear/Food/Shopping/Costs) are hidden and clicks bounce to Basecamp; crew data is empty (`state = defaultState()` in the signed-out branch of `applyAccess`) so the site "looks reset" until sign-in.
- **Visitor:** sees crew data, can't edit; the **Costs page is blurred** (`.visitor-blur-wrap` + `html.lvl-visitor` CSS) with a "link your name to see numbers" note.
- **Camper:** full edit; can edit only their own packing list.
- **Leader:** camper + reset/cost-edit/timeline; no admin panel. Counts as a camper in live tallies but keeps the Leader label.
- **Admin (owner):** everything + the hidden 🛠 Admin panel.

---

## 8. i18n

- `window.i18n` = `{ LANGS, DICT, t, getLang, setLang, applyI18n }`. `window.t(key, fallback)` is the global shorthand.
- Languages: `en` ("English (CA)") and `fr` ("Français (CA)"). Per-device choice in `localStorage.ww_lang`. Architected for more languages (add a dict block + a content file; `dir` attr switches for future RTL).
- Three translation patterns:
  1. **Static DOM:** `data-i18n` / `data-i18n-html` / `data-i18n-ph` (placeholder) / `data-i18n-title` attributes, scanned by `applyI18n()`.
  2. **JS strings:** `t('key','fallback')`.
  3. **Trip-content arrays:** `contentArr(name, enArr)` merges EN with index-aligned FR overrides when lang === 'fr'.
- `catLabel(cat)` translates category labels for display while stored values stay English.
- On language change, `onLangChange` re-runs `countdown()` + `renderAll()` + `renderLangPills()`.
- **Invariant to keep:** every `data-i18n*` key used in HTML must exist in the dictionary. Quick check:
  ```bash
  grep -oE 'data-i18n(-html|-ph|-title)?="[^"]*"' index.html | sed -E 's/.*="([^"]*)"/\1/' | sort -u > /tmp/used.txt
  grep -oE "'[a-zA-Z]+\.[a-zA-Z0-9]+':" i18n.js | sed -E "s/'([^']*)':/\1/" | sort -u > /tmp/dict.txt
  comm -23 /tmp/used.txt /tmp/dict.txt   # should print nothing
  ```

---

## 9. The 9 tabs

Basecamp (`dash`), Campsites (`sites`), Itinerary (`plan`), Gear (`gear`), Food (`food`), Shopping (`shop`), Costs (`money`), Activities (`fun`), Survival (`info`). Each is a `<section class="panel" id="...">`; locked ones also have `class="gated"`.

---

## 10. Admin panel (owner-only)

Opened via `openAdmin()` (guarded by `isOwnerReal()`, and it exits any active `viewAs` preview first). Tabs via `adminTab(name)`: `presence | banner | users | reports | data`.

- **Reports = data-center dashboard** (`renderAdminStats()`): live role counters from Presence (`liveRoleCounts()`), audience stats (visits month/all-time, unique people by email vs anon, total/avg time via `fmtDuration()`), a visitor log table, and trip charts. Charts are dependency-free inline SVG: `svgBarChart`, `svgLineChart`, `svgDonut`. Analytics come from `loadAnalytics()` + `subscribeAnalytics()`.
- **Analytics tracking:** `recordVisit()` + `startSessionTimer()` + `flushSeconds()` write to `site_visitors` / `site_daily` for both signed-in and anonymous users.
- **Admin guide/FAQ:** `openAdminGuide()` (#admin-guide-modal) — explains privileges, roles, sign-in/link logging.
- **Simulations** (Data tab): `setViewAs(level)` previews; `simulateLinkPrompt()`, `simulateBanner()`, `simulateBuyerPicker()` demo the popups without touching real state.
- **Multi-buyer picker** (admin-only, Shopping): `openBuyerPicker(key)` / `toggleBuyerPick(name)` (#buyer-picker-modal).
- **Announcement banner:** stored in `adminConfig.banner`, rendered by `renderDepartureBanner()`.

> ⚠️ The analytics **live data** (visit/time/unique counts, live role counters) has only ever been tested with simulated data in a sandbox — it requires the deployed Supabase + the analytics SQL run + the tables added to the Realtime publication. Until then the dashboard shows a "run the analytics SQL" note and the rest still works. **Verify this on a real device after deploy.**

---

## 11. Supabase setup

1. Run `supabase-schema.sql` (base `trips` table + RLS).
2. Run `supabase-v8-admin.sql` (write-requires-auth hardening).
3. Run `supabase-v8-analytics.sql` (creates `site_visitors` + `site_daily`).
4. Database → Replication: add `trips`, `site_visitors`, `site_daily` to the publication so realtime/live counters work.
5. Auth: enable Google provider + email magic-link; set the redirect URL to the Netlify site.

---

## 12. Testing approach

There's no test framework; testing was done with **Playwright** driving the static page (`file://` or local server). Pattern:
- Launch: `chromium.launch(args=['--use-gl=angle'])`.
- To simulate a signed-in role, stub `window.sb` and set `user`, `state.crew`, `state.crewMeta`, then call `applyGateClasses(); renderAuth(); renderAll()`.
- i18n: `window.i18n.setLang('fr'|'en')`.
- Overflow check (mobile): `document.documentElement.scrollWidth > clientWidth + 2` at viewport 390×844.
- Always assert **zero** `pageerror`s.
- Real Supabase features (auth, presence, live analytics) can't be verified in the sandbox — they need a real deployment.

---

## 13. Known limitations / good next steps

- **Analytics live data** needs real-world verification (see §10).
- **French** is machine-translated Québécois — worth a native pass.
- **Single trip only.** `TRIP_ID` is fixed; multi-trip would need a trip picker + namespacing.
- **Owner is hardcoded.** Multi-admin would need a roles table instead of `OWNER_EMAIL`.
- **No automated tests** in the repo — consider adding a small Playwright suite if expanding.
- **`app.js` is large (~2900 lines).** If expanding significantly, consider splitting into modules (sync, auth, render, admin) — but keep the no-build simplicity unless you adopt a bundler deliberately.
- Possible features discussed: richer analytics, more languages, packing reminders/notifications, weather embedding, photo sharing.
