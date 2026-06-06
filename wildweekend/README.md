# 🏕️ WildWeekend — The Crew's Field Plan

A self-contained, single-page web app for planning a 3-day car-camping trip (Jun 19–21, 2026). No backend, no build step, no dependencies — just static files. Built for a crew of 4–5 to coordinate campsites, gear, meals, costs, and contingencies.

![status](https://img.shields.io/badge/build-static-9bce6f) ![deploy](https://img.shields.io/badge/deploy-netlify%20%7C%20github%20pages-6cb6d4)

## What's inside

| Tab | What it does |
|-----|--------------|
| **Basecamp** | Trip summary, live countdown, crew manager, quick links (campsites, fire-ban, weather) |
| **Campsites** | Side-by-side comparison of Camping de la Plage (QC) vs Ivy Lea (ON) + live voting |
| **Itinerary** | Hour-by-hour timeline, Thu Jun 18 → Sun Jun 21 |
| **Gear** | Full gear list with a claim system so nobody double-buys |
| **Food** | Filterable food matrix (store/cook method) + 9-meal plan + expert prep & storage |
| **Shopping** | 3-phase shopping checklists (home / road / on-site) |
| **Costs** | Expense logger with automatic Splitwise-style settle-up |
| **Survival** | Role assignments, field tips, safety info, what's-still-missing |

## Data & sharing

All data is saved to **`localStorage`** in each person's browser — nothing leaves the device. To share the live state across the crew:

1. One person fills things in, then hits **Export crew data** (Basecamp tab) → downloads a `.json` file.
2. Send that file to the others; they hit **Import crew data** to load it.

> Want true real-time multi-user sync? See [Optional: live sync](#optional-live-sync) below.

## Run locally

Just open `index.html` in a browser. Or serve it:

```bash
# Python
python3 -m http.server 8080
# then open http://localhost:8080

# or Node
npx serve .
```

## Deploy to Netlify

**Option A — drag & drop (fastest):**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag this whole folder onto the page. Done — you get a live URL.

**Option B — from GitHub (auto-deploys on push):**
1. Push this repo to GitHub (see below).
2. In Netlify: **Add new site → Import an existing project → pick your repo.**
3. Build command: *(leave blank)* · Publish directory: `.` (root)
4. Deploy. The included `netlify.toml` already sets this up.

## Deploy to GitHub Pages

1. Push to GitHub (below).
2. Repo **Settings → Pages → Source: Deploy from a branch → `main` / root.**
3. Your site goes live at `https://<username>.github.io/<repo>/`.

## Push to GitHub

```bash
git init
git add .
git commit -m "WildWeekend camping field plan"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## Optional: live sync

The app is intentionally backend-free. If you want all 4–5 phones to see the same data in real time, the cleanest drop-in is a free [JSONBin](https://jsonbin.io) or [Supabase](https://supabase.com) table — swap the `load()` / `save()` functions in `app.js` to read/write that endpoint instead of `localStorage`. The rest of the app doesn't change.

## Files

```
.
├── index.html       # the whole UI
├── app.js           # all logic + trip data
├── netlify.toml     # Netlify config
├── .gitignore
└── README.md
```

## License

MIT — do whatever you want with it. Built for the crew. 🔥
