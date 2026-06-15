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

- **Signed out** → clean, read-only site: no crew/trip data shows, crew features are greyed with sign-in notes, and the Food/Gear/Shopping/Costs tabs are viewable but locked. Theme is Classic; display is fast/lightweight (animations off, Lite + Compact on).
- **Signed in (Google or email link)** → full access: the live shared trip data appears, everything is editable, all themes unlock, and display defaults to full (animations on, Lite + Compact off). Stays working offline once signed in.
- **Roles:** `user` (full edit), `leader` (full edit + can reset the trip; granted by the owner in Admin → Users), `admin`/owner (everything + the admin panel).
- **Writes are locked to signed-in users at the database level** (as of v8). Run `supabase-v8-admin.sql` to apply.

## 6a. Admin setup (owner only)

The admin panel is gated to the owner email (`tashiiwhite@gmail.com`) in two places: the app checks it to show the 🛠 Admin button, and the database `admin_config` policy only lets that email write app-wide settings (the departure banner + sign-up toggle).

To enable everything:

1. **Run the SQL.** Supabase → SQL Editor → paste `supabase-v8-admin.sql` → Run. This locks `trips` writes to authenticated users, creates the `admin_config` table with owner-only write access, adds it to Realtime, and seeds it.
2. **(Optional) Hard-lock new sign-ups.** Supabase → Authentication → Sign In / Providers → turn off "Allow new users to sign up". The in-app toggle (Admin → Users) controls this softly; this makes it absolute.
3. **Confirm auth URLs.** Supabase → Authentication → URL Configuration → Site URL `https://campingjune2026.netlify.app`, Redirect URLs include `https://campingjune2026.netlify.app/**`.
4. **No Netlify changes needed** — it's still a static deploy.

If you ever change the owner email, update it in `supabase-v8-admin.sql` (the two policy lines) **and** in `app.js` (`OWNER_EMAIL`), then re-run the SQL.

## 6b. Data & sharing

All live data (crew, gear claims, votes, costs, stops, roles, checklists) syncs in real time via Supabase Realtime. Every device that opens the site shares the same trip row automatically.

Theme, motion preference, and the help-banner dismiss are saved **per device only** and never synced — your theme choice doesn't change what your crewmates see.

To share state when Supabase isn't connected: **Export crew data** → send the `.json` file → crewmates **Import crew data** (both on Basecamp tab).

---

## Version history

### v8.2 — June 14, 2026 (current)

This release adds a full bilingual interface, a rebuilt admin data-center dashboard with live Supabase analytics, and a round of UX refinements.

**Bilingual — English (CA) + French (CA)**
- **Per-device language toggle** in ⚙ Settings → Language (minimalist flag-pill selector). The choice is saved locally and never synced to the crew.
- **The entire site translates**, including all trip-content prose: the food matrix, 9-meal plan, expert prep playbook, shopping lists, activities, situations & fixes, FAQ, tips, and roles. Québécois register ("la gang", "papillotes", "guimauves").
- **Architecture:** a small `i18n.js` engine (DOM-attribute translation + `t()` for dynamic strings) plus a `content-fr.js` data file. Adding another language later = one dictionary block + one content file; the engine is already RTL-ready via the `dir` attribute.
- Stable English keys are used under the hood for roles and cost categories, so assignments and groupings survive language switches.

**Admin data-center dashboard (Reports tab — owner only)**
- Rebuilt as a dense, half-scale "data center": live role counters, audience analytics, a visitor log, and trip charts, with animated count-up numbers.
- **Live now** (from Supabase Presence): online total, signed-out, visitors, campers, leaders, admins. *A leader is counted in the camper tally for live data but keeps its Leader label.*
- **Audience** (from new analytics tables): visits this month & all-time, unique people (emails vs anonymous), total and average time on site, crew size.
- **Visitor log:** every email (and anonymous visitor) that has opened the live site, with role, visit count, time-on-site, and last-seen.
- **Charts:** peak-online-per-day and visits-per-day line charts, plus gear/votes/shopping donuts and packing/spend/items bar charts.
- **Analytics setup (one-time):** run **`supabase-v8-analytics.sql`** to create the `site_visitors` + `site_daily` tables. The client records visits and session time for signed-in emails and anonymous visitors; the dashboard reads them live (add both tables to Realtime for live counters). Until the SQL runs, the panel shows a small "run the analytics SQL" note and everything else still works.

