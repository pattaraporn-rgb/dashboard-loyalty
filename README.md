# Loyalty Dashboard Pro

Static loyalty-CRM dashboard that runs entirely in the browser. Upload three Excel files (contacts, point report, redemptions) and view monthly KPIs, sales/points breakdowns, redemption analytics, and inactive-member analysis. Backed by Supabase REST for persistence; deployed on GitHub Pages.

## Live

GitHub Pages auto-deploys from `main` via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Layout

- `index.html` — HTML structure + inline `<style>` (CSS stays inline so `exportAsHTML` can snapshot it)
- `js/*.js` — application code split across 10 classic scripts (no bundler). Load order matters; see [CLAUDE.md](CLAUDE.md#script-load-order-in-indexhtml).
- `.github/workflows/deploy.yml` — copies `index.html` + `js/` to the GitHub Pages site

## Working in this repo

Read [CLAUDE.md](CLAUDE.md) first. It is the single source of truth for:

- file map (which file owns which feature)
- script load order
- data flow (Excel upload → store → recompute → render)
- icon system (Lucide via CDN, `refreshIcons()` after dynamic HTML)
- Supabase schema rules (`SUPA_COLS` mirrors Excel column headers exactly)
- the export-HTML sync rule (panels HTML is duplicated in `js/export.js` and must stay in sync with `index.html`)

## Stack

- Chart.js 4 + chartjs-plugin-datalabels (CDN)
- SheetJS (xlsx) for Excel parsing
- Lucide icons (CDN)
- Supabase REST API for the three tables (`contacts`, `point_report`, `redemptions`)
- No build step, no Node runtime required for local development — just open `index.html` in a browser

## License

Internal project. Not for redistribution.
