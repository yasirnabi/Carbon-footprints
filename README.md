# carbon-web: Carbon pilot web app (MVP slice)

Vite 6 + React 18 + TypeScript + Tailwind v4, themed only from the B1 tokens (`../carbon-ui/tokens/tokens.css`, imported, not copied). IA and URLs follow `../carbon-ui/docs/lpd-b1-b3-v1.md`. Screens follow `../carbon-core/docs/lpd-pilot-screens-v1.md`. Data comes from `../carbon-api` over HTTP. Nothing in carbon-api or carbon-core is modified: the seed script only reads `carbon-core/test/fixtures/demo-dataset.ts` and loads it through the public API.

## Run

```bash
npm install
npm run stack            # carbon-api in memory on :8787 (CARBON_DEV_AUTH=1), seeds the demo data, then vite dev on :5173
npm run build            # tsc -b && vite build
npm run stack -- --preview   # serves the built bundle on :4173 against a freshly seeded API
npm run test:e2e         # Playwright: builds, starts its own API (:8788) and preview (:4174), runs 6 tests
```

| Env | Meaning |
|---|---|
| `VITE_API_URL` | API base the app calls (default `/api/v1`, same origin) |
| `CARBON_API_PROXY` | Where Vite proxies `/api` (default `http://127.0.0.1:8787`). The API has no CORS (same-origin BFF by design), so a cross-origin `VITE_API_URL` only works if that host adds CORS. |
| `VITE_REPORTING_YEAR` | Default period, `2025-10:2026-09` (pilot FY) |
| `API_PORT`, `WEB_PORT` | Ports used by `scripts/stack.ts` |

**Seed** (`scripts/seed.ts`, idempotent): for each of three dev companies (`demo-1`, `demo-2`, `demo-3`), it creates 3 sites, 5 illustrative factors, the AR-0111 bill (PDF stub) and 168 records. A seed reviewer then approves 167 of them. AR-0111 (Plant B, Aug 2026, 14,894,800 kWh, SPIKE warning) stays pending. The data is the same in all three companies, but each company keeps its own state, so tests can change one and leave the others fresh.

**Dev sign-in**: choose a person (Noura = reviewer, Faisal = data entry, Khalid = admin + data entry, Omar = viewer, Sara = auditor), a role (their own roles or any single role) and a company. The app sends `X-Dev-User: <userId>;<roles>;<companyId>` on every request. The list lives in `src/lib/dev-users.ts`. All people and companies are fictional.

## Screens