**Admin guide (owner only)**
- A new **📖 Admin guide (FAQ)** button in the Data tab opens a private reference covering: what the admin can do, how the hidden admin panel works, how the four roles behave, and exactly how sign-in + email-linking works (including that the online counter tallies everyone on the site). Invisible to all non-owners.

**Access change**
- **Signed-out users can no longer open the locked pages** (Gear, Food, Shopping, Costs). Previously these were viewable read-only; now their content is hidden and the tabs bounce to Basecamp with a sign-in hint. The unlocked pages (Basecamp, Campsites, Itinerary, Activities, Survival) remain fully browsable signed-out.

**UX refinements**
- **Inline meal editing** — tap any meal-plan item to edit it directly on the card (Enter or click-away saves, empty removes); each card has a "+ add item". Replaces the old text-prompt editor.
- **Timeline** — the six default points are now data-driven (editable/hideable), and **new timeline points auto-sort into chronological place** by parsing their "when" (handles EN + FR day/time formats).
- **Gear page** — the "I'm:" and "Viewing:" selectors now sit **side by side** to save vertical space.
- **Preview bar** (admin "view as") moved to the **very top** of the page and made translucent with a blur.
- **Dropdown contrast fixed** across all themes — option lists are now always readable (previously some themes rendered option text nearly invisible).
- The how-to guide now leads with **"Sign in to go live" as step 1**.

### v8 — June 14, 2026

The big release: a full signed-in/signed-out access model with roles, a private admin control panel, **bilingual (English CA / French CA) support**, an **admin data-center dashboard with live Supabase analytics**, **per-user language**, inline meal editing, auto-sorting timeline, and a privacy pass on locked pages.

**Languages — English (CA) & French (CA)**
- Switch the entire site between **English (CA)** and **Français (CA)** in ⚙ Settings → Language (minimalist flag-pill selector).
- Per-device choice (localStorage `ww_lang`), applied instantly; persists across reloads.
- **Everything** is translated — all UI plus the full trip content (food matrix, 9-meal plan, prep playbook, shopping lists, situations, FAQ, tips, roles). French is Québécois register and crew-eyeball-friendly.
- Engine (`i18n.js`) + French content (`content-fr.js`) are architected so adding a 3rd language later = one dictionary block + one content file. `dir` attribute switches automatically (RTL-ready).

**Access model & roles**
- **Signed-out users can no longer open locked pages.** Gear, Food, Shopping & Costs are hidden until sign-in; clicking those tabs bounces to Basecamp with a hint. Basecamp, Campsites, Itinerary, Activities & Survival remain public.
- **Roles:** `visitor` (signed in, not linked — view-only), `camper` (linked to a crew member — full edit), `leader` (owner-granted — full access plus reset/cost-edit/timeline, no admin panel), and `admin`/owner. Role shows as a badge in the header. **For live counts a leader is also counted as a camper, but keeps the Leader label.**
- **Forced first-sign-in identity prompt** — a centered modal (no click-away) makes every new email choose: *existing crew member* / *add me as new crew* / *just browsing*. Linking privately stamps the email to that crew name → camper; browsing → visitor. The email is never shown to other crew.
- **Edit / rename / remove your own crew name**; leaders & admins can manage anyone's.

**Crew & packing**
- **"I'm" + "Viewing" selectors sit side by side** on the Gear page to save space.
- **Personal packing list** — everything assigned to you, "All crew" items, and your own custom items with optional **quantity**.
- **View other crew members' lists read-only**; campers edit only their own, leaders/admins edit anyone's, visitors none.

