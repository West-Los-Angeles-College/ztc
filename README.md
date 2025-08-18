# WLAC ZTC Website Package (with Save & Print)

This bundle contains the Zero Textbook Cost (ZTC) search + cart site for West Los Angeles College.
It includes Save (JSON), Print, Print/Save PDF, and CSV export actions.

## Files
- `index.html` — ZTC **Search** page. Loads `ztc_live.csv`, shows a table with **Add** buttons, a live cart badge, a Term selector, and auto-filter by Term.
- `ztc_index.html` — ZTC **Overview** page with the slide-out cart drawer and actions (**Copy**, **Save CSV**, **Save (JSON)**, **Print**, **Print / Save PDF**, **Clear**).
- `scripts.js` — Renders the table from `ztc_live.csv`, adds “Add” buttons, injects the selected **Term** into cart items, shows Term badges, and auto-filters by Term.
- `styles.css` — WLAC-branded styling (navy/gold) for tables, buttons, and cart UI.
- `ztc_live.csv` — Your current ZTC section list. Expected header order: `Course,Term,Section,Instructor,Units,Days,Time,Location`.
- `ztc_live_normalized.csv` — Same content with Title Case headers (for reference/testing).

## How to Run Locally
1. Put all files in the same folder.
2. Open `index.html` in a browser. (If CSV loading is blocked by your browser’s file security, run a local web server.)
   - Python 3: `python -m http.server 8000` then go to http://localhost:8000/
3. Use the Term selector, search, and **Add** buttons to build your cart.
4. Click **View Cart** (or open `ztc_index.html`) to **Save**, **Print**, **Print/Save PDF**, **Save CSV**, or **Copy**.

## Notes
- The cart is saved in `localStorage` under the key `wlacZtcCartV1` so it persists between pages.
- The **View Cart** button links to `index.html?viewCart=1`, which auto-opens the cart drawer.
- The **Term** column appears right after **Course** in both CSV and Print outputs.
- You can replace `ztc_live.csv` with your official export as long as headers match the expected order above.
