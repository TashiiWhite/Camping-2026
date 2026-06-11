# 🏕️ WildWeekend v4 — Live-Synced Crew Field Plan (Aurora)

A PWA (installable web app) for planning a 3-day car-camping trip. One shared trip — **camping-june-2026** — that every crew member views and edits live, from any device. Built on plain HTML/CSS/JS + Supabase (free tier). No build step.

## What's new in v2

| Feature | Where |
|---|---|
| 📱 **Home-screen app icon** (iPhone & Android) + offline mode | PWA manifest + service worker |
| 🔄 **Live sync** — everyone sees the same data instantly | Supabase Realtime |
| 🔐 **Google sign-in** | Supabase Auth (optional) |
| 🗺 **Route planner** — add stops, open full route in Google Maps, reverse it for the drive home | Itinerary tab |
| ⭐ **Choose-this-site** — locks the campsite, powers maps/weather/route | Campsites tab |
| ➕ **Gear add/remove + archive** (restore anything) + **multi-assign** + **"All crew"** option | Gear tab |
| 🛒 **Shopping in 2 categories** (Food / Gear & essentials) with **Amazon · Canadian Tire · Decathlon** links and a best-store pick per item, incl. preventative items (bug spray, first aid…) | Shopping tab |
| 💸 **Upgraded costs** — categories, spend-by-category bars, minimal "who pays who" transfers | Costs tab |
| 🎉 **Activities tab** — things in the area (per site), fun things to bring, camp/tent games | Activities tab |
| 🌧 **Situations & fixes** (rain, mosquitos at night, dead fire, raccoons…) + **FAQ** | Survival tab |
| ❓ **How-to-use guide** — dismissible banner + "?" button, always one tap away | Header |
| 🖨 **Export the full site as PDF** | Basecamp tab |

The app runs in **Local mode** out of the box (everything saved per-device). Connect Supabase to flip it to **Live mode** for the whole crew.

---

## 1. Deploy the site (GitHub → Netlify)

```bash
git init
git add .
git commit -m "WildWeekend v2"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/wildweekend.git
git push -u origin main
```

Then in [Netlify](https://app.netlify.com): **Add new site → Import an existing project → your repo** → build command *blank*, publish directory `.` → **Deploy**. (Or drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop).)

> ⚠️ The PWA install + service worker need HTTPS — they work on Netlify, not when opening the file directly.

## New in v3

- ✨ **Aurora theme (default)** — glassmorphism cards, gradient wordmark, animated aurora blobs, a fireflies canvas, and GSAP entrance animations.
- 🎛 **Settings (⚙ in the header)** — switch between **Aurora** and **Classic** themes, and toggle motion. Both are saved **per device only** (your theme never changes what crewmates see).
- 📊 **Trip readiness meters** on Basecamp — crew added, site chosen, % gear claimed, % shopping done.
- 🔗 **Share button** — native share sheet on mobile, clipboard fallback on desktop.
- ⚙️ `config.js` is already wired to your Supabase project — just finish the dashboard steps below.

## 2. Set up Supabase (≈10 minutes) — turns on live sync

1. Create a free account at [supabase.com](https://supabase.com) → **New project** (any name, any region, set a DB password).
2. When it finishes provisioning, open **Project Settings → API** and copy:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key
3. **Already done for you** — `config.js` contains your project URL + anon key. (The anon key is public by design; security comes from RLS policies. The Google Client Secret and DB password must NEVER go in this repo.)
4. In Supabase, open **SQL Editor → New query**, paste the entire contents of **`supabase-schema.sql`**, hit **Run**. This creates the `trips` table, open policies, realtime, and seeds the shared trip row.
5. Commit + push `config.js` (the anon key is designed to be public — security comes from the RLS policies).
6. Reload your Netlify site → the pill in the header turns **green “Live”**. Done — every device now shares one trip.

> The anon key + open policies mean *anyone with your site URL* can edit the trip. For a private friends app that's usually fine. To require sign-in for edits, do step 3 below, then run the commented-out "lock writes" block at the bottom of `supabase-schema.sql`.

## 3. Enable Google sign-in (optional)

1. In Supabase: **Authentication → Providers → Google** → toggle **Enable**. Copy the **Callback URL** shown (`https://<project>.supabase.co/auth/v1/callback`).
2. Go to [Google Cloud Console](https://console.cloud.google.com) → create/select a project → **APIs & Services → OAuth consent screen** → External → fill the app name + your email → add your crew's emails as test users (or publish).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origins: your Netlify URL (e.g. `https://wildweekend.netlify.app`)
   - Authorized redirect URIs: the Supabase **Callback URL** from step 1
4. Copy the generated **Client ID** and **Client Secret** into the Supabase Google provider form → **Save**.
5. In Supabase: **Authentication → URL Configuration** → set **Site URL** to your Netlify URL.
6. Reload the site → **Sign in with Google** in the header now works.

## 4. Install on your phone

- **iPhone (Safari):** open the site → Share button → **Add to Home Screen**. The tent icon + standalone app mode are automatic.
- **Android (Chrome):** open the site → ⋮ menu → **Add to Home screen** (or the install prompt).

Offline: the service worker caches the whole app shell. With no signal you can still open the app and read everything; your last-synced data is cached locally and changes re-sync when you're back online. There's also **Export full site as PDF** on the Basecamp tab for a fully static copy.

## Files

```
.
├── index.html            # UI (all tabs, help, modals, print CSS)
├── app.js                # logic, data, Supabase sync, auth
├── config.js             # ← paste your Supabase URL + anon key here
├── supabase-schema.sql   # ← run in Supabase SQL Editor
├── sw.js                 # offline service worker
├── manifest.webmanifest  # PWA manifest (name, icons, theme)
├── icons/                # app icons (192/512/apple-touch/favicon)
├── netlify.toml
└── README.md
```

## How sync works (for the curious)

One row in the `trips` table holds the entire trip as JSON. Every edit bumps a revision counter and upserts the row (debounced 700 ms); Supabase Realtime broadcasts the change to all connected devices, which replace their state and re-render. Offline edits save locally and push when the connection returns (newest revision wins). Simple, robust, perfect for a 4–5 person crew.

## Future ideas (not built yet, by design)

Multiple trips per user + join-by-code is the natural next step — the schema already supports it (just more rows in `trips` + a trip picker). Say the word when you want it.

## License

MIT — built for the crew. 🔥


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
| **Aurora** (default) | Glassmorphism cards · gradient wordmark · floating glow orbs · GSAP entrance animations |
| **Ember 🔥** | Camping-specific: warm firelight palette · embers rising off the screen · Three.js on desktop |
| **Glacier** | Icy blues · slow-falling snow · cool glass cards |
| **Topo** | Tactical expedition: neon green on near-black · animated wireframe terrain mesh |
| **Classic** | Original flat dark field-plan look — no animations |

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

## 6. Data & sharing

All live data (crew, gear claims, votes, costs, stops, roles, checklists) syncs in real time via Supabase Realtime. Every device that opens the site shares the same trip row automatically.

Theme, motion preference, and the help-banner dismiss are saved **per device only** and never synced — your theme choice doesn't change what your crewmates see.

To share state when Supabase isn't connected: **Export crew data** → send the `.json` file → crewmates **Import crew data** (both on Basecamp tab).

---

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
