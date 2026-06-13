# 🏕️ Camping 2026 — Live-Synced Crew Field Plan

A progressive web app (PWA) for planning a 3-day car-camping trip. One shared trip — **camping-june-2026** — that every crew member views and edits live, from any device. Built on plain HTML/CSS/JS + Supabase (free tier). No build step, no dependencies to install.

## The trip

**June 19–21, 2026** · Departing from Dollard-des-Ormeaux (DDO), Montréal · 4–5 guys · 2 cars · car camping

Two candidate sites: **Camping de la Plage** (Rivière-Rouge, QC) and **Ivy Lea Campground** (Lansdowne, ON · 1000 Islands).

---

## What's inside

| Tab | What it does |
|---|---|
| **Basecamp** | Trip summary, live countdown, crew manager, quick links, trip-readiness bars, share button |
| **Campsites** | Side-by-side comparison of both sites · facility tags · per-person voting · Choose this site (locks route + maps) · weather & maps links |
| **Itinerary** | Hour-by-hour timeline (Jun 18–21) · route planner with custom stops · Google Maps route generator · reverse for drive home |
| **Gear** | Full gear list with claim/multi-assign/"All crew" · add custom items · remove → archive → restore · Clothing & attire + Personal kit categories |
| **Food** | Filterable food matrix · 9-meal plan · expert packing & storage playbook |
| **Shopping** | Food + Gear & essentials in 3 phases · Amazon / Canadian Tire / Decathlon links with best-store picks · preventative items (bug spray, first aid…) |
| **Costs** | Expense logger with categories · category spend bars · minimal settle-up transfers · copy for group chat |
| **Activities** | Things to do in the area (per chosen site) · fun things to bring · camp/tent games |
| **Survival** | Assign roles · situation fixes (rain, bugs, fire, wildlife…) · field tips · FAQ · emergency info |

## Themes (⚙ in the header — per device, never synced to crew)

| Theme | Visual |
|---|---|
| **Classic** (default, always available) | Original flat dark field-plan look — no animations |
| **Aurora** 🔒 | Glassmorphism · gradient wordmark · floating glow orbs |
| **Ember 🔥** 🔒 | Camping mode: firelight palette · embers rising off the screen |
| **Glacier** 🔒 | Icy blues · slow-falling snow |
| **Topo** 🔒 | Tactical expedition: animated wireframe terrain |
| **Nebula** 🔒 | Deep-space starfield with shooting stars |
| **Synthwave** 🔒 | Retro neon horizon · endless moving grid · scanlines |
| **Botanic ☀** 🔒 | The light theme — meadow paper, drifting pollen |
| **Abyss** 🔒 | Deep ocean — rising bubbles, light rays |
| **Sakura** 🔒 | Indigo night with falling cherry petals |
| **Carbon** 🔒 | Brutalist mono — film grain, acid-yellow accent |
| **Dune** 🔒 | Desert heat — wind-blown sand, low sun |

🔒 = unlocks with Google sign-in. Signed-out visitors run in **local mode** (device-only data, Classic theme). Signing in grants: live shared data + realtime sync, the online-presence counter, and all 12 themes. Every animated theme has scroll-reveal motion and a Three.js scene on desktop with a themed 2D fallback on mobile.

Desktop (≥1024px, fine pointer) gets a full Three.js WebGL scene per theme with mouse parallax. Mobile gets a lightweight themed 2D canvas fallback and never downloads Three.js.

---

## 1. Deploy the site (GitHub → Netlify)

```bash
git init
git add .
git commit -m "Camping 2026 initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/camping-2026.git
git push -u origin main
```

