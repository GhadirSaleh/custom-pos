import { useState, useRef } from "react";
import { fmt, fmtDate, fmtTime } from "../utils/format.js";
import { baseCur } from "../utils/pricing.js";
import { exportXLSX, importXLSX } from "../utils/xlsx.js";
import uid from "../utils/uid.js";

export default function HistoryView({ sales, setSales, products, currencies }) {
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
