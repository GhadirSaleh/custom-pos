import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n) => { const v = (+(n || 0)).toFixed(2); return v.endsWith(".00") ? v.slice(0, -3) : v; };
const fmtc = (n, sym) => fmt(n) + " " + (sym || "$");
const fmtDate = (d) => new Date(d || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const KEYS = { p: "pos:p2", c: "pos:c2", s: "pos:s2", pu: "pos:pu2", t: "pos:t2", cr: "pos:cr2", pl: "pos:pl2" };

const SEED_PRODUCTS = [
  { id: uid(), name: "Coca Cola 500ml", sku: "CC001", cat: "Beverages", price: 2.5, cost: 1.2, stock: 100, unit: "pcs" },
  { id: uid(), name: "Bread Loaf", sku: "BR001", cat: "Bakery", price: 3.0, cost: 1.8, stock: 50, unit: "pcs" },
  { id: uid(), name: "Rice 1kg", sku: "RC001", cat: "Grains", price: 1.5, cost: 0.9, stock: 200, unit: "kg" },
  { id: uid(), name: "Milk 1L", sku: "MK001", cat: "Dairy", price: 1.8, cost: 1.1, stock: 80, unit: "L" },
  { id: uid(), name: "Orange Juice 1L", sku: "OJ001", cat: "Beverages", price: 2.0, cost: 1.2, stock: 60, unit: "L" },
  { id: uid(), name: "Eggs (12 pack)", sku: "EG001", cat: "Dairy", price: 4.5, cost: 3.0, stock: 40, unit: "box" },
  { id: uid(), name: "Sugar 1kg", sku: "SG001", cat: "Grains", price: 1.2, cost: 0.7, stock: 150, unit: "kg" },
  { id: uid(), name: "Mineral Water 1.5L", sku: "MW001", cat: "Beverages", price: 0.8, cost: 0.35, stock: 120, unit: "pcs" },
];
const SEED_CUSTOMERS = [
  { id: uid(), name: "John Smith", phone: "555-0101", email: "john@email.com", balance: 0, since: Date.now() },
  { id: uid(), name: "Maria Garcia", phone: "555-0102", email: "maria@email.com", balance: 25.0, since: Date.now() },
  { id: uid(), name: "Bob Johnson", phone: "555-0103", email: "bob@email.com", balance: 0, since: Date.now() },
];
const SEED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1, isBase: true },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
];
const SEED_PRICELISTS = [
  { id: uid(), name: "Standard", isDefault: true, pricingType: "manual", formula: null },
  { id: uid(), name: "Wholesale", isDefault: false, pricingType: "formula", formula: { type: "markup", value: 25, rounding: "nearest_05" } },
];