In [Netlify](https://app.netlify.com): **Add new site → Import an existing project → your repo** → build command *blank*, publish directory `.` → **Deploy site**.

Or fastest: drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — done in 30 seconds.

> ⚠️ The PWA install prompt, offline mode, and Google sign-in only work over HTTPS. Always test from your Netlify URL, not from a local file.

---

## 2. Supabase — live sync for the whole crew

`config.js` is already wired to your Supabase project. The only remaining step is running the schema.

1. Go to [supabase.com](https://supabase.com) → your **Camping-2026** project dashboard.
2. Open **SQL Editor → New query**, paste the entire contents of **`supabase-schema.sql`**, click **Run**.
   - This creates the `trips` table, enables Row Level Security with open read/write policies, enables Realtime, and seeds the `camping-june-2026` row.
3. Deploy to Netlify and open your live URL → the pill in the header should turn **green "Live"**.

> **Key hygiene:** `config.js` contains the anon (publishable) key — this is safe to commit. Never put the database password or service_role secret in this repo or in any frontend file.

---

## 3. Google sign-in setup

> You must complete the Supabase URL configuration **and** deploy to Netlify before testing sign-in.

**Step 1 — Set the Supabase Site URL**
1. Supabase dashboard → **Authentication → URL Configuration**
2. **Site URL**: `https://your-site.netlify.app` (use your actual Netlify URL)
3. **Redirect URLs**: add `https://your-site.netlify.app/**`
4. Click **Save**

**Step 2 — Verify the Google provider**
1. Supabase → **Authentication → Providers → Google**
2. Enable toggle should be ON ✓
3. **Client ID**: `640768232636-t7r734vuav6v9g9o90bcrqtg7ia3q8nm.apps.googleusercontent.com`
4. **Client Secret**: your `GOCSPX-...` value (do not commit this anywhere)
5. Click **Save**

**Step 3 — Fix the Google Cloud Console OAuth client**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → your project → **APIs & Services → Credentials**
2. Click the **"camping app"** OAuth 2.0 client
3. **Authorized JavaScript origins**: `https://your-site.netlify.app`
4. **Authorized redirect URIs**: `https://onynooocmvmvozimbuzo.supabase.co/auth/v1/callback`
5. Click **Save** — wait 5–10 minutes for changes to propagate, then test

---

## 4. Apple Sign-in (optional — requires $99/yr Apple Developer account)

Apple Sign-in for a web app requires:

| Item | Where |
|---|---|
| **Apple Developer account** | [developer.apple.com](https://developer.apple.com) — $99 USD/year |
| **App ID** with Sign in with Apple enabled | Certificates → Identifiers → App IDs |
| **Services ID** (this becomes the Client ID) | Certificates → Identifiers → Services IDs — link to your App ID, add your Netlify domain + the Supabase callback URL |
| **Key ID + .p8 private key file** | Certificates → Keys — create key, enable Sign in with Apple, download once |

Once you have those four things:
1. Supabase → **Authentication → Providers → Apple** → toggle on
2. Fill in: Services ID, Team ID (top-right corner of developer.apple.com), Key ID, and paste the contents of the `.p8` file
3. Save

> Note: Apple only returns the user's name and email on the **first** sign-in ever. On every subsequent login those fields are null — the app captures what it can on first sign-in.

---

## 5. Add to your phone (PWA install)

- **iPhone (Safari)**: open your Netlify URL → tap the Share button → **Add to Home Screen**. The Camping 2026 tent icon + standalone app mode activate automatically.
- **Android (Chrome)**: open the URL → tap ⋮ menu → **Add to Home screen** (or accept the install prompt).

Offline: the service worker caches the entire app shell. You can open it and read everything without a signal; changes made offline queue and sync when you reconnect. **Export full site as PDF** (Basecamp tab) also gives you a fully static printed copy.

---

## 6. Access model

- **Signed out** → Local mode: all features work, but data stays on that device. Theme locked to Classic. The status pill explains this on hover.
- **Signed in with Google** → Live mode: shared realtime trip data, "N online" presence counter, all themes unlocked.
- To enforce this server-side too (recommended), run the commented "lock writes" block at the bottom of `supabase-schema.sql` — otherwise gating is client-side only.

## 6b. Data & sharing

All live data (crew, gear claims, votes, costs, stops, roles, checklists) syncs in real time via Supabase Realtime. Every device that opens the site shares the same trip row automatically.

Theme, motion preference, and the help-banner dismiss are saved **per device only** and never synced — your theme choice doesn't change what your crewmates see.

To share state when Supabase isn't connected: **Export crew data** → send the `.json` file → crewmates **Import crew data** (both on Basecamp tab).

---

---

## Version history

### v10 — current
- **Stay-signed-in bridge for the home-screen app.** iOS keeps Safari and installed PWAs in separate storage, so a Safari sign-in doesn't carry into the home-screen app on its own. New flow: sign in normally in Safari, tap **📲 Sync to app**, then in the home-screen app open **Sign in → paste the sync link** (or scan the QR). The app restores the session and stays signed in with live sync. The sync link carries the session tokens, so it's private — for your own device only.
- The sign-in modal now has three paths: Continue with Google, email magic-link, and "paste sync link from Safari".


### v9 — current
- **Fixed: couldn't type the email in the home-screen app.** The email sign-in used a JavaScript `prompt()` dialog, which iOS standalone PWAs block/ignore. Replaced it with a proper in-page **sign-in modal** containing a real `<input>` field that accepts typing inside the installed app. Both Google and the email magic-link now live in one clean modal, with an inline warning that explains the iOS Google-typing limitation and points to the email link as the reliable path.


### v8 — current
- **Signed-in users get a monthly-rotating default theme.** On sign-in the app switches to that month's default, alternating every calendar month forever: **June 2026 → Botanic, July → Aurora, Aug → Botanic, …**. A manual theme pick still wins for the rest of that month, and the rotation re-applies when a new month begins.


### v7 — current
- **Reworked Google sign-in for the iOS home-screen app.** Switched Supabase auth from the PKCE flow to the **implicit flow** and added explicit URL-hash session recovery (`setSession`) on return — a standalone iOS PWA can read the token from the URL hash even though it can't share PKCE storage with the separate Safari OAuth context.
- **Added an email magic-link fallback** (✉ Email link), shown automatically when the app is launched from the home screen. This always works inside the PWA sandbox, bypassing the OAuth-popup limitation entirely.
- Sign-in errors now surface as toasts instead of failing silently.


### v6

- **Fixed: Google sign-in from the iOS home-screen app.** Standalone PWAs on iOS couldn't type into the embedded Google sheet. Sign-in now does a full top-level redirect in the PWA window (a real, typeable Google page) and returns the session automatically. Also switched Supabase auth to the PKCE flow with `detectSessionInUrl`.
- Added this version history to the README.

### v5
- **Google sign-in now gates live access.** Signed-out visitors run in local mode (device-only data) with the **Classic theme forced**; all other themes show a 🔒 lock. Signing in unlocks live sync + every theme; signing out reverts automatically.
- **Online presence counter** — a pill showing "N online" via Supabase Presence, visible only in live mode.
- **Status tooltip** — hover the Live/Local/Offline pill for a plain-language explanation.
- **7 new flagship themes** (12 total), each with a unique identity, its own Three.js desktop scene + themed 2D mobile fallback: **Nebula** (starfield + shooting stars), **Synthwave** (neon grid horizon + scanlines), **Botanic ☀** (the light theme — meadow paper + pollen), **Abyss** (ocean bubbles + light rays), **Sakura** (falling petals), **Carbon** (brutalist mono + film grain + torus knot), **Dune** (wind-blown sand + low sun).
- **Motion on scroll** — cards reveal/lift as you scroll; Three.js cameras respond to scroll depth.
- **New settings:** Performance mode (disables glass blur) and Compact mode (tighter spacing).
- Service-worker cache bumped (cache-first → kept network-first); auto-reload on new deploys.

### v4
- Renamed the whole app **WildWeekend → Camping 2026** (title, wordmark, PWA name, footer, share text, manifest).
- **Fixed: stale deploys.** Rewrote the service worker to **network-first** with a versioned cache name + a cache-busted script tag + auto-reload, so new deploys always appear (the old cache-first SW was serving outdated files).
- README rewritten for the final feature set.

### v3 (Aurora release)
- **Default Aurora theme** — glassmorphism cards, gradient wordmark, animated aurora blobs, fireflies canvas, GSAP entrance animations.
- **Settings panel (⚙)** with theme switching (Aurora / Ember / Glacier / Topo / Classic) + motion toggle, all saved **per device** (never synced to crew).
- **Adaptive ambience** — Three.js particle field on desktop, lightweight 2D canvas on mobile (mobile never downloads Three.js); graceful fallback if WebGL fails.
- 3 themed scenes added: **Ember** (camping — rising embers), **Glacier** (snowfall), **Topo** (wireframe terrain).
- **Trip-readiness meters** (crew / site / gear / shopping %) and a **Share** button (native share sheet + clipboard fallback).
- Particles tuned smaller and slower; soft-sprite glow replaces hard squares.
- **Weather links fixed** — switched from a broken Environment Canada search URL to working Weather Network 14-day pages.
- **Clothing & attire** + **Personal kit** gear categories added (16 items) with a sync-safe migration that merges into existing live data without disturbing claims/votes.
- "Copy for group chat" button on the settle-up; Enter-key support on stop inputs.

### v2 (Live sync release)
- **Supabase live sync** — one shared trip (`camping-june-2026`), realtime across all devices via the `trips` table + Supabase Realtime.
- **Google sign-in** (optional at this stage) via Supabase Auth.
- **PWA** — home-screen install with app icon, offline mode via service worker, web manifest.
- **Route planner** — add stops, open the full multi-stop route in Google Maps, reverse it for the drive home.
- **Choose-this-site** locks the campsite and powers maps/weather/route.
- **Gear upgrades** — add/remove items, restorable archive, multi-assign, "All crew" option.
- **Shopping** split into Food + Gear & essentials with Amazon / Canadian Tire / Decathlon links and best-store picks, including preventative items.
- **Upgraded costs** — categories, spend-by-category bars, minimal "who-pays-who" transfers.
- **Activities tab**, **Situations & fixes**, and an **FAQ**.
- Dismissible **how-to guide** banner + "?" button.
- **Export full site as PDF.**

### v1 (initial)
- Single-file static site: Basecamp, Campsites (with voting), Itinerary, Gear (claim system), Food (matrix + 9-meal plan + prep), Shopping (3 phases), Costs (Splitwise-style splitter), Survival (roles, tips).
- `localStorage` persistence with JSON export/import for sharing.
- Deployable to GitHub + Netlify, zero build step.

## Files

```
.
├── index.html              # full UI — all tabs, themes, modals, print CSS
├── app.js                  # logic, trip data, Supabase sync, auth, Three.js themes
├── config.js               # Supabase URL + anon key (already wired, safe to commit)
├── supabase-schema.sql     # run once in Supabase SQL Editor
├── sw.js                   # offline-first service worker
├── manifest.webmanifest    # PWA manifest (name, icons, theme colour)
├── icons/                  # app icons: 192×192, 512×512, apple-touch, favicon
├── netlify.toml            # zero-config Netlify deploy (blank build, root publish)
├── .gitignore
└── README.md
```

## Future ideas (not built, parked by design)

- Multiple trips + join-by-code (schema already supports it — just more rows in `trips`)
- Presence indicators ("Sam is viewing Gear tab right now") via Supabase Presence
- Post-trip photo wall using Supabase Storage
- Push notifications for the fire-ban / weather check the night before
- Lock writes to signed-in users only (one SQL change at the bottom of `supabase-schema.sql`)

## License

MIT — built for the crew. 🔥
