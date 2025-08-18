# WLAC ZTC Site (with Dedicated Cart Page)

This bundle includes a new **cart.html** page that loads saved items from the browser (localStorage key: `wlacZtcCartV1`) and provides actions to Copy, Save CSV/JSON, Print/Save PDF, and Clear.

## Files
- **index.html** — Search page (links to `cart.html` via “View Cart”). Loads `ztc_live.csv` and lets students add items to the cart.
- **cart.html** — Dedicated cart page. Reads the same saved cart and shows it as a table (Course, Term, Section, Instructor, Units, Days, Time, Location).
- **ztc_index.html** — Promotional/overview page for ZTC with the slide-out cart (optional for your deployment).
- **scripts.js** — CSV render + Add-to-Cart logic shared by pages (uses `localStorage`).
- **ztc_live.csv** and **ztc_live_normalized.csv** — Data sources for the Search page (headers should be: `Course, Term, Section, Instructor, Units, Days, Time, Location`).

> Note: A standalone `styles.css` is optional. The pages include WLAC-branded inline styles.

## How it works
- The cart uses `localStorage` (`wlacZtcCartV1`), so saved items persist for the student on the same browser.
- `index.html` loads courses, shows “Add” buttons, and injects the selected **Term** into each saved item.
- Clicking **View Cart** sends students to `cart.html`, which renders their saved list and allows Save/Print.

## Local Testing
1. Put all files in one folder.
2. Open `index.html` in a modern browser.
3. Add a few rows to the cart, then click **View Cart** (goes to `cart.html`).

Optional quick server (Python 3):
```bash
python -m http.server 8000
# then browse http://localhost:8000/index.html
```

## Customization
- Update `ztc_live.csv` with your current schedule; keep the same header order.
- Adjust Term choices in `index.html` if needed.
- You can remove `ztc_index.html` if you only want Search + Cart pages.

GO WEST. GO FAR.
