# QuickPOS — agent guide

## Quick start
```sh
npm run dev      # Vite dev server (port 5173)
npm run build    # production build → dist/
npm run lint     # ESLint (flat config, eslint.config.js)
npm run preview  # serve dist/ locally
```

## Architecture
- **Single-file app**: all components (~1792 lines) in `QuickPOS.jsx`. `src/App.jsx` just re-exports it.
- **Entrypoint**: `index.html` → `src/main.jsx` (sets up `window.storage` with IndexedDB) → `QuickPOS.jsx`.
- **Persistence**: IndexedDB via `src/db.js` (simple key-value store, one `quickpos` DB with `kv` store). All state changes auto-save via `useEffect`.
- **No server**: `server/` directory has orphaned `node_modules` but no server code. The app is fully client-side.
- **No tests, no TypeScript, no routing library.**

## Key conventions
- All data is seeded on first load (products, customers, currencies, pricelists). Seeding happens in `QuickPOS.jsx` constants `SEED_*`.
- localStorage keys use pattern `pos:{key}{version}` (e.g. `pos:p2`, `pos:s2`), defined in the `KEYS` object.
- XLSX import/export available for all entities: products, customers, sales, purchases, currencies, pricelists, vendors.
- Currency conversion: base currency is the one with `isBase: true`. All other rates are relative to it.
- Pricelist formulas: `markup`, `margin`, `discount`, `fixed` rounding options: `nearest_05/10/50/1`, `psychological`.
- Stock adjustments use relative values (`+10` or `-3`).
- Purchase view uses the same two-panel catalog+cart layout as SellView, with vendor dropdown, cost prices, and receipt labeled "PURCHASE ORDER".
- The sidebar collapsible toggle str position changes dynamically based on sidebar state.

## Code style
- Plain `.jsx` (no TypeScript). Inline styles everywhere — no CSS modules or `styled-components`.
- CSS lives in a template literal `const CSS` at the top of `QuickPOS.jsx`.
- Utility helpers: `uid()` (ID gen), `fmt()` (price display), `fmtc()` (price + currency symbol), `fmtDate()`, `fmtTime()`.
- Modal patterns are inline: `{modal && <div className="modal-bg">...</div>}`.

## Gotchas
- `npm run lint` runs ESLint on the whole directory — not just `src/`.
- `server/` directory is dead weight (only `node_modules`). Do not add server-side code there.
- IndexedDB is per-origin; clearing browser data nukes all POS data.
- Data loads before rendering (loading spinner until all stores are loaded).