**Everyday features**
- **Add food** (with store + cook category) and **edit the 9-meal plan inline** — tap any meal item to edit it directly on the card, Enter/blur saves, blank removes, "+ add item" per card.
- **Add timeline points that auto-sort by time** — new stops slot chronologically into the itinerary (default points are editable/hideable too).
- **Shopping "I bought this"** — multiple crew confirm a purchase; buyer avatars show globally.
- **Editable cost items** (leaders/admins); collapsible settings; back-to-top button; **Simplify** mode.
- **Readable dropdowns across all themes** (fixed low-contrast option lists).

**Display settings**
- Gated like themes. Signed-out defaults: animations off, Lite on, Compact on. Signed-in: animations on, Lite off, Compact off. "Lite mode" toggles show explicit ON/OFF.

**Security**
- **Writes require sign-in at the database level** (`supabase-v8-admin.sql`); reading stays open.
- **Reset, cost-editing & timeline edits** limited to leaders/admins.
- Sign-in via Google or email magic-link; the linked email is stored privately in crew metadata and never surfaced to other users.

**Admin (owner-only — `tashiiwhite@gmail.com`)**
- A hidden **🛠 Admin** panel, visible only to the owner; never surfaced or explained to other users.
- **Admin guide / FAQ** (Data tab) — a private reference explaining admin privileges, how to use each tool, how roles work, and how sign-in / email-linking logging works.
- **Preview as any role** — see the site exactly as signed-out / visitor / camper / leader, with a **translucent preview bar pinned to the very top** and one-click exit.
- **Live presence** — who's online and which tab they're on.
- **Departure / announcement banner** — title, message, optional link; toggle on/off; shows atop Basecamp for everyone. *(Tip: point the link at your hosted `whats-new.html` so the crew can read the changelog.)*
- **User management** — block/unblock emails; view crew with linked email; link/unlink any crew member; grant/revoke Leader; toggle sign-ups.
- **Reports → data-center dashboard** (dependency-free inline SVG, dense modern UI):
  - **Live now** counters from presence — online total, signed-out, visitors, campers, leaders, admins (updates in real time).
  - **Audience** — visits this month & all-time, unique people (emails vs anonymous), total & average time-on-site, crew size.
  - **Visitor log** — every email that has visited, with role, visit count, time-on-site and last-seen.
  - **Traffic** (peak online/day, visits/day) plus trip charts: gear claimed, votes, shopping done, packing-by-crew, spend-by-person, items-bought, roles.
- **Data tools** — export/import JSON, export PDF, reset trip.

**Analytics setup (one-time):** run **`supabase-v8-analytics.sql`** in the Supabase SQL editor to create the `site_visitors` + `site_daily` tables. The client records visits + session time for both signed-in emails and anonymous visitors; the dashboard reads them live. Until the SQL is run, the dashboard shows a small "run the analytics SQL" note and the rest of the panel still works.

**Deploy note:** this release adds three files — **`i18n.js`**, **`content-fr.js`**, and (optional, hosted separately) **`whats-new.html`**. Upload `i18n.js` and `content-fr.js` alongside `app.js` / `index.html` / `sw.js` in the same commit. Cache bumped to **v24**.

**Later v8.1 refinements**
- **Aurora is the default theme for signed-in users** (the old monthly rotation is gone). Pick any theme and it's remembered on your device from then on.
- **Signed-out users see the trip as empty** — crew, costs and everything look reset until they sign in, at which point the real shared data appears.
- **Visitors** can browse the crew data, but the **Costs page is private to the crew** — it's blurred with a "link your name to see the numbers" note until they become a camper.
- **Reset All is hidden** from visitors and campers (managers only).
- **Admin-only multi-buyer picker** on Shopping — assign several people who chipped in for the same item (👥 assign).
- **Restore hidden timeline points** — hiding a default point now shows a "Restore hidden points" button so nothing is lost.
- **Admin simulations** (Data tab) — preview the site as not-signed-in / visitor / camper / leader, and trigger the sign-in identity pop-up, departure banner, and buyer picker for testing without a second account.
- **Preview-as-not-signed-in** now correctly shows the "Local — sign in for live" sync state instead of Live.
- Standalone changelog button fixed ("← Back to website") and made theme-proof with explicit colours.

### v7 — June 13, 2026

This release added per-person packing, dynamic site-aware links, the in-app campsite maps, and a Simplify mode.