| Route | Screen |
|---|---|
| `/sign-in` | Dev sign-in (person / role / company, header preview, EN \| ع) |
| `/c/:company/:site/…` | App shell. Sidebar at ≥768 px (240 px at ≥1024, 64 px icon rail between). Bottom tabs + More sheet below 768 px, with tabs chosen per role (IA §2.3). Header: company › site switcher, "Pilot · not audited", EN \| ع, theme (light/dark/system), user + role badges, sign out. Skip link. The Review nav item shows the pending count. |
| `…/review` | Review queue: metric cards (Pending / Blocked / Warnings / Approved), status Segmented control, source / finding / month filters (all in the query string). Sorted blocked first, then warnings, then oldest. Missing months (GAP) appear in an Alert. Table on desktop, cards on phones. Empty state has "See the total". |
| `…/review/:recordId` | Record Drawer (a URL segment, so Back closes it). Shows breadcrumb, pilot rule, findings (SPIKE explained in words, with "Use suggested value"), value and document (opening it is audited by the API), and a History tab. **Edit** needs a reason of at least 5 characters. **Approve** needs a note while a warn finding is open; otherwise it is refused before any request, with the reason in words, and the API's 422 is mapped to the same message. **Reject** asks for a category and details. **Reopen** asks for a reason. Every action sends `If-Match: "rev-n"`; a stale revision triggers a reload and a message. |
| `…/dashboard` | From/to months. "Run calculation" (reviewer/admin) shows the latest matching snapshot for that period and scope. Honesty badges (Approved records only · Not audited · Illustrative). A pending Alert. Metric cards: Total / Scope 1 / Scope 2 / Intensity (per site when products differ). By month (stacked), by site and by source charts, each with a Chart \| Table toggle and an sr-only table. Every total shows **"{n} pending, not in this total"**. A warning appears when records changed after the snapshot. |
| `…/audit`, `…/audit/:seq` | Verify card ("Verify now" → verified / broken / couldn't check). Filters for action and subject/ref. Table newest first. Event Drawer with prevHash / hash (copy) and the event JSON. |
| Documents, Meter vs bill, Factors, Reports | Placeholder: "not in this build" (kept in the nav so the IA doesn't move) |

Direction and type: `<html lang dir>` switches, layout uses logical properties only, and chevrons are mirrored with `.mirror-rtl`. Fonts are bundled through @fontsource: Plex Sans and Plex Sans Arabic at 400/600, Plex Mono at 400. Digits are Western in both languages (`ar-SA-u-nu-latn`, Gregorian, Riyadh time). Number + unit runs sit in `<bdi dir="ltr">`.

## uiarc stand-ins (exception W3: the registry is blocked)

These are hand-built in `src/components/ui`, shadcn-style, themed only from token variables, and named after uiarc components. Replace each one with its uiarc component when the registry opens.

| Stand-in | File | Notes |
|---|---|---|
| Button | `button.tsx` | default / secondary / outline / ghost / destructive / link |
| Badge | `badge.tsx` | status + honesty variants. `.badge-wrap`: never truncates, wraps instead |
| Card | `card.tsx` | Header / Title / Description / Content / Footer |
| Table | `table.tsx` | focusable horizontal scroller. `scroll={false}` for sr-only tables |
| Tabs | `tabs.tsx` | WAI-ARIA tabs. Arrow keys follow reading direction |
| Dialog (+ Drawer) | `dialog.tsx` | native `<dialog>` + `showModal()`. Drawer sits at the inline end or the bottom (sheet) |
| Alert | `alert.tsx` | info / warning / danger / success / honesty, each with an icon |
| Input | `input.tsx` | |
| Textarea | `textarea.tsx` | |
| Select | `select.tsx` | native `<select>`. Also stands in for Combobox in the switcher |
| Sidebar | `sidebar.tsx` | 240 px / 64 px rail / hidden below 768 px. Active item bar |
| Breadcrumb | `breadcrumb.tsx` | mirrored chevron separator, `aria-current` |
| Metric card | `metric-card.tsx` | no count-up animation (pilot rule) |
| Empty state | `empty-state.tsx` | |
| Skeleton | `skeleton.tsx` | |
| Extra: Segmented control, Toast, Label/Field | `segmented.tsx`, `toast.tsx`, `label.tsx` | Toast is wired up but unused, because outcomes show inline in the modal Drawer |
| Custom (spec §11) | `screens/dashboard.tsx` | bar charts + legend + sr-only table (no chart library) |

## Tests (`tests/`, Playwright 1.56.1, Chromium 1194 from `/opt/pw-browsers`)

- `review-flow.spec.ts` runs once in EN (company 1) and once in AR (company 2). Steps: sign in as reviewer → the queue shows AR-0111 with its SPIKE warning → Approve with no note is refused with a message and focus moves to the note → saving the edit with no reason is refused → edit to 10,705,000 with a reason → Approve → Dashboard → Run calculation → **2,295,850.3** and "0 pending, not in this total". The AR run also asserts `dir=rtl`, `lang=ar` and no Arabic-Indic digits at every step.
- `screens.spec.ts` covers:
  - Company 3 dashboard with 1 pending record (2,289,748.5): table view, dark theme, review queue, Drawer, History tab, reject Dialog validation, Back closes the Drawer, AR dark.
  - Audit as the auditor: verify, filter FIELD_EDITED (14,894,800 → 10,705,000), event Drawer, AR.
  - Viewer: access denied on Review and Audit.
  - Mobile at 390 px, EN and AR: bottom tabs, More sheet, no horizontal scroll.
- Every screen and state above goes through axe-core (WCAG 2.0–2.2 A/AA), which must report **0 serious/critical**. Every test fails on **any console error or page error**.
- The tests share one seeded server and run serially (`workers: 1`). The viewer test reads the snapshot that test 3 created.
- Screenshots are in `screenshots/`: `en-*`, `ar-*`, `dark-*`, `mobile-*`.

## Gaps vs spec

- **Sign-in** is the dev header only. The API has no OIDC/SSO, sessions or `/users`. The company picker and the "last used" redirect are simplified.
- **Audit for reviewers**: IA §2.5 gives reviewers read access, but the API serves `/audit-events` to admin and auditor only. Audit is therefore hidden for reviewers, and the reviewer bottom-tab row drops it.
- **Admin** cannot edit through the API unless the user also holds `data_entry` (API rule), so the UI follows the API.
- **Extraction review (§3)**: there are no field-level values, confidence, bounding boxes or document viewer, because the API has no extraction yet. The record Drawer stands in for §3: it reviews the record's quantity and has no "x of y fields checked". "Approve & next", keyboard shortcuts, bulk approve, Rules drawer, assignee filter and finding acknowledge/waive are not built (no API).
- **Findings**: the UI composes the SPIKE text in EN and AR. For other codes it shows the core's English message, which contains raw ids. The SPLIT_BILL / DUPLICATE sub-rules are grouped under their code.
- **Dashboard**: there is no donut, sparklines, year-on-year change, drill-through from bars, or tooltips beyond `title`. Calculations are explicit runs (each one is a `CALCULATION_RUN` audit event). The UI never auto-runs and never sends `includeUnreviewed`. Viewer, auditor and data entry cannot run (API) and see the latest snapshot only.
- **Period picker**: two month Selects instead of a Date range picker. The Review queue period is fixed to the reporting year.
- **Audit**: no CSV export, no actor/date filters, no document viewer in the event Drawer. The "last checked" time is the last `AUDIT_VERIFIED` event.
- **Switcher**: two native Selects (company, site) instead of a grouped Combobox with role badges. Company names come from the dev directory, because the API auto-provisions "Dev company …".
- **Not built**: Documents, Meter vs bill, Factors, Reports, Settings, Account, scope-move toast.
- **Copy**: AR copy has not been reviewed by a native reviewer. Arabic plurals are not handled (for example «مراجعة 1 سجلات»).

## Assumptions

1. Default period = pilot FY Oct 2025 – Sep 2026 (dashboard and queue), not "year to date" or "last complete month". AR-0111 is in Aug 2026, and a last-month default would hide older pending bills, which is an honesty risk.
2. The pending count beside a total = live pending records with a factor in the same period and scope (per scope on the Scope 1/2 cards). The "Not in this calculation" line uses the snapshot's own `excludedByCode`.
3. Intensity = core kg/t ÷ 1,000 → t CO₂e per t product, 3 decimals (Q2). It is shown per site when sites use different bases.
4. Approve-without-note is checked client-side first, so no 4xx reaches the console. The API remains the authority.
5. Edit and reject reasons need at least 5 characters (spec §3). Reject sends "Category: details" in the user's language.
6. Theme "system" is resolved in JS (B1-A3). Language is stored per browser, and `?lang=` is honoured once.
7. The API runs from its own source with its own `tsx`. Blobs go to a temp directory. Postgres is not used.
