# WLAC Zero Textbook Cost (ZTC) – Web Package

This bundle contains a student-friendly ZTC search page with a shared shopping cart.
It’s WLAC-branded (navy & gold), mobile-responsive, and requires **no backend**.

## Files

- **index.html** — ZTC **Search** page. Loads `ztc_live.csv`, renders a course table, and adds an **Add** button per row.
  - Header shows a live **Cart** badge, **Term** selector, quick links to **View Cart / Print**.
  - Uses the global cart (`localStorage` key: `wlacZtcCartV1`).

- **scripts.js** — Logic to:
  - Load `ztc_live.csv` (no-cache) and build the table
  - Provide **Add** buttons + Term badges
  - Inject the **selected Term** from the header into each cart item
  - Gracefully hydrate an already-rendered table if CSV is missing

- **styles.css** — Optional shared styles (if you prefer a separate stylesheet). Inline CSS already exists in `index.html`.

- **ztc_live.csv** — Your **current** live CSV of ZTC sections.
- **ztc_live_normalized.csv** — A copy with **Title Case headers** for convenience.

## CSV Format

Expected header order (Title Case recommended):
```
Course, Term, Section, Instructor, Units, Days, Time, Location
```
- The app is tolerant of UPPERCASE headers; values are trimmed client‑side.
- Add or remove rows at any time; refresh the page to see changes.

## Term Handling

- The **Term selector** in `index.html` (e.g., *Fall 2025*, *Spring 2026*) is attached to each item you add to the cart.
- Term appears **next to Course** in Print / Save PDF and is exported **after Course** in CSV.

## Cart Features (shared across pages)

- **Persisted** via `localStorage` (`wlacZtcCartV1`)
- **Copy All**, **Save CSV**, **Print / Save PDF**, **Clear Cart**
- Items added on the Search page will appear in the cart view (if you also use a cart drawer page).

## How to Run Locally

1. Place all files in the same folder.
2. Open `index.html` in a web browser.
   - If your browser blocks `fetch()` of local files, use a lightweight server:
     ```bash
     # Python 3
     python3 -m http.server 8080
     # Then visit http://localhost:8080
     ```

## Deployment

- Upload the folder to your web host as-is.
- Keep `ztc_live.csv` in the **same directory** as `index.html` so the loader can fetch it.

## Customization Tips

- **Branding:** adjust colors in `:root` variables in the CSS.
- **Term options:** edit the `<select id="termSelect">` in `index.html`.
- **Analytics:** add GA4 events to button clicks in `scripts.js` (e.g., Add, Print, Save CSV).

## Accessibility Notes

- Buttons have clear labels and keyboard focus states.
- Table has proper `<thead>`/`<tbody>` sections; on small screens it becomes a stacked layout.

---

GO WEST. GO FAR. — West Los Angeles College