**Personal packing lists**
- **"Who am I" selector** on Basecamp and the Gear tab (saved per device). Pick yourself to get a personal packing list and your own progress bar in the Basecamp readiness meters.
- **My packing list** shows everything assigned to you, everything marked "All crew" (each person packs their own copy), and your own custom personal items. Tick items off as you pack.
- **Add/remove personal items** to your own list (e.g. retainer, charger, book) without touching the shared team gear.
- **Per-person packing for "All crew" gear** — each crew member checks off their own copy; the team gear row shows a per-person packed count.

**Campsite enhancements**
- **Dynamic quick links** — the Basecamp quick links follow the chosen campsite: booking, info/rates, directions, that town's weather, and the correct provincial fire-ban page all switch with your pick. (Both options show until a site is chosen.)
- **In-app site maps** — each campsite card has a 🗺 Site map button opening a full-screen viewer with the high-resolution map. Pinch/scroll to zoom, drag to pan, double-tap to reset, and Save to your device (uses the iOS share sheet, with a download fallback). Maps are cached for offline use.
- Updated the Ivy Lea links to the current campground page.

**Simplify mode**
- New **Simplify** setting de-clutters the site (especially on mobile) by hiding the secondary tabs (Itinerary, Shopping, Costs, Activities) and trimming secondary sections, keeping the essentials: Basecamp, Campsites, Gear, Food, Survival. Saved per device.

**Polish**
- Help guide and welcome banner updated to cover the packing list, "who am I", sign-in, and Simplify.
- Mobile sign-in button shortened to "Google" with the email link on one compact row.

### v6 — June 12, 2026

This release focused on sign-in and the iOS home-screen (PWA) experience, plus a round of polish.

**Sign-in & accounts**
- **Google sign-in gates live access.** Signed-out visitors run in local mode (device-only data, Classic theme); signing in unlocks live sync, the online-presence counter, and all 12 themes. Signing out reverts automatically.
- **Email magic-link sign-in** as an alternative to Google — enter your email in the sign-in modal and tap the link we send. Works reliably everywhere, including inside the installed app.
- Supabase auth uses the implicit flow with URL-hash session recovery, so the session is restored correctly on return from the provider and persists across launches.
- **Compact sign-in modal** — Google + email link in a tight, low-footprint layout.

**iOS home-screen app (PWA)**
- **Hardened boot sequence** so the app is always responsive and typeable. Core UI initialises first inside guarded blocks; GSAP, Three.js, and Supabase are optional enhancements that can never freeze the page. Verified to still boot and accept input even if every CDN is unavailable.
- **Service worker** caches only clean responses and never serves a broken/partial file; CDN scripts have `onerror` guards.

**Monthly themes**
- **Signed-in users get a monthly-rotating default theme**, alternating every calendar month forever: June 2026 → Botanic, July → Aurora, August → Botanic, and so on. A manual theme pick wins for the rest of that month; the rotation re-applies when a new month begins.

**Polish**
- Sign-in and sync errors surface as on-screen toasts.
- README now carries a dated version history.

### v5 — June 11, 2026
- **Google sign-in now gates live access.** Signed-out visitors run in local mode (device-only data) with the **Classic theme forced**; all other themes show a 🔒 lock. Signing in unlocks live sync + every theme; signing out reverts automatically.
- **Online presence counter** — a pill showing "N online" via Supabase Presence, visible only in live mode.
- **Status tooltip** — hover the Live/Local/Offline pill for a plain-language explanation.
- **7 new flagship themes** (12 total), each with a unique identity, its own Three.js desktop scene + themed 2D mobile fallback: **Nebula** (starfield + shooting stars), **Synthwave** (neon grid horizon + scanlines), **Botanic ☀** (the light theme — meadow paper + pollen), **Abyss** (ocean bubbles + light rays), **Sakura** (falling petals), **Carbon** (brutalist mono + film grain + torus knot), **Dune** (wind-blown sand + low sun).
- **Motion on scroll** — cards reveal/lift as you scroll; Three.js cameras respond to scroll depth.
- **New settings:** Performance mode (disables glass blur) and Compact mode (tighter spacing).
- Service-worker cache bumped (cache-first → kept network-first); auto-reload on new deploys.

