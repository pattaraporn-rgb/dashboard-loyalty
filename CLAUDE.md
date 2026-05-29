# Loyalty Dashboard — Project Rules for Claude

## Architecture
- Static site on GitHub Pages (no server, no build step)
- HTML structure in `index.html`; CSS inline in `<style>` (kept inline so `exportAsHTML` can read it)
- All JavaScript split into 10 files under `js/` — loaded as **classic scripts** (not modules), so all top-level declarations share one global scope
- Supabase REST API for persistence (3 tables: `contacts`, `point_report`, `redemptions`)
- Global state lives in `D` (computed dashboard data), serialized to `ld_computed` localStorage

## File map — where to edit what

| Want to change… | Edit file |
|---|---|
| Brand colors, chart palette, month labels, Supabase URL/keys, global state vars | [js/config.js](js/config.js) |
| Date parsing, column lookup, fmt/pchCell/stat display helpers, color math | [js/utils.js](js/utils.js) |
| QA checks (duplicates, bad dates, GIVEN/0 sale rules), QA report UI | [js/validate.js](js/validate.js) |
| How `D.s1`–`D.s5` are computed from localStorage | [js/compute.js](js/compute.js) |
| Excel reading, validation calls, storage, fire backupToSheet | [js/upload.js](js/upload.js) |
| KPI cards, file cards, panel renderers P2–P5, chart helpers | [js/render.js](js/render.js) |
| Store name/tagline/color/logo settings, header gradient | [js/settings.js](js/settings.js) |
| Supabase fetch/backup/clear, CRUD modals | [js/api.js](js/api.js) |
| Excel templates, GAS code, **exportAsHTML self-contained snapshot** | [js/export.js](js/export.js) |
| App boot, tab switching, clear-all, column-info popups | [js/app.js](js/app.js) |

## Script load order (in `index.html`)

```
CDN: chart.js, xlsx.js
↓
config.js   ← constants + global let D/fileInfo/etc.
utils.js    ← findVal, parseDate, formatting helpers
validate.js ← QA validators (uses findVal)
compute.js  ← recomputeAndRender (uses utils + render's updateKpis)
upload.js   ← processFile (uses validate + compute + api.backupToSheet)
render.js   ← renderP2–P5, updateKpis, mkChart (uses utils)
settings.js ← loadSettings, applySettings (uses utils colors)
api.js      ← syncFromApi, backupToSheet (uses upload.storeXxx)
export.js   ← exportAsHTML (uses .toString() of render fns — must be functions, not arrows)
app.js      ← DOMContentLoaded, switchTab, clearAllData ← must be LAST
```

## Critical: Export HTML sync rule

**Every time you change panel HTML in `index.html`** (add/remove/rename any `<div id="...">` inside panels p2–p5), you MUST also update the `panelsHtml` template string inside `exportAsHTML()` in [js/export.js](js/export.js).

Reason: `exportAsHTML` embeds a **hardcoded copy** of panel HTML. If main and embed drift, the exported file crashes silently — render functions reference elements that don't exist.

Past bug: `inactiveSection` existed in main HTML but not in `panelsHtml` → `renderP2` crashed → panels 2, 3, 4 never rendered.

**Rule: after any panel HTML edit, grep for the element ID in `js/export.js` and confirm it's present.**

Also: `exportAsHTML` re-uses `darkenColor/lightenColor/fmt/pchCell/...` via `.toString()`. These must be **`function` declarations, not arrow functions**, or `.toString()` may not include the name.

## Column name normalization
- `findVal` (in `utils.js`) normalizes `_` → space + lowercase before comparing, so `register_date` matches `'register date'`, and Supabase snake_case columns match Excel-style names transparently.
- Excel column aliases that don't match Supabase 1:1 are mapped in `SUPA_ALIASES` (config.js): `"Phone No"` ← `Tel`, `"Line User ID"` ← `LINE user id`.

## Render function dependencies
- `renderP2` → references `inactiveSection` (exists in main HTML, skipped in export via `if(!el) return`)
- `renderP3` → requires `D.s3` (from point_report data)
- `renderP4` → requires `D.s4a` (from point_report data)
- `renderP5` → requires `D.s5` (from redemptions data)

## Data flow

```
Excel upload  → processFile (upload.js)
              → validateContacts/Point/Redemptions (validate.js)
              → computeInactiveData (upload.js, in-memory only)
              → backupToSheet (api.js, fire-and-forget to Supabase)
              → storeContacts/Point/Redemptions (upload.js, localStorage)
              → recomputeAndRender (compute.js)
                → updateKpis, updateDbSummary, updateFileCards, updateDateLabel (render.js)
                → renderP2–P5 (render.js)
exportAsHTML  → reads current D in memory → embeds as JSON → no Supabase fetch
```

## localStorage keys
- `ld_contacts`, `ld_point`, `ld_redemp` — stripped raw rows per slot
- `ld_computed` — full D object (PII stripped)
- `ld_settings` — store name, tagline, color, dateRange, logo
- `ld_logo` — base64 logo image
- `ld_api_url` — (unused now Supabase is hard-coded in config.js)

## Month filtering
- Current month is always excluded from New User chart and `total_active` KPI: `r.regDate < curPeriod`
- This is intentional — current month's data is incomplete

## Date parsing (`parseDate` in utils.js)
Handles:
- `Date` objects, Excel serial numbers (`44927`)
- Numeric strings from Supabase text columns (`"44927"`)
- `DD/MM/YYYY [HH:MM]`
- `YYYY-MM-DD...`
- `YYYY/MM/DD` (Thai with slashes)
- Buddhist Era: year > 2499 → subtract 543

## Supabase backup
- `backupToSheet` (api.js) sends ALL columns from `SUPA_COLS` for every row (uniform keys required by PGRST102)
- Missing fields → `null`
- Date columns (`SUPA_DATE_COLS`) are converted to `"YYYY-MM-DD"` strings before upload, so Supabase text columns never store raw Excel serials

## Adding new logic — keep it in scope

- Adding a new render → put `renderPN` in [js/render.js](js/render.js), wire `renders[N]` in [js/app.js](js/app.js)
- Adding new Supabase columns → update `SUPA_COLS` in [js/config.js](js/config.js) AND add Excel aliases in `SUPA_ALIASES` if name differs
- Adding new D.sN field → compute in [js/compute.js](js/compute.js), render in [js/render.js](js/render.js)
- New date format → add a regex in `parseDate` ([js/utils.js](js/utils.js))