const CAT_ICONS = { Beverages: "🥤", Bakery: "🍞", Grains: "🌾", Dairy: "🥛", Meat: "🥩", Fruits: "🍎", Vegetables: "🥦", Snacks: "🍿", Other: "📦" };
const catIcon = (cat) => CAT_ICONS[cat] || "📦";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#f8fafc;color:#1e293b}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
input,select,textarea,button{font-family:'DM Sans',sans-serif}
.nav{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:12px;border:none;background:transparent;color:#64748b;font-size:15px;font-weight:500;width:100%;text-align:left;cursor:pointer;transition:all .13s;min-height:48px}
.nav:hover{background:#f1f5f9;color:#334155}
.nav.on{background:#e0f2fe;color:#0369a1}
.btn{padding:10px 22px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:all .13s;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;min-height:42px}
.btn-primary{background:#0284c7;color:#fff}.btn-primary:active{background:#0369a1}
.btn-success{background:#059669;color:#fff}.btn-success:active{background:#047857}
.btn-danger{background:#dc2626;color:#fff}.btn-danger:active{background:#b91c1c}
.btn-ghost{background:#ffffff;color:#475569;border:1px solid #cbd5e1}.btn-ghost:active{background:#f1f5f9;border-color:#94a3b8}
.btn-amber{background:#d97706;color:#fff}.btn-amber:active{background:#b45309}
.btn-sm{padding:7px 16px;font-size:13px;border-radius:8px;min-height:36px}
.inp{background:#ffffff;border:1.5px solid #cbd5e1;border-radius:10px;padding:12px 14px;color:#1e293b;font-size:15px;outline:none;width:100%;transition:border .13s;min-height:44px}
.inp:focus{border-color:#0284c7}
.sel{background:#ffffff;border:1.5px solid #cbd5e1;border-radius:10px;padding:12px 14px;color:#1e293b;font-size:15px;outline:none;width:100%;cursor:pointer;min-height:44px}
.sel:focus{border-color:#0284c7}
.card{background:#ffffff;border-radius:14px;padding:22px;border:1px solid #e2e8f0}
.stat{background:#ffffff;border-radius:14px;padding:22px;border:1px solid #e2e8f0}
.tag{display:inline-flex;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.03em}
.tag-red{background:#fef2f2;color:#dc2626}
.tag-green{background:#f0fdf4;color:#059669}
.tag-blue{background:#dbeafe;color:#0284c7}
.tag-amber{background:#fef9c3;color:#d97706}
.tag-slate{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
.tag-purple{background:#f3e8ff;color:#7c3aed}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;padding:12px 16px;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e2e8f0;white-space:nowrap}
td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#475569;vertical-align:middle}
tr:active td{background:#f8fafc}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:200;padding:24px}
.modal{background:#ffffff;border-radius:18px;padding:28px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,.1)}
.fg{margin-bottom:16px}
.fl{display:block;font-size:12px;color:#64748b;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.prod-card{background:#f8fafc;border-radius:8px;cursor:pointer;border:2px solid #e2e8f0;transition:all .13s;user-select:none;aspect-ratio:16/10;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:8px 12px}
.prod-card:hover{border-color:#0284c7;background:#f1f5f9}
.prod-card:active{border-color:#0284c7;background:#e0f2fe}
.prod-card.oos{opacity:.45;cursor:not-allowed;pointer-events:none}
.ptab{padding:10px 20px;border-radius:10px;border:1.5px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;transition:all .13s;min-height:42px}
.ptab.on{background:#e0f2fe;color:#0369a1;border-color:#0284c7}
.roverlay{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:300;padding:24px}
.receipt{background:#fff;color:#111;border-radius:8px;padding:30px 26px;width:100%;max-width:340px;font-family:'DM Mono',monospace;font-size:12.5px}
.alert-r{padding:12px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.alert-g{padding:12px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;background:#f0fdf4;color:#059669;border:1px solid #bbf7d0}
.ppage{flex:1;overflow:auto;padding:26px;display:flex;flex-direction:column;gap:20px}
`;

/* ─── XLSX UTILITIES ─────────────────────────────────────────────────────── */
function exportXLSX(data, headers, filename) {
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

function importXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        resolve(data);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* ─── CURRENCY UTILITY ───────────────────────────────────────────────────── */
function convertPrice(amount, targetCur, currencies) {
  const c = currencies.find((x) => x.code === targetCur);
  return c ? amount * c.rate : amount;
}
function baseCur(currencies) {
  return currencies.find((c) => c.isBase) || currencies[0];
}

/* ─── FORMULA UTILITY ────────────────────────────────────────────────────── */
function applyFormula(cost, basePrice, formula) {
  if (!formula || formula.type === "none") return basePrice;
  let price;
  switch (formula.type) {
    case "markup": price = cost * (1 + formula.value / 100); break;
    case "margin": price = cost / (1 - Math.min(formula.value, 99) / 100); break;
    case "discount": price = basePrice * (1 - formula.value / 100); break;
    case "fixed": price = cost + formula.value; break;
    default: price = basePrice;
  }
  return roundPrice(price, formula.rounding);
}

function roundPrice(price, method) {
  switch (method) {
    case "nearest_05": return Math.round((price) * 20) / 20;
    case "nearest_10": return Math.round((price) * 10) / 10;
    case "nearest_50": return Math.round((price) * 2) / 2;
    case "nearest_1": return Math.round(price);
    case "psychological": return Math.floor(price) + 0.99;
    default: return price;
  }
}

/* ─── NUMBAD COMPONENT ───────────────────────────────────────────────────── */
const NUM_KEYS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ["⌫", 0, "."],
];

function Numpad({ target, onConfirm, onCancel }) {
  const [qtyStr, setQtyStr] = useState(target?.qty != null ? String(target.qty) : "1");
  const isDefault = useRef(target?.qty == null);

  const press = (k) => {
    if (typeof k === "number") {
      setQtyStr((prev) => {
        const next = isDefault.current ? String(k) : prev + k;
        isDefault.current = false;
        return next;
      });
    } else if (k === "⌫") {
      setQtyStr((prev) => {
        const next = prev.length > 1 ? prev.slice(0, -1) : "1";
        if (next === "1") isDefault.current = true;
        return next;
      });
    } else if (k === ".") {
      setQtyStr((prev) => {
        if (prev.includes(".")) return prev;
        return prev + ".";
      });
      isDefault.current = false;
    }
  };

  const qty = parseFloat(qtyStr) || 0;
  const max = target?.product?.stock ?? 9999;
  const displayQty = qty > max ? max : qtyStr;

  return (
    <div className="roverlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 300, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{target?.product?.name}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Stock: {target?.product?.stock} {target?.product?.unit}</div>
        <div style={{
          background: "#f8fafc", borderRadius: 10, padding: "10px 16px", textAlign: "right",
          fontSize: 28, fontWeight: 700, color: "#0284c7", fontFamily: "'DM Mono',monospace", marginBottom: 14,
          letterSpacing: 2, minHeight: 48
        }}>
          {displayQty}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NUM_KEYS.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 6 }}>
              {row.map((k) => (
                <button key={k} onClick={() => press(k)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 9, border: "none",
                  background: k === "⌫" ? "#fee2e2" : "#f1f5f9",
                  color: k === "⌫" ? "#991b1b" : "#1e293b",
                  fontSize: 18, fontWeight: 700, cursor: "pointer"
                }}>{k}</button>
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => onConfirm(Math.min(qty, max))} style={{
          width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 9, border: "none",
          background: "#0284c7", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"
        }}>Add to Cart</button>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CashNumpad({ total, cur, onConfirm, onCancel }) {
  const [cash, setCash] = useState("");
  const isDefault = useRef(true);

  const press = (k) => {
    if (typeof k === "number") {
      setCash((prev) => {
        const next = isDefault.current ? String(k) : prev + k;
        isDefault.current = false;
        return next;
      });
    } else if (k === ".") {
      setCash((prev) => {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : prev + ".";
      });
      isDefault.current = false;
    } else if (k === "back") {
      setCash((prev) => {
        const next = prev.slice(0, -1);
        if (next === "") isDefault.current = true;
        return next;
      });
    } else if (k === "exact") {
      setCash(String(total));
      isDefault.current = false;
    }
  };

  const cashNums = [[1, 2, 3], [4, 5, 6], [7, 8, 9], ["back", 0, "."]];

  return (
    <div className="roverlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 320, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Cash Received</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Total due: <strong style={{ color: "#0284c7" }}>{fmtc(total, cur.symbol)}</strong></div>
        <div style={{
          background: "#f8fafc", borderRadius: 10, padding: "10px 16px", textAlign: "right",
          fontSize: 28, fontWeight: 700, color: cash && +cash >= total ? "#059669" : "#0284c7",
          fontFamily: "'DM Mono',monospace", marginBottom: 14, letterSpacing: 2, minHeight: 48
        }}>
          {cash || "0"}
        </div>
        {cash && +cash >= total && <div style={{ fontSize: 13, color: "#059669", marginBottom: 10, fontWeight: 600 }}>Change: {fmtc(+cash - total, cur.symbol)}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {cashNums.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 6 }}>
              {row.map((k) => (
                <button key={k} onClick={() => press(k)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 9, border: "1px solid #e2e8f0",
                  background: k === "back" ? "#fee2e2" : "#f1f5f9",
                  color: k === "back" ? "#991b1b" : "#1e293b",
                  fontSize: 18, fontWeight: 700, cursor: "pointer"
                }}>{k === "back" ? "⌫" : k}</button>
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => press("exact")} style={{
          width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 9, border: "1px solid #e2e8f0",
          background: "#fef3c7", color: "#92400e", fontSize: 14, fontWeight: 700, cursor: "pointer"
        }}>Exact: {fmtc(total, cur.symbol)}</button>
        <button onClick={() => onConfirm(cash)} style={{
          width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 9, border: "none",
          background: "#0284c7", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"
        }}>Confirm</button>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [sales, setSales] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [txns, setTxns] = useState(null);
  const [currencies, setCurrencies] = useState(null);
  const [pricelists, setPricelists] = useState(null);

  useEffect(() => {
    const load = async () => {
      const get = async (key, fb) => {
        try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fb; } catch { return fb; }
      };
      setProducts(await get(KEYS.p, SEED_PRODUCTS));
      setCustomers(await get(KEYS.c, SEED_CUSTOMERS));
      setSales(await get(KEYS.s, []));
      setPurchases(await get(KEYS.pu, []));
      setTxns(await get(KEYS.t, []));
      setCurrencies(await get(KEYS.cr, SEED_CURRENCIES));
      setPricelists(await get(KEYS.pl, SEED_PRICELISTS));
    };
    load();
  }, []);

  useEffect(() => { if (products) window.storage.set(KEYS.p, JSON.stringify(products)).catch(() => {}); }, [products]);
  useEffect(() => { if (customers) window.storage.set(KEYS.c, JSON.stringify(customers)).catch(() => {}); }, [customers]);
  useEffect(() => { if (sales) window.storage.set(KEYS.s, JSON.stringify(sales)).catch(() => {}); }, [sales]);
  useEffect(() => { if (purchases) window.storage.set(KEYS.pu, JSON.stringify(purchases)).catch(() => {}); }, [purchases]);
  useEffect(() => { if (txns) window.storage.set(KEYS.t, JSON.stringify(txns)).catch(() => {}); }, [txns]);
  useEffect(() => { if (currencies) window.storage.set(KEYS.cr, JSON.stringify(currencies)).catch(() => {}); }, [currencies]);
  useEffect(() => { if (pricelists) window.storage.set(KEYS.pl, JSON.stringify(pricelists)).catch(() => {}); }, [pricelists]);

  if (!products || !customers || !sales || !purchases || !txns || !currencies || !pricelists)
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc", color: "#64748b", fontFamily: "sans-serif", fontSize: 16, gap: 12 }}>
      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Loading QuickPOS...
    </div>;

  const ctx = { products, setProducts, customers, setCustomers, sales, setSales, purchases, setPurchases, txns, setTxns, currencies, setCurrencies, pricelists, setPricelists, setView };
  const NAV = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "sell", icon: "🛒", label: "Sell" },
    { id: "inventory", icon: "📦", label: "Inventory" },
    { id: "purchase", icon: "🛍️", label: "Purchase" },
    { id: "customers", icon: "👥", label: "Customers" },
    { id: "history", icon: "📋", label: "History" },
    { id: "currencies", icon: "💱", label: "Currencies" },
    { id: "pricelists", icon: "🏷️", label: "Pricelists" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc", color: "#1e293b", overflow: "hidden" }}>
      <style>{CSS}</style>
      <aside style={{ width: sidebarOpen ? 220 : 0, background: "#ffffff", borderRight: sidebarOpen ? "1px solid #e2e8f0" : "none", padding: sidebarOpen ? "18px 12px" : "0 0", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, overflow: "hidden", transition: "all .2s ease", whiteSpace: "nowrap" }}>
        <div style={{ padding: "12px 16px 20px", borderBottom: "1px solid #e2e8f0", marginBottom: 8 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#0f172a", letterSpacing: "-.02em" }}>⚡ QuickPOS</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Point of Sale System</div>
        </div>
        {NAV.map((n) => (
          <button key={n.id} className={`nav ${view === n.id ? "on" : ""}`} onClick={() => setView(n.id)}>
            <span style={{ fontSize: 18 }}>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "14px 16px", borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#94a3b8" }}>
          v1.0 · All data saved locally
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          position: "absolute", top: 14, left: sidebarOpen ? 228 : 8, zIndex: 100,
          width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0",
          background: "#ffffff", color: "#1e293b", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "left .2s ease", boxShadow: "0 1px 3px rgba(0,0,0,.1)"
        }}>☰</button>
        {view === "dashboard" && <Dashboard {...ctx} />}
        {view === "sell" && <SellView {...ctx} />}
        {view === "inventory" && <InventoryView {...ctx} />}
        {view === "purchase" && <PurchaseView {...ctx} />}
        {view === "customers" && <CustomersView {...ctx} />}
        {view === "history" && <HistoryView {...ctx} />}
        {view === "currencies" && <CurrenciesView {...ctx} />}
        {view === "pricelists" && <PricelistsView {...ctx} />}
      </main>
    </div>
  );
}

/* ─── CURRENCIES VIEW ────────────────────────────────────────────────────── */
function CurrenciesView({ currencies, setCurrencies }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => {
    setForm({ code: "", symbol: "", name: "", rate: "" });
    setModal("add");
  };
  const openEdit = (c) => { setForm({ ...c }); setModal(c.code); };
  const save = () => {
    if (!form.code || !form.rate) return;
    const entry = { code: form.code.toUpperCase(), symbol: form.symbol || form.code, name: form.name || form.code, rate: +form.rate, isBase: form.isBase || false };
    if (modal === "add") {
      if (currencies.find((c) => c.code === entry.code)) return;
      setCurrencies((cs) => [...cs, entry]);
    } else {
      setCurrencies((cs) => cs.map((c) => c.code === modal ? entry : c));
    }
    setModal(null);
  };
  const del = (code) => {
    const c = currencies.find((x) => x.code === code);
    if (c?.isBase) return;
    if (confirm(`Delete ${code}?`)) setCurrencies((cs) => cs.filter((x) => x.code !== code));
  };
  const setBase = (code) => {
    setCurrencies((cs) => cs.map((c) => ({ ...c, isBase: c.code === code })));
  };
  const F = (k) => ({ value: form[k] ?? "", onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });
  const base = baseCur(currencies);
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);

  const exportCurrencies = () => {
    const data = currencies.map((c) => ({ Code: c.code, Symbol: c.symbol, Name: c.name, Rate: c.rate, Base: c.isBase ? "Yes" : "No" }));
    exportXLSX(data, ["Code", "Symbol", "Name", "Rate", "Base"], "currencies.xlsx");
  };
  const importCurrencies = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importXLSX(file);
      let added = 0;
      setCurrencies((cs) => {
        const next = [...cs];
        rows.forEach((r) => {
          const code = (r.Code || r.code || "").toUpperCase();
          if (!code) return;
          const idx = next.findIndex((c) => c.code === code);
          if (idx >= 0) {
            next[idx] = { ...next[idx], symbol: r.Symbol || r.symbol || next[idx].symbol, name: r.Name || r.name || next[idx].name, rate: +(r.Rate || r.rate || next[idx].rate) };
          } else {
            next.push({ code, symbol: r.Symbol || r.symbol || code, name: r.Name || r.name || code, rate: +(r.Rate || r.rate || 1), isBase: false });
            added++;
          }
        });
        return next;
      });
      setImportMsg({ type: "success", text: `✅ Imported ${added} currencies` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>💱 Currencies</div><div style={{ fontSize: 13, color: "#64748b" }}>Base currency: <strong style={{ color: "#0284c7" }}>{base.code} ({base.symbol})</strong></div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importCurrencies} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={exportCurrencies}>📤 Export</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Currency</button>
        </div>
      </div>
      {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"}>{importMsg.text}</div>}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Code</th><th>Symbol</th><th>Name</th><th>Rate (per {base.code})</th><th>Base</th><th>Actions</th></tr></thead>
          <tbody>
            {currencies.map((c) => (
              <tr key={c.code}>
                <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>{c.code}</td>
                <td style={{ fontSize: 18 }}>{c.symbol}</td>
                <td>{c.name}</td>
                <td style={{ color: "#0284c7", fontWeight: 700 }}>{c.rate}</td>
                <td>{c.isBase ? <span className="tag tag-green">BASE</span> : <button className="btn btn-ghost btn-sm" onClick={() => setBase(c.code)}>Set as base</button>}</td>
                <td>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    {!c.isBase && <button className="btn btn-danger btn-sm" onClick={() => del(c.code)}>Del</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>{modal === "add" ? "➕ Add Currency" : "✏️ Edit Currency"}</div>
            <div className="fg"><label className="fl">Currency Code *</label><input className="inp" placeholder="e.g. USD" maxLength={3} style={{ textTransform: "uppercase" }} {...F("code")} disabled={modal !== "add"} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="fg"><label className="fl">Symbol</label><input className="inp" placeholder="e.g. $" {...F("symbol")} /></div>
              <div className="fg"><label className="fl">Name</label><input className="inp" placeholder="e.g. US Dollar" {...F("name")} /></div>
            </div>
            <div className="fg"><label className="fl">Exchange Rate * (per {base.code})</label><input className="inp" type="number" step="0.0001" placeholder="1.0" {...F("rate")} /></div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, background: "#f8fafc", borderRadius: 8, padding: 10 }}>
              Rate = how much 1 {base.code} is worth in this currency. For {base.code} the rate is 1.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save}>Save</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PRICELISTS VIEW ────────────────────────────────────────────────────── */
function PricelistsView({ pricelists, setPricelists, products, setProducts, currencies }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const defPL = pricelists.find((p) => p.isDefault) || pricelists[0];
  const otherPLs = pricelists.filter((p) => !p.isDefault);
  const base = baseCur(currencies);
  const F = (k) => ({ value: form[k] ?? "", onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);

  const exportPricelists = () => {
    const rows = [];
    pricelists.forEach((pl) => {
      if (pl.isDefault) {
        rows.push({ Pricelist: pl.name, Default: "Yes", "Pricing Type": "manual", "Formula Type": "", "Formula Value": "", Rounding: "", "Product SKU": "", "Override Price": "" });
      } else if (pl.pricingType === "formula") {
        rows.push({ Pricelist: pl.name, Default: "No", "Pricing Type": "formula", "Formula Type": pl.formula?.type || "", "Formula Value": pl.formula?.value ?? "", Rounding: pl.formula?.rounding || "", "Product SKU": "", "Override Price": "" });
      } else {
        products.forEach((p) => {
          rows.push({ Pricelist: pl.name, Default: "No", "Pricing Type": "manual", "Formula Type": "", "Formula Value": "", Rounding: "", "Product SKU": p.sku, "Override Price": p.prices?.[pl.id] ?? "" });
        });
      }
    });
    exportXLSX(rows, ["Pricelist", "Default", "Pricing Type", "Formula Type", "Formula Value", "Rounding", "Product SKU", "Override Price"], "pricelists.xlsx");
  };

  const importPricelists = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importXLSX(file);
      const pls = {};
      rows.forEach((r) => {
        const name = (r.Pricelist || r.pricelist || "").trim();
        if (!name) return;
        if (!pls[name]) pls[name] = { isDefault: (r.Default || "").toString().toLowerCase() === "yes", pricingType: (r["Pricing Type"] || r.pricingType || "manual").toLowerCase(), formula: null, prices: [] };
        if (r["Formula Type"]) pls[name].formula = { type: r["Formula Type"], value: +(r["Formula Value"] || 0), rounding: r.Rounding || r.rounding || "none" };
        const sku = (r["Product SKU"] || r.sku || "").trim();
        if (sku && r["Override Price"] !== undefined && r["Override Price"] !== "") {
          pls[name].prices.push({ sku, price: +r["Override Price"] });
        }
      });
      let added = 0;
      setPricelists((ps) => {
        const next = [...ps];
        Object.entries(pls).forEach(([name, cfg]) => {
          if (!next.find((p) => p.name === name)) {
            next.push({ id: uid(), name, isDefault: next.length === 0 ? true : cfg.isDefault, pricingType: cfg.pricingType, formula: cfg.formula });
            added++;
          }
        });
        return next;
      });
      setProducts((ps) => {
        const next = [...ps];
        Object.values(pls).forEach((cfg) => {
          cfg.prices.forEach(({ sku, price }) => {
            const idx = next.findIndex((p) => p.sku === sku);
            if (idx >= 0) next[idx] = { ...next[idx], prices: { ...(next[idx].prices || {}), [cfg.pricelistId || ""]: price } };
          });
        });
        return next;
      });
      setImportMsg({ type: "success", text: `✅ Imported ${added} pricelists` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  const openAdd = () => { setForm({ name: "", pricingType: "manual", formula: { type: "markup", value: 25, rounding: "nearest_05" } }); setModal("add"); };
  const openEdit = (pl) => { setForm({ name: pl.name, pricingType: pl.pricingType || "manual", formula: pl.formula ? { ...pl.formula } : { type: "markup", value: 25, rounding: "nearest_05" } }); setModal(pl.id); };
  const save = () => {
    if (!form.name.trim()) return;
    if (modal === "add") {
      setPricelists((ps) => [...ps, { id: uid(), name: form.name.trim(), isDefault: false, pricingType: form.pricingType || "manual", formula: form.pricingType === "formula" ? { ...form.formula } : null }]);
      setProducts((ps) => ps.map((p) => ({ ...p, prices: { ...(p.prices || {}) } })));
    } else {
      setPricelists((ps) => ps.map((p) => p.id === modal ? { ...p, name: form.name.trim(), pricingType: form.pricingType || "manual", formula: form.pricingType === "formula" ? { ...form.formula } : null } : p));
    }
    setModal(null);
  };

  const FORMULA_OPTIONS = [
    { value: "markup", label: "Markup on Cost" },
    { value: "margin", label: "Margin on Cost" },
    { value: "discount", label: "Discount off Base" },
    { value: "fixed", label: "Fixed on Cost" },
  ];
  const ROUNDING_OPTIONS = [
    { value: "none", label: "No rounding" },
    { value: "nearest_05", label: "Nearest $0.05" },
    { value: "nearest_10", label: "Nearest $0.10" },
    { value: "nearest_50", label: "Nearest $0.50" },
    { value: "nearest_1", label: "Nearest $1.00" },
    { value: "psychological", label: "Psychological ($X.99)" },
  ];
  const [editTab, setEditTab] = useState("formula");
  const del = (id) => {
    if (!confirm("Delete this pricelist?")) return;
    setPricelists((ps) => ps.filter((p) => p.id !== id));
    setProducts((ps) => ps.map((p) => { if (!p.prices) return p; const { [id]: _, ...rest } = p.prices; return { ...p, prices: rest }; }));
  };

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>🏷️ Pricelists</div><div style={{ fontSize: 13, color: "#64748b" }}>{pricelists.length} pricelists · {otherPLs.length > 0 ? `${products.length} products with override prices` : "Add pricelists to create pricing tiers"}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importPricelists} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={exportPricelists}>📤 Export</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Pricelist</button>
        </div>
      </div>
      {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"}>{importMsg.text}</div>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Name</th><th>Pricing</th><th>Default</th><th>Actions</th></tr></thead>
          <tbody>
            {pricelists.map((pl) => (
              <tr key={pl.id}>
                <td style={{ fontWeight: 600 }}>{pl.name}</td>
                <td>{pl.isDefault ? <span className="tag tag-slate">Base price</span> : pl.pricingType === "formula" ? <span className="tag tag-purple">Formula</span> : <span className="tag tag-blue">Manual</span>}</td>
                <td>{pl.isDefault ? <span className="tag tag-green">BASE</span> : <button className="btn btn-ghost btn-sm" onClick={() => setPricelists((ps) => ps.map((p) => ({ ...p, isDefault: p.id === pl.id })))}>Set as default</button>}</td>
                <td>
                  <div style={{ display: "flex", gap: 5 }}>
                    {!pl.isDefault && <button className="btn btn-ghost btn-sm" onClick={() => openEdit(pl)}>Edit</button>}
                    {!pl.isDefault && <button className="btn btn-danger btn-sm" onClick={() => del(pl.id)}>Del</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && modal !== "add" && (() => { const editing = pricelists.find((p) => p.id === modal); if (!editing) return null; return (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>✏️ Edit Pricelist</div>
            <div className="fg"><label className="fl">Pricelist Name</label><input className="inp" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div style={{ marginBottom: 16 }}>
              <div className="fl">Pricing Method</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className={`ptab ${form.pricingType === "formula" ? "on" : ""}`} onClick={() => setForm((f) => ({ ...f, pricingType: "formula" }))}>🧮 Formula</button>
                <button className={`ptab ${form.pricingType === "manual" ? "on" : ""}`} onClick={() => setForm((f) => ({ ...f, pricingType: "manual" }))}>✏️ Manual</button>
              </div>
            </div>
            {form.pricingType === "formula" ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="fg"><label className="fl">Formula Type</label>
                    <select className="sel" value={form.formula?.type || "markup"} onChange={(e) => setForm((f) => ({ ...f, formula: { ...f.formula, type: e.target.value } }))}>
                      {FORMULA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label className="fl">Value</label>
                    <input className="inp" type="number" min={0} step="0.01" placeholder="25" value={form.formula?.value ?? ""} onChange={(e) => setForm((f) => ({ ...f, formula: { ...f.formula, value: +e.target.value } }))} />
                  </div>
                </div>
                <div className="fg"><label className="fl">Rounding</label>
                  <select className="sel" value={form.formula?.rounding || "none"} onChange={(e) => setForm((f) => ({ ...f, formula: { ...f.formula, rounding: e.target.value } }))}>
                    {ROUNDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {form.formula?.type && <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Preview (first 5 products)</div>
                  {products.slice(0, 5).map((p) => {
                    const fp = applyFormula(p.cost, p.price, form.formula);
                    return (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                        <span style={{ color: "#475569" }}>{p.name}</span>
                        <span><span style={{ color: "#64748b" }}>cost {base.symbol}{fmt(p.cost)}</span> → <strong style={{ color: "#059669" }}>{base.symbol}{fmt(fp)}</strong></span>
                      </div>
                    );
                  })}
                </div>}
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflow: "auto" }}>
                {products.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ flex: 1, fontSize: 12, color: "#1e293b" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", minWidth: 50, textAlign: "right" }}>{base.symbol}{fmt(p.price)}</div>
                    <input type="number" step="0.01" min={0} placeholder={fmt(p.price)}
                      value={p.prices?.[modal] ?? ""}
                      onChange={(e) => setProducts((ps) => ps.map((x) => x.id === p.id ? { ...x, prices: { ...(x.prices || {}), [modal]: e.target.value === "" ? undefined : +e.target.value } } : x))}
                      style={{ width: 85, padding: "5px 7px", borderRadius: 6, border: "1.5px solid #cbd5e1", background: "#ffffff", color: "#1e293b", fontSize: 12, outline: "none", textAlign: "right" }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save}>Save</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )})()}

      {modal === "add" && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>➕ Add Pricelist</div>
            <div className="fg"><label className="fl">Pricelist Name *</label><input className="inp" placeholder="e.g. Wholesale" {...F("name")} autoFocus /></div>
            <div className="fg"><label className="fl">Pricing Method</label>
              <select className="sel" value={form.pricingType || "manual"} onChange={(e) => setForm((f) => ({ ...f, pricingType: e.target.value }))}>
                <option value="manual">✏️ Manual (set prices per product)</option>
                <option value="formula">🧮 Formula (calculate from cost)</option>
              </select>
            </div>
            {form.pricingType === "formula" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="fg"><label className="fl">Formula Type</label>
                    <select className="sel" value={form.formula?.type || "markup"} onChange={(e) => setForm((f) => ({ ...f, formula: { ...f.formula, type: e.target.value } }))}>
                      {FORMULA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label className="fl">Value</label>
                    <input className="inp" type="number" min={0} step="0.01" placeholder="25" value={form.formula?.value ?? ""} onChange={(e) => setForm((f) => ({ ...f, formula: { ...f.formula, value: +e.target.value } }))} />
                  </div>
                </div>
                <div className="fg"><label className="fl">Rounding</label>
                  <select className="sel" value={form.formula?.rounding || "none"} onChange={(e) => setForm((f) => ({ ...f, formula: { ...f.formula, rounding: e.target.value } }))}>
                    {ROUNDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save}>Save</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DASHBOARD ─────────────────────────────────────────────────────────── */
function Dashboard({ products, customers, sales, setView, currencies }) {
  const base = baseCur(currencies);
  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.date).toDateString() === today);
  const todayRev = todaySales.reduce((a, s) => a + s.total, 0);
  const totalRev = sales.reduce((a, s) => a + s.total, 0);
  const stockVal = products.reduce((a, p) => a + p.cost * p.stock, 0);
  const totalDebt = customers.reduce((a, c) => a + (c.balance || 0), 0);
  const lowStock = products.filter((p) => p.stock <= 5);
  const recent = [...sales].sort((a, b) => b.date - a.date).slice(0, 7);
  const profit = sales.reduce((a, s) => {
    return a + s.items.reduce((b, i) => {
      const p = products.find((x) => x.id === i.id);
      return b + (i.price - (p?.cost || 0)) * i.qty;
    }, 0);
  }, 0);

  const stats = [
    { label: "Today's Revenue", val: `${fmt(todayRev)} ${base.symbol}`, sub: `${todaySales.length} sales today`, c: "#0284c7", icon: "💰" },
    { label: "Total Revenue", val: `${fmt(totalRev)} ${base.symbol}`, sub: `${sales.length} all-time sales`, c: "#059669", icon: "📈" },
    { label: "Est. Profit", val: `${fmt(profit)} ${base.symbol}`, sub: "Revenue minus cost", c: "#7c3aed", icon: "✨" },
    { label: "Stock Value", val: `${fmt(stockVal)} ${base.symbol}`, sub: `${products.length} products`, c: "#fb923c", icon: "📦" },
    { label: "Customer Debt", val: `${fmt(totalDebt)} ${base.symbol}`, sub: `${customers.filter((c) => c.balance > 0).length} with balance`, c: "#dc2626", icon: "💳" },
    { label: "Low Stock Items", val: lowStock.length, sub: lowStock.length ? "Need restocking" : "All stocked well", c: lowStock.length ? "#d97706" : "#059669", icon: "⚠️" },
  ];

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Dashboard</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setView("sell")}>🛒 New Sale</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#0f172a" }}>Recent Sales</div>
          {recent.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No sales yet — go make your first sale!</div>
          ) : recent.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{s.customerName || "Walk-in"}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(s.date)} · {fmtTime(s.date)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{fmt(s.total)} {base.symbol}</div>
                {s.credit > 0 && <span className="tag tag-red" style={{ fontSize: 10 }}>+{fmt(s.credit)} {base.symbol} debt</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#0f172a" }}>⚠️ Low Stock</div>
          {lowStock.length === 0 ? (
            <div style={{ color: "#059669", fontSize: 13, textAlign: "center", padding: "24px 0" }}>✅ All items well stocked</div>
          ) : lowStock.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontSize: 13, color: "#1e293b" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{p.sku}</div>
              </div>
              <span className={`tag ${p.stock === 0 ? "tag-red" : "tag-amber"}`}>{p.stock} {p.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SELL VIEW ─────────────────────────────────────────────────────────── */
function SellView({ products, setProducts, customers, setCustomers, sales, setSales, txns, setTxns, currencies, pricelists }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [customerId, setCustomerId] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [cashPaid, setCashPaid] = useState("");
  const [partialCash, setPartialCash] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState("");
  const [numpadTarget, setNumpadTarget] = useState(null);
  const [cashNumpadOpen, setCashNumpadOpen] = useState(false);
  const [splitNumpadOpen, setSplitNumpadOpen] = useState(false);
  const [saleCurrency, setSaleCurrency] = useState(baseCur(currencies)?.code || "USD");
  const defPL = pricelists.find((p) => p.isDefault) || pricelists[0];
  const [salePricelist, setSalePricelist] = useState(defPL?.id || null);
  const cur = currencies.find((c) => c.code === saleCurrency) || currencies[0];
  const base = baseCur(currencies);
  const conv = (amt) => convertPrice(amt, saleCurrency, currencies);
  const fmtCur = (n) => fmtc(conv(n), cur.symbol);
  const resolvePrice = (product) => {
    if (!salePricelist || salePricelist === defPL?.id) return product.price;
    const pl = pricelists.find((p) => p.id === salePricelist);
    if (pl?.pricingType === "formula" && pl.formula) return applyFormula(product.cost, product.price, pl.formula);
    if (product.prices?.[salePricelist] !== undefined && product.prices[salePricelist] !== null) return product.prices[salePricelist];
    return product.price;
  };

  const cats = ["All", ...Array.from(new Set(products.map((p) => p.cat)))];
  const filtered = products.filter((p) =>
    (catFilter === "All" || p.cat === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (p) => {
    if (p.stock === 0) return;
    const rp = resolvePrice(p);
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) { if (ex.qty >= p.stock) return c; return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i); }
      return [...c, { ...p, qty: 1, price: rp }];
    });
  };
  const updateQty = (id, qty) => {
    if (qty <= 0) { setCart((c) => c.filter((i) => i.id !== id)); return; }
    const p = products.find((x) => x.id === id);
    if (qty > p.stock) return;
    setCart((c) => c.map((i) => i.id === id ? { ...i, qty } : i));
  };
  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const total = subtotal;
  const customer = customers.find((c) => c.id === customerId);

  const completeSale = () => {
    setErr("");
    if (cart.length === 0) { setErr("Cart is empty"); return; }
    let paid = 0, credit = 0, change = 0;
    if (payMode === "cash") {
      paid = +(cashPaid) || 0;
      if (paid < total) { setErr(`Cash amount (${fmtCur(paid)}) is less than total (${fmtCur(total)})`); return; }
      change = paid - total; paid = total;
    } else if (payMode === "account") {
      if (!customer) { setErr("Select a customer for account credit"); return; }
      credit = total;
    } else {
      if (!customer) { setErr("Select a customer for split payment"); return; }
      paid = Math.min(+(partialCash) || 0, total);
      credit = total - paid;
    }
    const saleId = uid(), now = Date.now();
    setProducts((ps) => ps.map((p) => { const item = cart.find((i) => i.id === p.id); return item ? { ...p, stock: p.stock - item.qty } : p; }));
    if (credit > 0 && customer) {
      setCustomers((cs) => cs.map((c) => c.id === customerId ? { ...c, balance: (c.balance || 0) + credit } : c));
      setTxns((ts) => [...ts, { id: uid(), date: now, customerId, customerName: customer.name, type: "debit", amount: credit, note: `Sale #${saleId.slice(-6).toUpperCase()}`, refId: saleId }]);
    }
    const newSale = { id: saleId, date: now, customerId: customerId || null, customerName: customer?.name || "Walk-in", items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, total: i.price * i.qty })), subtotal, total, paid, credit, change, payMode, currency: saleCurrency, currencyRate: cur.rate, currencySymbol: cur.symbol, pricelistId: salePricelist };
    setSales((s) => [...s, newSale]);
    setReceipt(newSale);
    setCart([]); setCashPaid(""); setPartialCash(""); setCustomerId(""); setPayMode("cash"); setSaleCurrency(baseCur(currencies)?.code || "USD"); setSalePricelist(defPL?.id || null);
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Products Panel */}
      <div style={{ flex: 1, padding: "18px 18px 18px 60px", overflow: "auto", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 16 }}>🔍</span>
            <input className="inp" style={{ paddingLeft: 34 }} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" style={{ width: "auto", minWidth: 100 }} value={saleCurrency} onChange={(e) => setSaleCurrency(e.target.value)}>
            {currencies.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
          </select>
          <select className="sel" style={{ width: "auto", minWidth: 100 }} value={salePricelist || ""} onChange={(e) => setSalePricelist(e.target.value || null)}>
            {pricelists.map((pl) => <option key={pl.id} value={pl.id}>{pl.isDefault ? "⭐" : ""} {pl.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "10px 20px", borderRadius: 24, border: "2px solid", borderColor: catFilter === c ? "#0284c7" : "#475569", background: catFilter === c ? "#e0f2fe" : "transparent", color: catFilter === c ? "#0369a1" : "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 42 }}>
              {catIcon(c)} {c}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
          {filtered.map((p) => (
            <div key={p.id} className={`prod-card ${p.stock === 0 ? "oos" : ""}`} onClick={() => { if (p.stock > 0) setNumpadTarget({ product: p, mode: "add" }); }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, textAlign: "center", marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0284c7" }}>{fmtCur(resolvePrice(p))}</div>
              <div style={{ fontSize: 11, color: p.stock <= 5 ? "#d97706" : "#475569", marginTop: 2 }}>
                {p.stock === 0 ? "Out of stock" : `${p.stock} ${p.unit}`}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#475569", padding: "30px 0", fontSize: 13 }}>No products found</div>}
        </div>
      </div>

      {/* Cart Panel */}
      <div style={{ width: 340, display: "flex", flexDirection: "column", padding: "18px 16px 16px 60px", gap: 12, background: "#f8fafc", overflow: "hidden" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🛒 Cart {cart.length > 0 && `(${cart.length})`}</span>
          {cart.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>Clear</button>}
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", paddingTop: 40, fontSize: 13 }}>Tap products to add</div>
          ) : cart.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#0284c7" }}>{fmtCur(item.price)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, minWidth: 28, textAlign: "center", cursor: "pointer", color: "#0284c7" }} onClick={() => setNumpadTarget({ product: item, mode: "edit", qty: item.qty })}>{item.qty}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#059669", minWidth: 52, textAlign: "right" }}>{fmtCur(item.price * item.qty)}</div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#0284c7", paddingTop: 10, marginTop: 6 }}><span>TOTAL ({cur.code})</span><span>{fmtCur(total)}</span></div>
        </div>

        {/* Customer */}
        <div>
          <div className="fl">Customer</div>
          <select className="sel" value={customerId} onChange={(e) => { const cId = e.target.value; setCustomerId(cId); const c = customers.find((x) => x.id === cId); if (c?.pricelistId) setSalePricelist(c.pricelistId); }}>
            <option value="">Walk-in</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.balance > 0 ? ` (owes ${fmt(c.balance)} ${base.symbol})` : ""}</option>)}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <div className="fl">Payment Method</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={`ptab ${payMode === "cash" ? "on" : ""}`} onClick={() => setPayMode("cash")}>💵 Cash</button>
            <button className={`ptab ${payMode === "account" ? "on" : ""}`} onClick={() => setPayMode("account")}>📋 Debit</button>
            <button className={`ptab ${payMode === "partial" ? "on" : ""}`} onClick={() => setPayMode("partial")}>✂️ Split</button>
          </div>
        </div>

        {payMode === "cash" && (
          <div>
            <div className="fl">Cash Received ({cur.code})</div>
            <button onClick={() => setCashNumpadOpen(true)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 9, border: "1px solid #e2e8f0",
              background: cashPaid && +cashPaid >= total ? "#d1fae5" : "#f8fafc",
              color: cashPaid && +cashPaid >= total ? "#065f46" : "#1e293b",
              fontSize: 16, fontWeight: 700, cursor: "pointer", textAlign: "left",
              fontFamily: "'DM Mono',monospace", letterSpacing: 1
            }}>
              {cashPaid ? fmtCur(+cashPaid) : `Tap to enter (${fmtCur(total)})`}
            </button>
            {cashPaid && +cashPaid >= total && <div style={{ fontSize: 12, color: "#059669", marginTop: 4 }}>Change: {fmtCur(+cashPaid - total)}</div>}
            {cashPaid && +cashPaid < total && <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>Insufficient: need {fmtCur(total - +cashPaid)} more</div>}
          </div>
        )}
        {payMode === "account" && customer && (
          <div style={{ background: "#f8fafc", borderRadius: 9, padding: 10, fontSize: 12, color: "#64748b" }}>
            Full {fmtCur(total)} added to <strong style={{ color: "#dc2626" }}>{customer.name}'s</strong> account.
            New balance: <strong style={{ color: "#dc2626" }}>{fmt(((customer.balance || 0) + total))}{cur.symbol}</strong>
          </div>
        )}
        {payMode === "partial" && (
          <div>
            <div className="fl">Cash Amount ({cur.code})</div>
            <button onClick={() => setSplitNumpadOpen(true)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 9, border: "1px solid #e2e8f0",
              background: partialCash && +partialCash > 0 ? "#d1fae5" : "#f8fafc",
              color: partialCash && +partialCash > 0 ? "#065f46" : "#1e293b",
              fontSize: 16, fontWeight: 700, cursor: "pointer", textAlign: "left",
              fontFamily: "'DM Mono',monospace", letterSpacing: 1
            }}>
              {partialCash ? fmtCur(+partialCash) : `Tap to enter`}
            </button>
            {partialCash && <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>On account: {fmtCur(Math.max(0, total - Math.min(+partialCash, total)))}</div>}
          </div>
        )}

        {err && <div className="alert-r">{err}</div>}
        <button className="btn btn-success" style={{ width: "100%", padding: "14px", fontSize: 15, justifyContent: "center", minHeight: 50 }} onClick={completeSale}>
          ✅ Complete Sale
        </button>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div className="roverlay" onClick={() => setReceipt(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div className="receipt">
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>⚡ QuickPOS</div>
                <div style={{ color: "#555", fontSize: 11 }}>--- RECEIPT ---</div>
                <div style={{ color: "#555", fontSize: 11 }}>{fmtDate(receipt.date)} {fmtTime(receipt.date)}</div>
                <div style={{ color: "#555", fontSize: 11 }}>#{receipt.id.slice(-10).toUpperCase()}</div>
              </div>
              <div style={{ borderTop: "1px dashed #aaa", borderBottom: "1px dashed #aaa", padding: "10px 0", margin: "8px 0" }}>
                {receipt.items.map((i) => {
                  const rp = i.price * (receipt.currencyRate || 1);
                  const rt = i.total * (receipt.currencyRate || 1);
                  return (
                    <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>{i.name}<br /><span style={{ fontSize: 11, color: "#666" }}>x{i.qty} @ {fmt(rp)}{receipt.currencySymbol || "$"}</span></span>
                      <span style={{ fontWeight: 700 }}>{fmt(rt)}{receipt.currencySymbol || "$"}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 6 }}><span>TOTAL ({receipt.currency || "USD"})</span><span>{fmt(receipt.total * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span></div>
              {receipt.paid > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}><span>Cash Paid</span><span>{fmt(receipt.paid * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span></div>}
              {receipt.change > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>Change</span><span>{fmt(receipt.change * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span></div>}
              {receipt.credit > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#c00", marginTop: 4 }}><span>On Account (debit)</span><span>{fmt(receipt.credit * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span></div>}
              <div style={{ textAlign: "center", marginTop: 14, borderTop: "1px dashed #aaa", paddingTop: 10, fontSize: 11, color: "#555" }}>
                Customer: {receipt.customerName}<br />Thank you for shopping!
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: 340, justifyContent: "center" }} onClick={() => setReceipt(null)}>Close Receipt</button>
          </div>
        </div>
      )}

      {/* Numpad Modal */}
      {numpadTarget && (
        <Numpad
          target={numpadTarget}
          onConfirm={(qty) => {
            if (numpadTarget.mode === "add") {
              const p = numpadTarget.product;
              setCart((c) => {
                const ex = c.find((i) => i.id === p.id);
                const newQty = ex ? Math.min(ex.qty + qty, p.stock) : Math.min(qty, p.stock);
                if (ex) return c.map((i) => i.id === p.id ? { ...i, qty: newQty } : i);
                return [...c, { ...p, qty: newQty }];
              });
            } else {
              updateQty(numpadTarget.product.id, qty);
            }
            setNumpadTarget(null);
          }}
          onCancel={() => setNumpadTarget(null)}
        />
      )}

      {/* Cash Numpad Modal */}
      {cashNumpadOpen && (
        <CashNumpad
          total={total}
          cur={cur}
          onConfirm={(cash) => {
            setCashPaid(cash);
            setCashNumpadOpen(false);
          }}
          onCancel={() => setCashNumpadOpen(false)}
        />
      )}

      {/* Split Cash Numpad Modal */}
      {splitNumpadOpen && (
        <CashNumpad
          total={total}
          cur={cur}
          onConfirm={(cash) => {
            setPartialCash(cash);
            setSplitNumpadOpen(false);
          }}
          onCancel={() => setSplitNumpadOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── INVENTORY ─────────────────────────────────────────────────────────── */
function InventoryView({ products, setProducts, currencies, pricelists }) {
  const base = baseCur(currencies);
  const otherPLs = pricelists?.filter((p) => !p.isDefault) || [];
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [adjustId, setAdjustId] = useState(null);
  const [adjQty, setAdjQty] = useState("");
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);

  const exportProds = () => {
    const data = products.map((p) => ({ Name: p.name, SKU: p.sku, Category: p.cat, "Sell Price": p.price, Cost: p.cost, Stock: p.stock, Unit: p.unit }));
    exportXLSX(data, ["Name", "SKU", "Category", "Sell Price", "Cost", "Stock", "Unit"], "products.xlsx");
  };

  const importProds = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importXLSX(file);
      let added = 0, updated = 0;
      setProducts((ps) => {
        const next = [...ps];
        rows.forEach((r) => {
          const idx = next.findIndex((p) => p.sku === (r.SKU || r.sku || ""));
          if (idx >= 0) {
            next[idx] = { ...next[idx], name: r.Name || r.name || next[idx].name, cat: r.Category || r.cat || next[idx].cat, price: +(r["Sell Price"] || r.price || next[idx].price), cost: +(r.Cost || r.cost || next[idx].cost), stock: +(r.Stock || r.stock || next[idx].stock), unit: r.Unit || r.unit || next[idx].unit };
            updated++;
          } else {
            next.push({ id: uid(), name: r.Name || r.name || "", sku: r.SKU || r.sku || "", cat: r.Category || r.cat || "", price: +(r["Sell Price"] || r.price || 0), cost: +(r.Cost || r.cost || 0), stock: +(r.Stock || r.stock || 0), unit: r.Unit || r.unit || "pcs" });
            added++;
          }
        });
        return next;
      });
      setImportMsg({ type: "success", text: `✅ Imported: ${added} added, ${updated} updated` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.cat.toLowerCase().includes(search.toLowerCase())
  );
  const openAdd = () => { setForm({ name: "", sku: "", cat: "", price: "", cost: "", stock: "", unit: "pcs" }); setModal("add"); };
  const openEdit = (p) => { setForm({ ...p }); setModal(p.id); };
  const save = () => {
    if (!form.name || !form.price || form.stock === "") return;
    const prod = { ...form, price: +form.price, cost: +form.cost || 0, stock: +form.stock, prices: form.prices || {} };
    if (modal === "add") setProducts((ps) => [...ps, { ...prod, id: uid() }]);
    else setProducts((ps) => ps.map((p) => p.id === modal ? prod : p));
    setModal(null);
  };
  const del = (id) => { if (confirm("Delete this product?")) setProducts((ps) => ps.filter((p) => p.id !== id)); };
  const adjust = (p) => { setAdjustId(p.id); setAdjQty(""); };
  const applyAdj = () => {
    const q = +adjQty;
    if (!q && q !== 0) return;
    setProducts((ps) => ps.map((p) => p.id === adjustId ? { ...p, stock: Math.max(0, p.stock + q) } : p));
    setAdjustId(null);
  };
  const F = (k) => ({ value: form[k] || "", onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <div className="ppage">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Inventory</div><div style={{ fontSize: 13, color: "#64748b" }}>{products.length} products · {fmt(products.reduce((a, p) => a + p.cost * p.stock, 0))}{base.symbol} stock value</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importProds} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={exportProds}>📤 Export</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>
      {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"} style={{ marginTop: 8 }}>{importMsg.text}</div>}
      <div className="card" style={{ padding: "12px 16px" }}>
        <input className="inp" placeholder="Search by name, SKU, or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflow: "auto" }}>
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Sell Price</th><th>Cost</th><th>Margin</th><th>Stock</th><th>Unit</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((p) => {
                const margin = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : 0;
                return (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div></td>
                    <td style={{ color: "#64748b", fontFamily: "monospace", fontSize: 12 }}>{p.sku}</td>
                    <td><span className="tag tag-blue">{p.cat}</span></td>
                    <td style={{ color: "#0284c7", fontWeight: 700 }}>{fmt(p.price)} {base.symbol}</td>
                    <td style={{ color: "#64748b" }}>{fmt(p.cost)} {base.symbol}</td>
                    <td><span className={`tag ${+margin >= 30 ? "tag-green" : +margin >= 10 ? "tag-amber" : "tag-red"}`}>{margin}%</span></td>
                    <td><span className={`tag ${p.stock === 0 ? "tag-red" : p.stock <= 5 ? "tag-amber" : "tag-green"}`}>{p.stock}</span></td>
                    <td style={{ color: "#64748b" }}>{p.unit}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-primary btn-sm" onClick={() => adjust(p)}>±Adj</button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(p.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", color: "#475569", padding: "30px" }}>No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>{modal === "add" ? "➕ Add Product" : "✏️ Edit Product"}</div>
            <div className="fg"><label className="fl">Product Name *</label><input className="inp" placeholder="Product name" {...F("name")} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="fg"><label className="fl">SKU / Code</label><input className="inp" placeholder="e.g. CC001" {...F("sku")} /></div>
              <div className="fg"><label className="fl">Category</label><input className="inp" placeholder="e.g. Beverages" {...F("cat")} /></div>
              <div className="fg"><label className="fl">Sell Price *</label><input className="inp" type="number" step="0.01" placeholder="0.00" {...F("price")} /></div>
              <div className="fg"><label className="fl">Cost Price</label><input className="inp" type="number" step="0.01" placeholder="0.00" {...F("cost")} /></div>
              <div className="fg"><label className="fl">Stock Qty *</label><input className="inp" type="number" placeholder="0" {...F("stock")} /></div>
              <div className="fg"><label className="fl">Unit</label><input className="inp" placeholder="pcs, kg, L, box..." {...F("unit")} /></div>
            </div>
            {form.price && form.cost && <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, fontSize: 12, color: "#64748b", marginBottom: 12 }}>
              Margin: <strong style={{ color: "#059669" }}>{(((+form.price - +form.cost) / +form.price) * 100).toFixed(1)}%</strong> · Profit per unit: <strong style={{ color: "#059669" }}>{fmt(+form.price - +form.cost)} {base.symbol}</strong>
            </div>}
            {otherPLs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Override Prices</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {otherPLs.map((pl) => (
                    <div key={pl.id} className="fg" style={{ marginBottom: 0 }}>
                      <label className="fl">{pl.name}</label>
                      <input className="inp" type="number" step="0.01" min={0} placeholder={form.price || "0.00"}
                        value={form.prices?.[pl.id] ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, prices: { ...(f.prices || {}), [pl.id]: e.target.value === "" ? undefined : +e.target.value } }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save}>Save Product</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {adjustId && (() => {
        const p = products.find((x) => x.id === adjustId);
        return (
          <div className="modal-bg" onClick={() => setAdjustId(null)}>
            <div className="modal" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Stock Adjustment</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{p.name} · Current: <strong style={{ color: "#0284c7" }}>{p.stock} {p.unit}</strong></div>
              <div className="fg"><label className="fl">Adjustment (+/-)</label>
                <input className="inp" type="number" placeholder="e.g. +10 or -3" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} autoFocus />
              </div>
              {adjQty && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>New stock: <strong style={{ color: "#0284c7" }}>{Math.max(0, p.stock + (+adjQty || 0))} {p.unit}</strong></div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={applyAdj}>Apply</button>
                <button className="btn btn-ghost" onClick={() => setAdjustId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ─── PURCHASE VIEW ─────────────────────────────────────────────────────── */
function PurchaseView({ products, setProducts, purchases, setPurchases, currencies }) {
  const base = baseCur(currencies);  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([{ productId: "", qty: 1, cost: 0 }]);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);

  const importPurchases = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importXLSX(file);
      let added = 0;
      rows.forEach((r) => {
        const supplier = r.Supplier || r.supplier || "";
        if (!supplier) return;
        const items = (r.Items || r.items || "").split(",").filter(Boolean).map((s) => {
          const parts = s.trim().split("×");
          const p = products.find((x) => x.name.toLowerCase() === (parts[0] || "").trim().toLowerCase());
          return p ? { productId: p.id, name: p.name, qty: +(parts[1] || 1), cost: p.cost } : null;
        }).filter(Boolean);
        if (items.length === 0) return;
        setPurchases((ps) => [...ps, { id: uid(), date: Date.now(), supplier, note: r.Note || r.note || "", items, total: items.reduce((a, i) => a + i.qty * i.cost, 0) }]);
        added++;
      });
      setImportMsg({ type: "success", text: `✅ Imported ${added} purchase records` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  const addItem = () => setItems((i) => [...i, { productId: "", qty: 1, cost: 0 }]);
  const removeItem = (idx) => setItems((i) => i.filter((_, j) => j !== idx));
  const updateItem = (idx, key, val) => setItems((i) => i.map((item, j) => j === idx ? { ...item, [key]: val } : item));
  const onProductChange = (idx, productId) => {
    const p = products.find((x) => x.id === productId);
    setItems((i) => i.map((item, j) => j === idx ? { ...item, productId, cost: p?.cost || 0 } : item));
  };
  const total = items.reduce((a, i) => a + (+(i.qty) || 0) * (+(i.cost) || 0), 0);
  const completePurchase = () => {
    if (!supplier.trim()) { setMsg({ type: "error", text: "Enter supplier name" }); return; }
    const valid = items.filter((i) => i.productId && +i.qty > 0);
    if (valid.length === 0) { setMsg({ type: "error", text: "Add at least one product" }); return; }
    setProducts((ps) => ps.map((p) => {
      const item = valid.find((i) => i.productId === p.id);
      return item ? { ...p, stock: p.stock + +item.qty, cost: +item.cost || p.cost } : p;
    }));
    setPurchases((ps) => [...ps, {
      id: uid(), date: Date.now(), supplier: supplier.trim(), note,
      items: valid.map((i) => { const p = products.find((x) => x.id === i.productId); return { productId: i.productId, name: p?.name, qty: +i.qty, cost: +i.cost }; }),
      total
    }]);
    setSupplier(""); setItems([{ productId: "", qty: 1, cost: 0 }]); setNote("");
    setMsg({ type: "success", text: "✅ Purchase recorded! Stock updated." });
    setTimeout(() => setMsg(null), 4000);
  };
  const recent = [...purchases].sort((a, b) => b.date - a.date).slice(0, 12);

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Purchase Stock</div><div style={{ fontSize: 13, color: "#64748b" }}>Record incoming inventory from suppliers</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importPurchases} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const data = purchases.map((pu) => ({ Date: fmtDate(pu.date), Supplier: pu.supplier, Items: pu.items.map((i) => `${i.name}×${i.qty}`).join(", "), Total: pu.total, Note: pu.note || "" }));
            exportXLSX(data, ["Date", "Supplier", "Items", "Total", "Note"], "purchases.xlsx");
          }}>📤 Export</button>
        </div>
      </div>
      {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"}>{importMsg.text}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>📥 New Purchase</div>
          {msg && <div className={msg.type === "error" ? "alert-r" : "alert-g"} style={{ marginBottom: 12 }}>{msg.text}</div>}
          <div className="fg"><label className="fl">Supplier *</label><input className="inp" placeholder="Supplier / vendor name" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>Items</div>
          {items.map((item, idx) => (
            <div key={idx} style={{ background: "#f8fafc", borderRadius: 9, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                <select className="sel" style={{ flex: 1 }} value={item.productId} onChange={(e) => onProductChange(idx, e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
                {items.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>✕</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div><div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>QTY</div><input className="inp" type="number" value={item.qty} min={1} onChange={(e) => updateItem(idx, "qty", e.target.value)} /></div>
                <div><div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>COST/UNIT ({base.symbol})</div><input className="inp" type="number" step="0.01" value={item.cost} min={0} onChange={(e) => updateItem(idx, "cost", e.target.value)} /></div>
              </div>
              {item.productId && <div style={{ fontSize: 11, color: "#059669", marginTop: 5 }}>Subtotal: {fmt((+item.qty || 0) * (+item.cost || 0))} {base.symbol}</div>}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={addItem}>+ Add Another Item</button>
          <div className="fg"><label className="fl">Note (optional)</label><input className="inp" placeholder="Reference, invoice number..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #475569", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Total Cost</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: "#0284c7" }}>{fmt(total)} {base.symbol}</span>
          </div>
          <button className="btn btn-success" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={completePurchase}>📥 Record Purchase</button>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#0f172a" }}>Purchase History</div>
          {recent.length === 0 ? <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No purchases yet</div>
            : recent.map((pu) => (
              <div key={pu.id} style={{ background: "#f8fafc", borderRadius: 9, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{pu.supplier}</span>
                  <span style={{ fontWeight: 700, color: "#0284c7" }}>{fmt(pu.total)} {base.symbol}</span>
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{fmtDate(pu.date)} · {pu.items.length} item(s)</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{pu.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</div>
                {pu.note && <div style={{ fontSize: 11, color: "#475569", marginTop: 3, fontStyle: "italic" }}>{pu.note}</div>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ─── CUSTOMERS VIEW ────────────────────────────────────────────────────── */
function CustomersView({ customers, setCustomers, txns, setTxns, sales, currencies, pricelists }) {
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({});
  const [payAmt, setPayAmt] = useState("");
  const [payNote, setPayNote] = useState("");
  const [debitAmt, setDebitAmt] = useState("");
  const [debitNote, setDebitNote] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ledger");
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);
  const base = baseCur(currencies);

  const exportCusts = () => {
    const data = customers.map((c) => ({ Name: c.name, Phone: c.phone || "", Email: c.email || "", Balance: c.balance || 0, Since: fmtDate(c.since) }));
    exportXLSX(data, ["Name", "Phone", "Email", "Balance", "Since"], "customers.xlsx");
  };

  const importCusts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importXLSX(file);
      let added = 0;
      setCustomers((cs) => {
        const next = [...cs];
        rows.forEach((r) => {
          const name = r.Name || r.name || "";
          if (!name) return;
          const idx = next.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());
          if (idx >= 0) {
            next[idx] = { ...next[idx], phone: r.Phone || r.phone || next[idx].phone, email: r.Email || r.email || next[idx].email };
          } else {
            next.push({ id: uid(), name, phone: r.Phone || r.phone || "", email: r.Email || r.email || "", balance: +(r.Balance || r.balance || 0), since: Date.now() });
            added++;
          }
        });
        return next;
      });
      setImportMsg({ type: "success", text: `✅ Imported ${added} new customers` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.email || "").toLowerCase().includes(search)
  );
  const openAdd = () => { setForm({ name: "", phone: "", email: "", pricelistId: "" }); setModal("add"); };
  const save = () => {
    if (!form.name) return;
    if (modal === "add") setCustomers((cs) => [...cs, { ...form, pricelistId: form.pricelistId || null, id: uid(), balance: 0, since: Date.now() }]);
    else setCustomers((cs) => cs.map((c) => c.id === modal ? { ...c, ...form, pricelistId: form.pricelistId || null } : c));
    setModal(null);
  };
  const del = (id) => { if (confirm("Delete this customer?")) setCustomers((cs) => cs.filter((c) => c.id !== id)); };

  const makePayment = (c) => {
    const amt = +payAmt; if (!amt || amt <= 0) return;
    const newBal = Math.max(0, (c.balance || 0) - amt);
    setCustomers((cs) => cs.map((x) => x.id === c.id ? { ...x, balance: newBal } : x));
    setTxns((ts) => [...ts, { id: uid(), date: Date.now(), customerId: c.id, customerName: c.name, type: "credit", amount: amt, note: payNote || "Payment received", balance: newBal }]);
    setPayAmt(""); setPayNote("");
    setDetail((prev) => ({ ...prev, balance: newBal }));
  };

  const makeDebit = (c) => {
    const amt = +debitAmt; if (!amt || amt <= 0) return;
    const newBal = (c.balance || 0) + amt;
    setCustomers((cs) => cs.map((x) => x.id === c.id ? { ...x, balance: newBal } : x));
    setTxns((ts) => [...ts, { id: uid(), date: Date.now(), customerId: c.id, customerName: c.name, type: "debit", amount: amt, note: debitNote || "Manual debit", balance: newBal }]);
    setDebitAmt(""); setDebitNote("");
    setDetail((prev) => ({ ...prev, balance: newBal }));
  };

  const F = (k) => ({ value: form[k] || "", onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  if (detail) {
    const c = customers.find((x) => x.id === detail.id) || detail;
    const custTxns = txns.filter((t) => t.customerId === c.id).sort((a, b) => b.date - a.date);
    const custSales = sales.filter((s) => s.customerId === c.id).sort((a, b) => b.date - a.date);
    const totalPurchased = custSales.reduce((a, s) => a + s.total, 0);
    return (
      <div className="ppage">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>← Back</button>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{c.phone && c.phone} {c.email && `· ${c.email}`}</div>
            </div>
          </div>
          <div style={{ background: c.balance > 0 ? "#fef2f2" : "#f0fdf4", borderRadius: 12, padding: "12px 20px", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Balance</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.balance > 0 ? "#dc2626" : "#059669" }}>
              {c.balance > 0 ? `Owes ${fmt(c.balance)} ${base.symbol}` : "Clear ✅"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Total purchased: {fmt(totalPurchased)} {base.symbol}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: c.balance > 0 ? "1fr 1fr" : "1fr", gap: 14 }}>
          {c.balance > 0 && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#0f172a" }}>💳 Record Payment</div>
              <div className="fg"><label className="fl">Amount</label><input className="inp" type="number" placeholder="0.00" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} /></div>
              <div className="fg"><label className="fl">Note</label><input className="inp" placeholder="e.g. Cash payment" value={payNote} onChange={(e) => setPayNote(e.target.value)} /></div>
              {payAmt && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                Remaining balance: <strong style={{ color: +payAmt >= c.balance ? "#059669" : "#dc2626" }}>{fmt(Math.max(0, c.balance - +payAmt))} {base.symbol}</strong>
              </div>}
              <button className="btn btn-success" style={{ width: "100%", justifyContent: "center" }} onClick={() => makePayment(c)}>✅ Record Payment</button>
            </div>
          )}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#0f172a" }}>➕ Manual Debit</div>
            <div className="fg"><label className="fl">Amount</label><input className="inp" type="number" placeholder="0.00" value={debitAmt} onChange={(e) => setDebitAmt(e.target.value)} /></div>
            <div className="fg"><label className="fl">Reason</label><input className="inp" placeholder="e.g. Credit advance" value={debitNote} onChange={(e) => setDebitNote(e.target.value)} /></div>
            <button className="btn btn-amber" style={{ width: "100%", justifyContent: "center" }} onClick={() => makeDebit(c)}>Add Debit</button>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className={`ptab ${activeTab === "ledger" ? "on" : ""}`} onClick={() => setActiveTab("ledger")}>Account Ledger</button>
            <button className={`ptab ${activeTab === "sales" ? "on" : ""}`} onClick={() => setActiveTab("sales")}>Purchase History</button>
          </div>
          {activeTab === "ledger" && (
            custTxns.length === 0 ? <div style={{ color: "#475569", fontSize: 13 }}>No transactions yet</div> :
              <table>
                <thead><tr><th>Date</th><th>Note</th><th>Type</th><th>Amount</th></tr></thead>
                <tbody>
                  {custTxns.map((t) => (
                    <tr key={t.id}>
                      <td>{fmtDate(t.date)}<br /><span style={{ fontSize: 10, color: "#475569" }}>{fmtTime(t.date)}</span></td>
                      <td>{t.note}</td>
                      <td><span className={`tag ${t.type === "debit" ? "tag-red" : "tag-green"}`}>{t.type === "debit" ? "DEBIT" : "CREDIT"}</span></td>
                      <td style={{ fontWeight: 700, color: t.type === "debit" ? "#dc2626" : "#059669" }}>{t.type === "debit" ? "+" : "-"}{fmt(t.amount)} {base.symbol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
          {activeTab === "sales" && (
            custSales.length === 0 ? <div style={{ color: "#475569", fontSize: 13 }}>No purchases yet</div> :
              <table>
                <thead><tr><th>Date</th><th>Items</th><th>Total</th><th>Cash</th><th>On Account</th></tr></thead>
                <tbody>
                  {custSales.map((s) => (
                    <tr key={s.id}>
                      <td>{fmtDate(s.date)}</td>
                      <td style={{ fontSize: 12, color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.items.map((i) => `${i.name}×${i.qty}`).join(", ")}</td>
                      <td style={{ color: "#0284c7", fontWeight: 700 }}>{fmt(s.total)} {base.symbol}</td>
                      <td style={{ color: "#059669" }}>{fmt(s.paid)} {base.symbol}</td>
                      <td style={{ color: s.credit > 0 ? "#dc2626" : "#64748b" }}>{s.credit > 0 ? `${fmt(s.credit)} ${base.symbol}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Customers</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{customers.length} customers · {fmt(customers.reduce((a, c) => a + c.balance, 0))}{base.symbol} total outstanding</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importCusts} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={exportCusts}>📤 Export</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
        </div>
      </div>
      {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"}>{importMsg.text}</div>}
      <div className="card" style={{ padding: "12px 16px" }}>
        <input className="inp" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Balance</th><th>Since</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setDetail(c)}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ color: "#64748b" }}>{c.phone || "—"}</td>
                <td style={{ color: "#64748b" }}>{c.email || "—"}</td>
                <td><span className={`tag ${c.balance > 0 ? "tag-red" : "tag-green"}`}>{c.balance > 0 ? `Owes ${fmt(c.balance)} ${base.symbol}` : "Clear"}</span></td>
                <td style={{ color: "#475569", fontSize: 12 }}>{c.since ? fmtDate(c.since) : "—"}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setForm({ ...c }); setModal(c.id); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(c.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#475569", padding: "30px" }}>No customers found</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>{modal === "add" ? "➕ Add Customer" : "✏️ Edit Customer"}</div>
            <div className="fg"><label className="fl">Full Name *</label><input className="inp" placeholder="Customer name" {...F("name")} /></div>
            <div className="fg"><label className="fl">Phone</label><input className="inp" placeholder="Phone number" {...F("phone")} /></div>
            <div className="fg"><label className="fl">Email</label><input className="inp" placeholder="Email address" {...F("email")} /></div>
            <div className="fg"><label className="fl">Pricelist</label>
              <select className="sel" value={form.pricelistId || ""} onChange={(e) => setForm((f) => ({ ...f, pricelistId: e.target.value || null }))}>
                <option value="">Default pricing</option>
                {pricelists?.map((pl) => <option key={pl.id} value={pl.id}>{pl.isDefault ? "⭐ " : ""}{pl.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save}>Save Customer</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── HISTORY VIEW ──────────────────────────────────────────────────────── */
function HistoryView({ sales, setSales, products, currencies }) {
  const base = baseCur(currencies);
  const [tab, setTab] = useState("sales");
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);
  const sorted = [...sales].sort((a, b) => b.date - a.date);
  const totalRev = sales.reduce((a, s) => a + s.total, 0);
  const totalCash = sales.reduce((a, s) => a + s.paid, 0);
  const totalCredit = sales.reduce((a, s) => a + (s.credit || 0), 0);
  const totalProfit = sales.reduce((a, s) => a + s.items.reduce((b, i) => {
    const p = products.find((x) => x.id === i.id);
    return b + (i.price - (p?.cost || 0)) * i.qty;
  }, 0), 0);

  const importSales = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importXLSX(file);
      let added = 0;
      rows.forEach((r) => {
        const items = (r.Items || r.items || "").split(",").filter(Boolean).map((s) => {
          const parts = s.trim().split("×");
          const p = products.find((x) => x.name.toLowerCase() === (parts[0] || "").trim().toLowerCase());
          const qty = +(parts[1] || 1);
          return p ? { id: p.id, name: p.name, price: p.price, qty, total: p.price * qty } : null;
        }).filter(Boolean);
        if (items.length === 0) return;
        setSales((ps) => [...ps, { id: uid(), date: Date.now(), customerId: null, customerName: r.Customer || r.customer || "Walk-in", items, subtotal: items.reduce((a, i) => a + i.total, 0), total: +(r.Total || r.total || 0), paid: +(r.Paid || r.paid || 0), credit: +(r["On Account"] || r.credit || 0), change: +(r.Change || r.change || 0), payMode: r.Method || r.method || r.payMode || "cash", currency: base.code, currencyRate: 1, currencySymbol: base.symbol }]);
        added++;
      });
      setImportMsg({ type: "success", text: `✅ Imported ${added} sales` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>History & Reports</div><div style={{ fontSize: 13, color: "#64748b" }}>{sales.length} total transactions</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importSales} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const data = sorted.map((s) => ({ Date: fmtDate(s.date), Time: fmtTime(s.date), Customer: s.customerName, Items: s.items.map((i) => `${i.name}×${i.qty}`).join(", "), Subtotal: s.subtotal, Total: s.total, Paid: s.paid, "On Account": s.credit, Change: s.change, Method: s.payMode }));
            exportXLSX(data, ["Date", "Time", "Customer", "Items", "Subtotal", "Total", "Paid", "On Account", "Change", "Method"], "sales.xlsx");
          }}>📤 Export</button>
        </div>
      </div>
      {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"}>{importMsg.text}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13 }}>
        {[
          { label: "Total Revenue", val: `${fmt(totalRev)} ${base.symbol}`, c: "#0284c7" },
          { label: "Cash Collected", val: `${fmt(totalCash)} ${base.symbol}`, c: "#059669" },
          { label: "On Account", val: `${fmt(totalCredit)} ${base.symbol}`, c: "#dc2626" },
          { label: "Est. Profit", val: `${fmt(totalProfit)} ${base.symbol}`, c: "#7c3aed" },
        ].map((s) => (
          <div key={s.label} className="stat">
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 20 }}>
            {["sales"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#0284c7" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", paddingBottom: 12, borderBottom: tab === t ? "2px solid #0284c7" : "2px solid transparent", textTransform: "capitalize" }}>Sales ({sales.length})</button>
            ))}
          </div>
        </div>
        <table>
          <thead><tr><th>Date & Time</th><th>Customer</th><th>Items</th><th>Total</th><th>Cash</th><th>On Account</th><th>Change</th><th>Method</th><th>Cur</th></tr></thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", color: "#475569", padding: "40px" }}>No sales yet — complete your first sale to see history here.</td></tr>
            ) : sorted.map((s) => (
              <tr key={s.id}>
                <td><div style={{ fontSize: 12.5 }}>{fmtDate(s.date)}</div><div style={{ fontSize: 11, color: "#475569" }}>{fmtTime(s.date)}</div></td>
                <td style={{ fontWeight: 500 }}>{s.customerName}</td>
                <td style={{ fontSize: 11.5, color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.items.map((i) => `${i.name}×${i.qty}`).join(", ")}</td>
                <td style={{ color: "#0284c7", fontWeight: 700 }}>{fmt(s.total)} {base.symbol}</td>
                <td style={{ color: "#059669" }}>{fmt(s.paid)} {base.symbol}</td>
                <td style={{ color: s.credit > 0 ? "#dc2626" : "#64748b" }}>{s.credit > 0 ? `${fmt(s.credit)} ${base.symbol}` : "—"}</td>
                <td style={{ color: "#64748b" }}>{s.change > 0 ? `${fmt(s.change)} ${base.symbol}` : "—"}</td>
                <td><span className={`tag ${s.payMode === "cash" ? "tag-blue" : s.payMode === "account" ? "tag-red" : "tag-amber"}`}>{s.payMode === "cash" ? "💵 Cash" : s.payMode === "account" ? "📋 Account" : "✂️ Split"}</span></td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{s.currency || "USD"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