### v4 — June 10, 2026
- Renamed the whole app **WildWeekend → Camping 2026** (title, wordmark, PWA name, footer, share text, manifest).
- **Fixed: stale deploys.** Rewrote the service worker to **network-first** with a versioned cache name + a cache-busted script tag + auto-reload, so new deploys always appear (the old cache-first SW was serving outdated files).
- README rewritten for the final feature set.

### v3 — June 10, 2026 (Aurora release)
- **Default Aurora theme** — glassmorphism cards, gradient wordmark, animated aurora blobs, fireflies canvas, GSAP entrance animations.
- **Settings panel (⚙)** with theme switching (Aurora / Ember / Glacier / Topo / Classic) + motion toggle, all saved **per device** (never synced to crew).
- **Adaptive ambience** — Three.js particle field on desktop, lightweight 2D canvas on mobile (mobile never downloads Three.js); graceful fallback if WebGL fails.
- 3 themed scenes added: **Ember** (camping — rising embers), **Glacier** (snowfall), **Topo** (wireframe terrain).
- **Trip-readiness meters** (crew / site / gear / shopping %) and a **Share** button (native share sheet + clipboard fallback).
- Particles tuned smaller and slower; soft-sprite glow replaces hard squares.
- **Weather links fixed** — switched from a broken Environment Canada search URL to working Weather Network 14-day pages.
- **Clothing & attire** + **Personal kit** gear categories added (16 items) with a sync-safe migration that merges into existing live data without disturbing claims/votes.
- "Copy for group chat" button on the settle-up; Enter-key support on stop inputs.

### v2 — June 6, 2026 (Live sync release)
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

### v1 — June 6, 2026 (initial)
- Single-file static site: Basecamp, Campsites (with voting), Itinerary, Gear (claim system), Food (matrix + 9-meal plan + prep), Shopping (3 phases), Costs (Splitwise-style splitter), Survival (roles, tips).
- `localStorage` persistence with JSON export/import for sharing.
- Deployable to GitHub + Netlify, zero build step.

## Files

```
.
├── index.html              # full UI — all tabs, themes, modals, print CSS
├── app.js                  # logic, trip data, Supabase sync, auth, analytics, Three.js themes
├── i18n.js                 # bilingual engine + EN/FR-CA UI dictionary
├── content-fr.js           # French (CA) translations of all trip-content data
├── config.js               # Supabase URL + anon key (already wired, safe to commit)
├── supabase-schema.sql     # base tables — run once in Supabase SQL Editor
├── supabase-v8-admin.sql   # write-lock + admin_config (run once)
├── supabase-v8-analytics.sql # site_visitors + site_daily analytics tables (run once)
├── sw.js                   # offline-first service worker (precaches i18n.js + content-fr.js)
├── manifest.webmanifest    # PWA manifest (name, icons, theme colour)
├── whats-new.html          # standalone changelog page (deploys at /whats-new.html for banner links)
├── icons/                  # app icons: 192×192, 512×512, apple-touch, favicon
├── maps/                   # campsite maps (plage.jpg, ivy.jpg)
├── netlify.toml            # zero-config Netlify deploy (blank build, root publish)
├── .gitignore
└── README.md
```

> **Banner changelog link:** `whats-new.html` is a self-contained page. Once deployed it lives at
> `https://campingjune2026.netlify.app/whats-new.html` — use that URL in the admin departure/announcement
> banner so the crew can tap through to see what's new. It is intentionally *not* precached by the service
> worker (it's a standalone marketing page, not part of the app shell).

## Future ideas (not built, parked by design)

- Multiple trips + join-by-code (schema already supports it — just more rows in `trips`)
- Presence indicators ("Sam is viewing Gear tab right now") via Supabase Presence
- Post-trip photo wall using Supabase Storage
- Push notifications for the fire-ban / weather check the night before
- Lock writes to signed-in users only (one SQL change at the bottom of `supabase-schema.sql`)

## License

MIT — built for the crew. 🔥
