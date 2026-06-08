import { fmt, fmtDate, fmtTime } from "../utils/format.js";
import { baseCur } from "../utils/pricing.js";

export default function Dashboard({ products, customers, sales, setView, currencies }) {
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
