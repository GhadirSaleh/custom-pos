# QuickPOS — agent guide

## Quick start
```sh
npm run dev      # Vite dev server (port 5173)
npm run build    # production build → dist/
npm run lint     # ESLint (flat config, eslint.config.js)
npm run preview  # serve dist/ locally
```

## Architecture
- **Multi-file app**: state container in `src/App.jsx`, views in `src/components/`, utilities in `src/utils/`.
- **Entrypoint**: `index.html` → `src/main.jsx` (sets up `window.storage` with IndexedDB) → `src/App.jsx`.
- **Persistence**: IndexedDB via `src/db.js` (simple key-value store, one `quickpos` DB with `kv` store). All state changes auto-save via `useEffect` in `App.jsx`.
- **No server**: `server/` directory has orphaned `node_modules` but no server code. The app is fully client-side.
- **No tests, no TypeScript, no routing library.**

## File structure
```
src/
  App.jsx                    # State container — holds all useState, loading, auto-save
  db.js                      # IndexedDB wrapper
  main.jsx                   # Entry point, sets window.storage
  styles.js                  # CSS template literal
  utils/
    uid.js                   # ID generator
    format.js                # fmt, fmtc, fmtDate, fmtTime
    xlsx.js                  # exportXLSX, importXLSX
    pricing.js               # convertPrice, baseCur, applyFormula, roundPrice
    constants.js             # KEYS, seed data, CAT_ICONS, FORMULA_OPTIONS, etc.
  components/
    Layout.jsx               # Sidebar + main shell with view routing
    Numpad.jsx               # Numpad and CashNumpad components
    Dashboard.jsx            # Dashboard view with stats
    SellView.jsx             # Point-of-sale: catalog + cart + receipt
    PurchaseView.jsx         # Purchase order: catalog + cart + PO receipt
    InventoryView.jsx        # Product management, stock adjustments
    CustomersView.jsx        # Customer list + detail ledger
    VendorsView.jsx          # Vendor list
    HistoryView.jsx          # Sales history + reports
    CurrenciesView.jsx       # Currency management
    PricelistsView.jsx       # Pricelist management
```

## Key conventions
- All data is seeded on first load (products, customers, currencies, pricelists). Seeding happens in `src/utils/constants.js`.
- IndexedDB keys use pattern `pos:{key}{version}` (e.g. `pos:p2`, `pos:s2`), defined in the `KEYS` object in `src/utils/constants.js`.
- XLSX import/export available for all entities: products, customers, sales, purchases, currencies, pricelists, vendors.
- Currency conversion: base currency is the one with `isBase: true`. All other rates are relative to it.
- Pricelist formulas: `markup`, `margin`, `discount`, `fixed` rounding options: `nearest_05/10/50/1`, `psychological`.
- Stock adjustments use relative values (`+10` or `-3`).
- Purchase view uses the same two-panel catalog+cart layout as SellView, with vendor dropdown, cost prices, and receipt labeled "PURCHASE ORDER".
- The sidebar collapsible toggle position changes dynamically based on sidebar state.

## Code style
- Plain `.jsx` (no TypeScript). Inline styles everywhere — no CSS modules or `styled-components`.
- CSS lives in `src/styles.js` as a template literal.
- Utility helpers: `uid()` (ID gen), `fmt()` (price display), `fmtc()` (price + currency symbol), `fmtDate()`, `fmtTime()`.
- Modal patterns are inline: `{modal && <div className="modal-bg">...</div>}`.

## Gotchas
- `npm run lint` runs ESLint on the whole directory — not just `src/`.
- `server/` directory is dead weight (only `node_modules`). Do not add server-side code there.
- IndexedDB is per-origin; clearing browser data nukes all POS data.
- Data loads before rendering (loading spinner until all stores are loaded).
