import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n) => (+(n || 0)).toFixed(2);
const fmtDate = (d) => new Date(d || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const KEYS = { p: "pos:p2", c: "pos:c2", s: "pos:s2", pu: "pos:pu2", t: "pos:t2" };

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

const CAT_ICONS = { Beverages: "🥤", Bakery: "🍞", Grains: "🌾", Dairy: "🥛", Meat: "🥩", Fruits: "🍎", Vegetables: "🥦", Snacks: "🍿", Other: "📦" };
const catIcon = (cat) => CAT_ICONS[cat] || "📦";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
input,select,textarea,button{font-family:'DM Sans',sans-serif}
.nav{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:12px;border:none;background:transparent;color:#64748b;font-size:15px;font-weight:500;width:100%;text-align:left;cursor:pointer;transition:all .13s;min-height:48px}
.nav:hover{background:#1e293b;color:#cbd5e1}
.nav.on{background:#0c4a6e;color:#7dd3fc}
.btn{padding:10px 22px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:all .13s;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;min-height:42px}
.btn-primary{background:#0ea5e9;color:#fff}.btn-primary:active{background:#0284c7}
.btn-success{background:#10b981;color:#fff}.btn-success:active{background:#059669}
.btn-danger{background:#ef4444;color:#fff}.btn-danger:active{background:#dc2626}
.btn-ghost{background:#1e293b;color:#cbd5e1;border:1px solid #2d3f55}.btn-ghost:active{background:#334155}
.btn-amber{background:#f59e0b;color:#000}.btn-amber:active{background:#d97706}
.btn-sm{padding:7px 16px;font-size:13px;border-radius:8px;min-height:36px}
.inp{background:#0f172a;border:1.5px solid #2d3f55;border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:15px;outline:none;width:100%;transition:border .13s;min-height:44px}
.inp:focus{border-color:#0ea5e9}
.sel{background:#0f172a;border:1.5px solid #2d3f55;border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:15px;outline:none;width:100%;cursor:pointer;min-height:44px}
.sel:focus{border-color:#0ea5e9}
.card{background:#1e293b;border-radius:14px;padding:22px}
.stat{background:linear-gradient(135deg,#1e293b,#0f1f35);border-radius:14px;padding:22px;border:1px solid #1e293b}
.tag{display:inline-flex;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.03em}
.tag-red{background:#450a0a;color:#f87171}
.tag-green{background:#052e16;color:#34d399}
.tag-blue{background:#0c1a2e;color:#38bdf8}
.tag-amber{background:#1c1000;color:#fbbf24}
.tag-slate{background:#1e293b;color:#94a3b8;border:1px solid #334155}
.tag-purple{background:#1e0a3c;color:#c084fc}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;padding:12px 16px;color:#475569;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #1e293b;white-space:nowrap}
td{padding:12px 16px;border-bottom:1px solid #151f2e;color:#cbd5e1;vertical-align:middle}
tr:active td{background:#18253a}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;z-index:200;padding:24px}
.modal{background:#1a2744;border-radius:18px;padding:28px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;border:1px solid #2d3f55}
.fg{margin-bottom:16px}
.fl{display:block;font-size:12px;color:#64748b;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.prod-card{background:#111e33;border-radius:12px;padding:16px;cursor:pointer;border:2px solid transparent;transition:all .13s;user-select:none}
.prod-card:active{border-color:#0ea5e9;background:#1a2a42}
.prod-card.oos{opacity:.45;cursor:not-allowed;pointer-events:none}
.ptab{padding:10px 20px;border-radius:10px;border:1.5px solid #2d3f55;background:#0f172a;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;transition:all .13s;min-height:42px}
.ptab.on{background:#0c4a6e;color:#7dd3fc;border-color:#0ea5e9}
.roverlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:300;padding:24px}
.receipt{background:#fff;color:#111;border-radius:8px;padding:30px 26px;width:100%;max-width:340px;font-family:'DM Mono',monospace;font-size:12.5px}
.alert-r{padding:12px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;background:#450a0a;color:#fca5a5;border:1px solid #7f1d1d}
.alert-g{padding:12px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;background:#052e16;color:#6ee7b7;border:1px solid #065f46}
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

/* ─── NUMBAD COMPONENT ───────────────────────────────────────────────────── */
const NUM_KEYS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ["⌫", 0, "✓"],
];

function Numpad({ target, onConfirm, onCancel }) {
  const [qty, setQty] = useState(target?.qty || 1);
  const isDefault = useRef(!target?.qty);

  const press = (k) => {
    if (typeof k === "number") {
      setQty((prev) => {
        let next = isDefault.current ? k : prev * 10 + k;
        isDefault.current = false;
        const max = target?.product?.stock ?? 9999;
        return next > max ? prev : Math.min(next, max);
      });
    }
  };

  return (
    <div className="roverlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 300, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{target?.product?.name}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Stock: {target?.product?.stock} {target?.product?.unit}</div>
        <div style={{
          background: "#0a1628", borderRadius: 10, padding: "10px 16px", textAlign: "right",
          fontSize: 28, fontWeight: 700, color: "#38bdf8", fontFamily: "'DM Mono',monospace", marginBottom: 14,
          letterSpacing: 2, minHeight: 48
        }}>
          {qty}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NUM_KEYS.slice(0, 3).map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 6 }}>
              {row.map((k) => (
                <button key={k} onClick={() => press(k)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 9, border: "none",
                  background: "#0f172a", color: "#e2e8f0",
                  fontSize: 18, fontWeight: 700, cursor: "pointer"
                }}>{k}</button>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setQty((prev) => { const n = Math.floor(prev / 10); if (n === 0) { isDefault.current = true; return 1; } return n; })} style={{
              flex: 1, padding: "12px 0", borderRadius: 9, border: "1px solid #2d3f55",
              background: "#1e293b", color: "#e2e8f0", fontSize: 18, fontWeight: 700, cursor: "pointer"
            }}>⌫</button>
            <button onClick={() => press(0)} style={{
              flex: 1, padding: "12px 0", borderRadius: 9, border: "none",
              background: "#0f172a", color: "#e2e8f0", fontSize: 18, fontWeight: 700, cursor: "pointer"
            }}>0</button>
          </div>
        </div>
        <button onClick={() => onConfirm(qty)} style={{
          width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 9, border: "none",
          background: "#0ea5e9", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"
        }}>Add to Cart</button>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [products, setProducts] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [sales, setSales] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [txns, setTxns] = useState(null);

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
    };
    load();
  }, []);

  useEffect(() => { if (products) window.storage.set(KEYS.p, JSON.stringify(products)).catch(() => {}); }, [products]);
  useEffect(() => { if (customers) window.storage.set(KEYS.c, JSON.stringify(customers)).catch(() => {}); }, [customers]);
  useEffect(() => { if (sales) window.storage.set(KEYS.s, JSON.stringify(sales)).catch(() => {}); }, [sales]);
  useEffect(() => { if (purchases) window.storage.set(KEYS.pu, JSON.stringify(purchases)).catch(() => {}); }, [purchases]);
  useEffect(() => { if (txns) window.storage.set(KEYS.t, JSON.stringify(txns)).catch(() => {}); }, [txns]);

  if (!products || !customers || !sales || !purchases || !txns)
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a1628", color: "#94a3b8", fontFamily: "sans-serif", fontSize: 16, gap: 12 }}>
      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Loading QuickPOS...
    </div>;

  const ctx = { products, setProducts, customers, setCustomers, sales, setSales, purchases, setPurchases, txns, setTxns, setView };
  const NAV = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "sell", icon: "🛒", label: "Sell" },
    { id: "inventory", icon: "📦", label: "Inventory" },
    { id: "purchase", icon: "🛍️", label: "Purchase" },
    { id: "customers", icon: "👥", label: "Customers" },
    { id: "history", icon: "📋", label: "History" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#0a1628", color: "#e2e8f0", overflow: "hidden" }}>
      <style>{CSS}</style>
      <aside style={{ width: 220, background: "#07101f", borderRight: "1px solid #1a2540", padding: "18px 12px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <div style={{ padding: "12px 16px 20px", borderBottom: "1px solid #1a2540", marginBottom: 8 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#38bdf8", letterSpacing: "-.02em" }}>⚡ QuickPOS</div>
          <div style={{ fontSize: 12, color: "#334155", marginTop: 3 }}>Point of Sale System</div>
        </div>
        {NAV.map((n) => (
          <button key={n.id} className={`nav ${view === n.id ? "on" : ""}`} onClick={() => setView(n.id)}>
            <span style={{ fontSize: 18 }}>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "14px 16px", borderTop: "1px solid #1a2540", fontSize: 12, color: "#334155" }}>
          v1.0 · All data saved locally
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {view === "dashboard" && <Dashboard {...ctx} />}
        {view === "sell" && <SellView {...ctx} />}
        {view === "inventory" && <InventoryView {...ctx} />}
        {view === "purchase" && <PurchaseView {...ctx} />}
        {view === "customers" && <CustomersView {...ctx} />}
        {view === "history" && <HistoryView {...ctx} />}
      </main>
    </div>
  );
}

/* ─── DASHBOARD ─────────────────────────────────────────────────────────── */
function Dashboard({ products, customers, sales, setView }) {
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
    { label: "Today's Revenue", val: `$${fmt(todayRev)}`, sub: `${todaySales.length} sales today`, c: "#38bdf8", icon: "💰" },
    { label: "Total Revenue", val: `$${fmt(totalRev)}`, sub: `${sales.length} all-time sales`, c: "#34d399", icon: "📈" },
    { label: "Est. Profit", val: `$${fmt(profit)}`, sub: "Revenue minus cost", c: "#c084fc", icon: "✨" },
    { label: "Stock Value", val: `$${fmt(stockVal)}`, sub: `${products.length} products`, c: "#fb923c", icon: "📦" },
    { label: "Customer Debt", val: `$${fmt(totalDebt)}`, sub: `${customers.filter((c) => c.balance > 0).length} with balance`, c: "#f87171", icon: "💳" },
    { label: "Low Stock Items", val: lowStock.length, sub: lowStock.length ? "Need restocking" : "All stocked well", c: lowStock.length ? "#fbbf24" : "#34d399", icon: "⚠️" },
  ];

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>Dashboard</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setView("sell")}>🛒 New Sale</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#f1f5f9" }}>Recent Sales</div>
          {recent.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No sales yet — go make your first sale!</div>
          ) : recent.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #151f2e" }}>
              <div>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{s.customerName || "Walk-in"}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{fmtDate(s.date)} · {fmtTime(s.date)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>${fmt(s.total)}</div>
                {s.credit > 0 && <span className="tag tag-red" style={{ fontSize: 10 }}>+${fmt(s.credit)} debt</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#f1f5f9" }}>⚠️ Low Stock</div>
          {lowStock.length === 0 ? (
            <div style={{ color: "#34d399", fontSize: 13, textAlign: "center", padding: "24px 0" }}>✅ All items well stocked</div>
          ) : lowStock.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #151f2e" }}>
              <div>
                <div style={{ fontSize: 13, color: "#e2e8f0" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{p.sku}</div>
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
function SellView({ products, setProducts, customers, setCustomers, sales, setSales, txns, setTxns }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [cashPaid, setCashPaid] = useState("");
  const [partialCash, setPartialCash] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState("");
  const [numpadTarget, setNumpadTarget] = useState(null);

  const cats = ["All", ...Array.from(new Set(products.map((p) => p.cat)))];
  const filtered = products.filter((p) =>
    (catFilter === "All" || p.cat === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (p) => {
    if (p.stock === 0) return;
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) { if (ex.qty >= p.stock) return c; return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i); }
      return [...c, { ...p, qty: 1 }];
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
  const discountAmt = Math.min(subtotal, +(discount) || 0);
  const total = subtotal - discountAmt;
  const customer = customers.find((c) => c.id === customerId);

  const completeSale = () => {
    setErr("");
    if (cart.length === 0) { setErr("Cart is empty"); return; }
    let paid = 0, credit = 0, change = 0;
    if (payMode === "cash") {
      paid = +(cashPaid) || 0;
      if (paid < total) { setErr(`Cash amount ($${fmt(paid)}) is less than total ($${fmt(total)})`); return; }
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
    const newSale = { id: saleId, date: now, customerId: customerId || null, customerName: customer?.name || "Walk-in", items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, total: i.price * i.qty })), subtotal, discount: discountAmt, total, paid, credit, change, payMode };
    setSales((s) => [...s, newSale]);
    setReceipt(newSale);
    setCart([]); setDiscount(""); setCashPaid(""); setPartialCash(""); setCustomerId(""); setPayMode("cash");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Products Panel */}
      <div style={{ flex: 1, padding: 18, overflow: "auto", borderRight: "1px solid #1a2540", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 16 }}>🔍</span>
            <input className="inp" style={{ paddingLeft: 34 }} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "10px 20px", borderRadius: 24, border: "2px solid", borderColor: catFilter === c ? "#0ea5e9" : "#2d3f55", background: catFilter === c ? "#0c4a6e" : "transparent", color: catFilter === c ? "#7dd3fc" : "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 42 }}>
              {catIcon(c)} {c}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
          {filtered.map((p) => (
            <div key={p.id} className={`prod-card ${p.stock === 0 ? "oos" : ""}`} onClick={() => { if (p.stock > 0) setNumpadTarget({ product: p, mode: "add" }); }}>
              <div style={{ fontSize: 34, textAlign: "center", marginBottom: 10 }}>{catIcon(p.cat)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3, marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#38bdf8" }}>${fmt(p.price)}</div>
              <div style={{ fontSize: 12, color: p.stock <= 5 ? "#fbbf24" : "#475569", marginTop: 3 }}>
                {p.stock === 0 ? "Out of stock" : `${p.stock} ${p.unit}`}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#475569", padding: "30px 0", fontSize: 13 }}>No products found</div>}
        </div>
      </div>

      {/* Cart Panel */}
      <div style={{ width: 340, display: "flex", flexDirection: "column", padding: 16, gap: 12, background: "#09172a", overflow: "hidden" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🛒 Cart {cart.length > 0 && `(${cart.length})`}</span>
          {cart.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>Clear</button>}
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#334155", paddingTop: 40, fontSize: 13 }}>Tap products to add</div>
          ) : cart.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #111e33" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#38bdf8" }}>${fmt(item.price)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, minWidth: 28, textAlign: "center", cursor: "pointer", color: "#38bdf8" }} onClick={() => setNumpadTarget({ product: item, mode: "edit", qty: item.qty })}>{item.qty}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", minWidth: 52, textAlign: "right" }}>${fmt(item.price * item.qty)}</div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Discount */}
        <div>
          <div className="fl">Discount ($)</div>
          <input className="inp" type="number" placeholder="0.00" value={discount} onChange={(e) => setDiscount(e.target.value)} min={0} max={subtotal} />
        </div>

        {/* Totals */}
        <div style={{ background: "#050f1f", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#475569", marginBottom: 6 }}><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          {discountAmt > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#fbbf24", marginBottom: 6 }}><span>Discount</span><span>-${fmt(discountAmt)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#38bdf8", borderTop: "1px solid #1a2540", paddingTop: 10, marginTop: 6 }}><span>TOTAL</span><span>${fmt(total)}</span></div>
        </div>

        {/* Customer */}
        <div>
          <div className="fl">Customer</div>
          <select className="sel" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.balance > 0 ? ` (owes $${fmt(c.balance)})` : ""}</option>)}
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
            <div className="fl">Cash Received</div>
            <input className="inp" type="number" placeholder={`Min $${fmt(total)}`} value={cashPaid} onChange={(e) => setCashPaid(e.target.value)} />
            {cashPaid && +cashPaid >= total && <div style={{ fontSize: 12, color: "#34d399", marginTop: 4 }}>Change: ${fmt(+cashPaid - total)}</div>}
          </div>
        )}
        {payMode === "account" && customer && (
          <div style={{ background: "#1a2540", borderRadius: 9, padding: 10, fontSize: 12, color: "#94a3b8" }}>
            Full ${fmt(total)} added to <strong style={{ color: "#f87171" }}>{customer.name}'s</strong> account.
            New balance: <strong style={{ color: "#f87171" }}>${fmt((customer.balance || 0) + total)}</strong>
          </div>
        )}
        {payMode === "partial" && (
          <div>
            <div className="fl">Cash Amount</div>
            <input className="inp" type="number" placeholder="Cash paid..." value={partialCash} onChange={(e) => setPartialCash(e.target.value)} min={0} />
            {partialCash && <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 4 }}>On account: ${fmt(Math.max(0, total - Math.min(+partialCash, total)))}</div>}
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
                {receipt.items.map((i) => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>{i.name}<br /><span style={{ fontSize: 11, color: "#666" }}>x{i.qty} @ ${fmt(i.price)}</span></span>
                    <span style={{ fontWeight: 700 }}>${fmt(i.total)}</span>
                  </div>
                ))}
              </div>
              {receipt.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>Discount</span><span>-${fmt(receipt.discount)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 6 }}><span>TOTAL</span><span>${fmt(receipt.total)}</span></div>
              {receipt.paid > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}><span>Cash Paid</span><span>${fmt(receipt.paid)}</span></div>}
              {receipt.change > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>Change</span><span>${fmt(receipt.change)}</span></div>}
              {receipt.credit > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#c00", marginTop: 4 }}><span>On Account (debit)</span><span>${fmt(receipt.credit)}</span></div>}
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
    </div>
  );
}

/* ─── INVENTORY ─────────────────────────────────────────────────────────── */
function InventoryView({ products, setProducts }) {
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
    const prod = { ...form, price: +form.price, cost: +form.cost || 0, stock: +form.stock };
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
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>Inventory</div><div style={{ fontSize: 13, color: "#64748b" }}>{products.length} products · ${fmt(products.reduce((a, p) => a + p.cost * p.stock, 0))} stock value</div></div>
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
                    <td style={{ color: "#38bdf8", fontWeight: 700 }}>${fmt(p.price)}</td>
                    <td style={{ color: "#64748b" }}>${fmt(p.cost)}</td>
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#f1f5f9" }}>{modal === "add" ? "➕ Add Product" : "✏️ Edit Product"}</div>
            <div className="fg"><label className="fl">Product Name *</label><input className="inp" placeholder="Product name" {...F("name")} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="fg"><label className="fl">SKU / Code</label><input className="inp" placeholder="e.g. CC001" {...F("sku")} /></div>
              <div className="fg"><label className="fl">Category</label><input className="inp" placeholder="e.g. Beverages" {...F("cat")} /></div>
              <div className="fg"><label className="fl">Sell Price *</label><input className="inp" type="number" step="0.01" placeholder="0.00" {...F("price")} /></div>
              <div className="fg"><label className="fl">Cost Price</label><input className="inp" type="number" step="0.01" placeholder="0.00" {...F("cost")} /></div>
              <div className="fg"><label className="fl">Stock Qty *</label><input className="inp" type="number" placeholder="0" {...F("stock")} /></div>
              <div className="fg"><label className="fl">Unit</label><input className="inp" placeholder="pcs, kg, L, box..." {...F("unit")} /></div>
            </div>
            {form.price && form.cost && <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
              Margin: <strong style={{ color: "#34d399" }}>{(((+form.price - +form.cost) / +form.price) * 100).toFixed(1)}%</strong> · Profit per unit: <strong style={{ color: "#34d399" }}>${fmt(+form.price - +form.cost)}</strong>
            </div>}
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
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#f1f5f9" }}>Stock Adjustment</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>{p.name} · Current: <strong style={{ color: "#38bdf8" }}>{p.stock} {p.unit}</strong></div>
              <div className="fg"><label className="fl">Adjustment (+/-)</label>
                <input className="inp" type="number" placeholder="e.g. +10 or -3" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} autoFocus />
              </div>
              {adjQty && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>New stock: <strong style={{ color: "#38bdf8" }}>{Math.max(0, p.stock + (+adjQty || 0))} {p.unit}</strong></div>}
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
function PurchaseView({ products, setProducts, purchases, setPurchases }) {
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([{ productId: "", qty: 1, cost: 0 }]);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState(null);

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
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>Purchase Stock</div><div style={{ fontSize: 13, color: "#64748b" }}>Record incoming inventory from suppliers</div></div>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const data = purchases.map((pu) => ({ Date: fmtDate(pu.date), Supplier: pu.supplier, Items: pu.items.map((i) => `${i.name}×${i.qty}`).join(", "), Total: pu.total, Note: pu.note || "" }));
          exportXLSX(data, ["Date", "Supplier", "Items", "Total", "Note"], "purchases.xlsx");
        }}>📤 Export Purchases</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#f1f5f9" }}>📥 New Purchase</div>
          {msg && <div className={msg.type === "error" ? "alert-r" : "alert-g"} style={{ marginBottom: 12 }}>{msg.text}</div>}
          <div className="fg"><label className="fl">Supplier *</label><input className="inp" placeholder="Supplier / vendor name" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>Items</div>
          {items.map((item, idx) => (
            <div key={idx} style={{ background: "#0f172a", borderRadius: 9, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                <select className="sel" style={{ flex: 1 }} value={item.productId} onChange={(e) => onProductChange(idx, e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
                {items.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>✕</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div><div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>QTY</div><input className="inp" type="number" value={item.qty} min={1} onChange={(e) => updateItem(idx, "qty", e.target.value)} /></div>
                <div><div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>COST/UNIT ($)</div><input className="inp" type="number" step="0.01" value={item.cost} min={0} onChange={(e) => updateItem(idx, "cost", e.target.value)} /></div>
              </div>
              {item.productId && <div style={{ fontSize: 11, color: "#34d399", marginTop: 5 }}>Subtotal: ${fmt((+item.qty || 0) * (+item.cost || 0))}</div>}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={addItem}>+ Add Another Item</button>
          <div className="fg"><label className="fl">Note (optional)</label><input className="inp" placeholder="Reference, invoice number..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #2d3f55", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Total Cost</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: "#38bdf8" }}>${fmt(total)}</span>
          </div>
          <button className="btn btn-success" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={completePurchase}>📥 Record Purchase</button>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#f1f5f9" }}>Purchase History</div>
          {recent.length === 0 ? <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No purchases yet</div>
            : recent.map((pu) => (
              <div key={pu.id} style={{ background: "#0f172a", borderRadius: 9, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>{pu.supplier}</span>
                  <span style={{ fontWeight: 700, color: "#38bdf8" }}>${fmt(pu.total)}</span>
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
function CustomersView({ customers, setCustomers, txns, setTxns, sales }) {
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
  const openAdd = () => { setForm({ name: "", phone: "", email: "" }); setModal("add"); };
  const save = () => {
    if (!form.name) return;
    if (modal === "add") setCustomers((cs) => [...cs, { ...form, id: uid(), balance: 0, since: Date.now() }]);
    else setCustomers((cs) => cs.map((c) => c.id === modal ? { ...c, ...form } : c));
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
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{c.phone && c.phone} {c.email && `· ${c.email}`}</div>
            </div>
          </div>
          <div style={{ background: c.balance > 0 ? "#450a0a" : "#052e16", borderRadius: 12, padding: "12px 20px", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>Balance</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.balance > 0 ? "#f87171" : "#34d399" }}>
              {c.balance > 0 ? `Owes $${fmt(c.balance)}` : "Clear ✅"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Total purchased: ${fmt(totalPurchased)}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: c.balance > 0 ? "1fr 1fr" : "1fr", gap: 14 }}>
          {c.balance > 0 && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#f1f5f9" }}>💳 Record Payment</div>
              <div className="fg"><label className="fl">Amount</label><input className="inp" type="number" placeholder="0.00" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} /></div>
              <div className="fg"><label className="fl">Note</label><input className="inp" placeholder="e.g. Cash payment" value={payNote} onChange={(e) => setPayNote(e.target.value)} /></div>
              {payAmt && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                Remaining balance: <strong style={{ color: +payAmt >= c.balance ? "#34d399" : "#f87171" }}>${fmt(Math.max(0, c.balance - +payAmt))}</strong>
              </div>}
              <button className="btn btn-success" style={{ width: "100%", justifyContent: "center" }} onClick={() => makePayment(c)}>✅ Record Payment</button>
            </div>
          )}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#f1f5f9" }}>➕ Manual Debit</div>
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
                      <td style={{ fontWeight: 700, color: t.type === "debit" ? "#f87171" : "#34d399" }}>{t.type === "debit" ? "+" : "-"}${fmt(t.amount)}</td>
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
                      <td style={{ fontSize: 12, color: "#94a3b8", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.items.map((i) => `${i.name}×${i.qty}`).join(", ")}</td>
                      <td style={{ color: "#38bdf8", fontWeight: 700 }}>${fmt(s.total)}</td>
                      <td style={{ color: "#34d399" }}>${fmt(s.paid)}</td>
                      <td style={{ color: s.credit > 0 ? "#f87171" : "#64748b" }}>{s.credit > 0 ? `$${fmt(s.credit)}` : "—"}</td>
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
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>Customers</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{customers.length} customers · ${fmt(customers.reduce((a, c) => a + c.balance, 0))} total outstanding</div>
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
                <td><span className={`tag ${c.balance > 0 ? "tag-red" : "tag-green"}`}>{c.balance > 0 ? `Owes $${fmt(c.balance)}` : "Clear"}</span></td>
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
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#f1f5f9" }}>{modal === "add" ? "➕ Add Customer" : "✏️ Edit Customer"}</div>
            <div className="fg"><label className="fl">Full Name *</label><input className="inp" placeholder="Customer name" {...F("name")} /></div>
            <div className="fg"><label className="fl">Phone</label><input className="inp" placeholder="Phone number" {...F("phone")} /></div>
            <div className="fg"><label className="fl">Email</label><input className="inp" placeholder="Email address" {...F("email")} /></div>
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
function HistoryView({ sales, products }) {
  const [tab, setTab] = useState("sales");
  const sorted = [...sales].sort((a, b) => b.date - a.date);
  const totalRev = sales.reduce((a, s) => a + s.total, 0);
  const totalCash = sales.reduce((a, s) => a + s.paid, 0);
  const totalCredit = sales.reduce((a, s) => a + (s.credit || 0), 0);
  const totalProfit = sales.reduce((a, s) => a + s.items.reduce((b, i) => {
    const p = products.find((x) => x.id === i.id);
    return b + (i.price - (p?.cost || 0)) * i.qty;
  }, 0), 0);

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>History & Reports</div><div style={{ fontSize: 13, color: "#64748b" }}>{sales.length} total transactions</div></div>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const data = sorted.map((s) => ({ Date: fmtDate(s.date), Time: fmtTime(s.date), Customer: s.customerName, Items: s.items.map((i) => `${i.name}×${i.qty}`).join(", "), Subtotal: s.subtotal, Discount: s.discount, Total: s.total, Paid: s.paid, "On Account": s.credit, Change: s.change, Method: s.payMode }));
          exportXLSX(data, ["Date", "Time", "Customer", "Items", "Subtotal", "Discount", "Total", "Paid", "On Account", "Change", "Method"], "sales.xlsx");
        }}>📤 Export Sales</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13 }}>
        {[
          { label: "Total Revenue", val: `$${fmt(totalRev)}`, c: "#38bdf8" },
          { label: "Cash Collected", val: `$${fmt(totalCash)}`, c: "#34d399" },
          { label: "On Account", val: `$${fmt(totalCredit)}`, c: "#f87171" },
          { label: "Est. Profit", val: `$${fmt(totalProfit)}`, c: "#c084fc" },
        ].map((s) => (
          <div key={s.label} className="stat">
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #1a2540" }}>
          <div style={{ display: "flex", gap: 20 }}>
            {["sales"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#38bdf8" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", paddingBottom: 12, borderBottom: tab === t ? "2px solid #38bdf8" : "2px solid transparent", textTransform: "capitalize" }}>Sales ({sales.length})</button>
            ))}
          </div>
        </div>
        <table>
          <thead><tr><th>Date & Time</th><th>Customer</th><th>Items</th><th>Total</th><th>Cash</th><th>On Account</th><th>Change</th><th>Method</th></tr></thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "#475569", padding: "40px" }}>No sales yet — complete your first sale to see history here.</td></tr>
            ) : sorted.map((s) => (
              <tr key={s.id}>
                <td><div style={{ fontSize: 12.5 }}>{fmtDate(s.date)}</div><div style={{ fontSize: 11, color: "#475569" }}>{fmtTime(s.date)}</div></td>
                <td style={{ fontWeight: 500 }}>{s.customerName}</td>
                <td style={{ fontSize: 11.5, color: "#94a3b8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.items.map((i) => `${i.name}×${i.qty}`).join(", ")}</td>
                <td style={{ color: "#38bdf8", fontWeight: 700 }}>${fmt(s.total)}</td>
                <td style={{ color: "#34d399" }}>${fmt(s.paid)}</td>
                <td style={{ color: s.credit > 0 ? "#f87171" : "#64748b" }}>{s.credit > 0 ? `$${fmt(s.credit)}` : "—"}</td>
                <td style={{ color: "#64748b" }}>{s.change > 0 ? `$${fmt(s.change)}` : "—"}</td>
                <td><span className={`tag ${s.payMode === "cash" ? "tag-blue" : s.payMode === "account" ? "tag-red" : "tag-amber"}`}>{s.payMode === "cash" ? "💵 Cash" : s.payMode === "account" ? "📋 Account" : "✂️ Split"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
