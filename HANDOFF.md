# Camping 2026 — Handoff & Status

> Snapshot of where the project stands at finalization. Pair with `ARCHITECTURE.md` (how it works) and `README.md` (full feature changelog).

**Current version:** v8 (everything previously labeled "v9" was merged into v8 — there is no separate v9 anywhere).
**Cache:** `camping2026-v27` · **Script ref:** `app.js?v=27`
**Status:** Feature-complete and code-tested. The analytics dashboard's *live data* still needs real-device verification (see below).

---

## ✅ Done & verified (automated browser tests, zero JS errors)

**Languages**
- Full bilingual EN ("English (CA)") + FR ("Français (CA)") across all 9 tabs and all trip content. No layout overflow in either language. Per-device choice saved.

**Access & roles**
- Signed-out users can't open locked pages (Gear/Food/Shopping/Costs); tab clicks bounce to Basecamp.
- Signed-out site "looks reset" (no crew data), real data returns on sign-in.
- Visitor / camper / leader / admin roles with header badge; forced first-sign-in identity prompt (existing crew / new crew / browse); private email linking.
- Reset All hidden from visitors & campers (managers only).
- Costs page blurred for visitors with a "link your name" note; visible to camper/leader/admin.

**Features**
- Inline meal-plan editing (tap an item on the card to edit).
- Timeline auto-sorts new points by parsed time; default points editable/hideable + "Restore hidden points".
- Gear "I'm" + "Viewing" selectors side by side; personal packing lists with quantities; read-only view of others.
- Shopping "I bought this"; **admin-only multi-buyer picker** (👥 assign).
- Editable cost items; dropdown contrast fixed across all themes.
- **Aurora is the default theme for signed-in users** (monthly rotation removed); chosen theme sticks per device.

**Admin (owner-only)**
- Data-center Reports dashboard: live role counters, audience stats, visitor log, trip charts (inline SVG).
- Admin guide/FAQ modal.
- Preview-as-role with a translucent top bar; preview-as-not-signed-in shows "Local — sign in for live".
- Simulation buttons (Data tab): preview each role + trigger the sign-in popup, banner, and buyer picker.
- User management (block, grant leader, link/unlink), announcement banner, export/import/reset.

**Stability**
- Standalone changelog button fixed ("← Back to website", explicit colors).
- Header layout no longer shifts when the sync pill text changes.
- "I'm" dropdown auto-selects the crew member linked to your email.
- Connection failure falls back to cached data instead of going blank.
- **Critical data-loss bug fixed** (see below).

---

## 🐞 The data-loss bug (fixed in v25 — context for the future)

A render-time `state` swap (added to "hide" data for some roles) could, combined with the rev-guard in `connectLive`, push empty local state over good remote data and **wipe the crew's trip**. Symptom: "all data gone" across every page.

**Fix:** the swap was removed entirely; `connectLive` now refuses to blank-over good remote crew data. See `ARCHITECTURE.md` §6 for the rules to avoid reintroducing this. **Do not hide data by reassigning the global `state`.**

> ⚠️ If the buggy version (v24) was ever live, it may have already overwritten the Supabase `trips` row with empty data. After deploying v25, check the `trips` row in Supabase — if `crew` is empty, re-enter it once (or import a saved JSON export). v25 protects it going forward but can't recover what a prior version already blanked.

---

## ⚠️ Needs real-world verification (could not be tested in sandbox)

1. **Analytics live data** — visit counts (month/all-time), unique visitors, time-on-site, and the live role counters. Built + structure-tested with simulated data only; needs the deployed Supabase + analytics SQL + tables in the Realtime publication.
2. **Auth / presence on real devices** — sign-in flow, email linking, online counter, cross-device live sync.
3. **Visitor/signed-out data hiding** — tested clean per role, but it touches every page; worth a quick real-device pass.
4. **French** — machine-translated Québécois; a native speaker should skim it.

---

## 🚀 Deploy checklist

1. **Supabase (one-time):** run `supabase-schema.sql`, then `supabase-v8-admin.sql`, then `supabase-v8-analytics.sql`. In Database → Replication, add `trips`, `site_visitors`, `site_daily` to the publication.
2. **Push to GitHub (one commit):** `app.js`, `index.html`, `sw.js`, `i18n.js`, `content-fr.js`. (Cache v25 forces all clients to update.)
3. **Host the changelog:** upload `whats-new.html`; it serves at `https://campingjune2026.netlify.app/whats-new.html`. Paste that URL into the admin Banner → link field.
4. **Real-device smoke test:** sign in with a fresh email (confirm forced identity popup → camper), switch EN↔FR, open the admin dashboard and confirm counters populate, run the Data-tab simulations, check the cost-page blur via "Preview: visitor", and confirm your crew/data is present (see the data-loss note above).

---

## 🔭 If expanding later (in Claude Code or elsewhere)

Start by reading `ARCHITECTURE.md` end to end, then this file. Good first candidates and the cautions around them are in `ARCHITECTURE.md` §13. The two things most likely to bite a new contributor:
- The **sync/data-loss rules** (§6) — never mutate global `state` for display.
- The **i18n key-coverage invariant** (§8) — keep the `comm -23` check passing.

A starter prompt for a fresh session is in `CLAUDE_CODE_PROMPT.md`.
