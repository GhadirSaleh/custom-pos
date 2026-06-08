import { useState, useRef } from "react";
import uid from "../utils/uid.js";
import { fmt, fmtDate, fmtTime } from "../utils/format.js";
import { baseCur } from "../utils/pricing.js";
import { catIcon } from "../utils/constants.js";
import { importXLSX, exportXLSX } from "../utils/xlsx.js";
import { Numpad, CashNumpad } from "./Numpad.jsx";

export default function PurchaseView({ products, setProducts, purchases, setPurchases, vendors, currencies }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [vendorId, setVendorId] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [cashPaid, setCashPaid] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState("");
  const [numpadTarget, setNumpadTarget] = useState(null);
  const [cashNumpadOpen, setCashNumpadOpen] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);
  const base = baseCur(currencies);

  const cats = ["All", ...Array.from(new Set(products.map((p) => p.cat)))];
  const filtered = products.filter((p) =>
    (catFilter === "All" || p.cat === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const updateQty = (id, qty) => {
    if (qty <= 0) { setCart((c) => c.filter((i) => i.id !== id)); return; }
    setCart((c) => c.map((i) => i.id === id ? { ...i, qty } : i));
  };

  const updateCost = (id, cost) => {
    setCart((c) => c.map((i) => i.id === id ? { ...i, costPrice: +cost || 0 } : i));
  };

  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const subtotal = cart.reduce((a, i) => a + i.costPrice * i.qty, 0);
  const total = subtotal;
  const vendor = vendors.find((v) => v.id === vendorId);

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
        setPurchases((ps) => [...ps, { id: uid(), date: Date.now(), vendorId: "", vendorName: supplier, note: r.Note || r.note || "", items, total: items.reduce((a, i) => a + i.qty * i.cost, 0), paid: 0, credit: total, change: 0, payMode: "credit" }]);
        added++;
      });
      setImportMsg({ type: "success", text: `✅ Imported ${added} purchase records` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  const exportPurchases = () => {
    const data = purchases.map((pu) => ({ Date: fmtDate(pu.date), Vendor: pu.vendorName || pu.supplier, Items: pu.items.map((i) => `${i.name}×${i.qty}`).join(", "), Total: pu.total, Paid: pu.paid || 0, Credit: pu.credit || 0, Method: pu.payMode || "credit" }));
    exportXLSX(data, ["Date", "Vendor", "Items", "Total", "Paid", "Credit", "Method"], "purchases.xlsx");
  };

  const completePurchase = () => {
    setErr("");
    if (cart.length === 0) { setErr("Cart is empty"); return; }
    if (!vendor) { setErr("Select a vendor"); return; }
    let paid = 0, credit = 0, change = 0;
    if (payMode === "cash") {
      paid = +(cashPaid) || 0;
      if (paid < total) { setErr(`Cash paid (${fmt(paid)} ${base.symbol}) is less than total (${fmt(total)} ${base.symbol})`); return; }
      change = paid - total; paid = total;
    } else {
      credit = total;
    }
    const purchaseId = uid(), now = Date.now();
    setProducts((ps) => ps.map((p) => {
      const item = cart.find((i) => i.id === p.id);
      return item ? { ...p, stock: p.stock + item.qty, cost: item.costPrice || p.cost } : p;
    }));
    const newPurchase = {
      id: purchaseId, date: now, vendorId, vendorName: vendor.name,
      items: cart.map((i) => ({ productId: i.id, name: i.name, qty: i.qty, cost: i.costPrice, total: i.costPrice * i.qty })),
      subtotal, total, paid, credit, change, payMode
    };
    setPurchases((ps) => [...ps, newPurchase]);
    setReceipt(newPurchase);
    setCart([]); setCashPaid(""); setVendorId(""); setPayMode("cash");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "18px 18px 18px 60px", overflow: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 16 }}>🔍</span>
            <input className="inp" style={{ paddingLeft: 34 }} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importPurchases} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={exportPurchases}>📤 Export</button>
        </div>
        {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"} style={{ marginBottom: 4 }}>{importMsg.text}</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "10px 20px", borderRadius: 24, border: "2px solid", borderColor: catFilter === c ? "#0284c7" : "#475569", background: catFilter === c ? "#e0f2fe" : "transparent", color: catFilter === c ? "#0369a1" : "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 42 }}>
              {catIcon(c)} {c}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
          {filtered.map((p) => (
            <div key={p.id} className="prod-card" onClick={() => setNumpadTarget({ product: p, mode: "add" })}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, textAlign: "center", marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#059669" }}>{fmt(p.cost)} {base.symbol}</div>
              <div style={{ fontSize: 11, color: p.stock <= 5 ? "#d97706" : "#475569", marginTop: 2 }}>
                Stock: {p.stock} {p.unit}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#475569", padding: "30px 0", fontSize: 13 }}>No products found</div>}
        </div>
      </div>

      <div style={{ width: 340, display: "flex", flexDirection: "column", padding: "18px 16px 16px 60px", gap: 12, background: "#f8fafc", overflow: "hidden" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📥 Purchase Cart {cart.length > 0 && `(${cart.length})`}</span>
          {cart.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>Clear</button>}
        </div>

        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", paddingTop: 40, fontSize: 13 }}>Tap products to add</div>
          ) : cart.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: "#64748b" }}>Cost:</span>
                  <input type="number" step="0.01" min={0} value={item.costPrice}
                    onChange={(e) => updateCost(item.id, e.target.value)}
                    style={{ width: 60, padding: "2px 6px", borderRadius: 5, border: "1px solid #cbd5e1", background: "#fff", color: "#059669", fontSize: 12, fontWeight: 600, outline: "none", textAlign: "right" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 16, fontWeight: 700, minWidth: 28, textAlign: "center", cursor: "pointer", color: "#0284c7" }} onClick={() => setNumpadTarget({ product: item, mode: "edit", qty: item.qty })}>{item.qty}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#059669", minWidth: 52, textAlign: "right" }}>{fmt(item.costPrice * item.qty)} {base.symbol}</div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#059669", paddingTop: 10, marginTop: 6 }}>
            <span>TOTAL ({base.code})</span><span>{fmt(total)} {base.symbol}</span>
          </div>
        </div>

        <div>
          <div className="fl">Vendor *</div>
          <select className="sel" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
            <option value="">Select vendor...</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        <div>
          <div className="fl">Payment Method</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={`ptab ${payMode === "cash" ? "on" : ""}`} onClick={() => setPayMode("cash")}>💵 Cash</button>
            <button className={`ptab ${payMode === "credit" ? "on" : ""}`} onClick={() => setPayMode("credit")}>📋 Pay Later</button>
          </div>
        </div>

        {payMode === "cash" && (
          <div>
            <div className="fl">Cash Paid ({base.code})</div>
            <button onClick={() => setCashNumpadOpen(true)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 9, border: "1px solid #e2e8f0",
              background: cashPaid && +cashPaid >= total ? "#d1fae5" : "#f8fafc",
              color: cashPaid && +cashPaid >= total ? "#065f46" : "#1e293b",
              fontSize: 16, fontWeight: 700, cursor: "pointer", textAlign: "left",
              fontFamily: "'DM Mono',monospace", letterSpacing: 1
            }}>
              {cashPaid ? `${fmt(+cashPaid)} ${base.symbol}` : `Tap to enter (${fmt(total)} ${base.symbol})`}
            </button>
            {cashPaid && +cashPaid >= total && <div style={{ fontSize: 12, color: "#059669", marginTop: 4 }}>Change: {fmt(+cashPaid - total)} {base.symbol}</div>}
            {cashPaid && +cashPaid < total && <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>Short: need {fmt(total - +cashPaid)} {base.symbol} more</div>}
          </div>
        )}
        {payMode === "credit" && vendor && (
          <div style={{ background: "#f8fafc", borderRadius: 9, padding: 10, fontSize: 12, color: "#64748b" }}>
            Full {fmt(total)} {base.symbol} owed to <strong style={{ color: "#d97706" }}>{vendor.name}</strong>. Pay later.
          </div>
        )}

        {err && <div className="alert-r">{err}</div>}
        <button className="btn btn-success" style={{ width: "100%", padding: "14px", fontSize: 15, justifyContent: "center", minHeight: 50 }} onClick={completePurchase}>
          📥 Record Purchase
        </button>
      </div>

      {receipt && (
        <div className="roverlay" onClick={() => setReceipt(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div className="receipt">
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>⚡ QuickPOS</div>
                <div style={{ color: "#555", fontSize: 11 }}>--- PURCHASE ORDER ---</div>
                <div style={{ color: "#555", fontSize: 11 }}>{fmtDate(receipt.date)} {fmtTime(receipt.date)}</div>
                <div style={{ color: "#555", fontSize: 11 }}>#{receipt.id.slice(-10).toUpperCase()}</div>
              </div>
              <div style={{ borderTop: "1px dashed #aaa", borderBottom: "1px dashed #aaa", padding: "10px 0", margin: "8px 0" }}>
                {receipt.items.map((i) => (
                  <div key={i.productId || i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>{i.name}<br /><span style={{ fontSize: 11, color: "#666" }}>x{i.qty} @ {fmt(i.cost)}{base.symbol}</span></span>
                    <span style={{ fontWeight: 700 }}>{fmt(i.total || i.cost * i.qty)}{base.symbol}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 6 }}>
                <span>TOTAL</span><span>{fmt(receipt.total)}{base.symbol}</span>
              </div>
              {receipt.paid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                  <span>Cash Paid</span><span>{fmt(receipt.paid)}{base.symbol}</span>
                </div>
              )}
              {receipt.change > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Change</span><span>{fmt(receipt.change)}{base.symbol}</span>
                </div>
              )}
              {receipt.credit > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#d97706", marginTop: 4 }}>
                  <span>Pay Later</span><span>{fmt(receipt.credit)}{base.symbol}</span>
                </div>
              )}
              <div style={{ textAlign: "center", marginTop: 14, borderTop: "1px dashed #aaa", paddingTop: 10, fontSize: 11, color: "#555" }}>
                Vendor: {receipt.vendorName || receipt.supplier}<br />Stock updated
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: 340, justifyContent: "center" }} onClick={() => setReceipt(null)}>Close</button>
          </div>
        </div>
      )}

      {numpadTarget && (
        <Numpad
          target={numpadTarget}
          onConfirm={(qty) => {
            if (numpadTarget.mode === "add") {
              const p = numpadTarget.product;
              setCart((c) => {
                const ex = c.find((i) => i.id === p.id);
                const newQty = ex ? ex.qty + qty : qty;
                if (ex) return c.map((i) => i.id === p.id ? { ...i, qty: newQty } : i);
                return [...c, { ...p, qty: newQty, costPrice: p.cost }];
              });
            } else {
              updateQty(numpadTarget.product.id, qty);
            }
            setNumpadTarget(null);
          }}
          onCancel={() => setNumpadTarget(null)}
        />
      )}

      {cashNumpadOpen && (
        <CashNumpad
          total={total}
          cur={base}
          onConfirm={(cash) => { setCashPaid(cash); setCashNumpadOpen(false); }}
          onCancel={() => setCashNumpadOpen(false)}
        />
      )}
    </div>
  );
}
