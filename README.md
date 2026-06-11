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
