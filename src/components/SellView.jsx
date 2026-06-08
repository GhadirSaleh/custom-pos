import { useState } from "react";
import uid from "../utils/uid.js";
import { fmt, fmtc, fmtDate, fmtTime } from "../utils/format.js";
import { convertPrice, baseCur, applyFormula } from "../utils/pricing.js";
import { catIcon } from "../utils/constants.js";
import { Numpad, CashNumpad } from "./Numpad.jsx";

export default function SellView({ products, setProducts, customers, setCustomers, setSales, setTxns, currencies, pricelists }) {
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
    const now = /* eslint-disable-line react-hooks/purity */ Date.now();
    const saleId = uid();
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

      <div style={{ width: 340, display: "flex", flexDirection: "column", padding: "18px 16px 16px 60px", gap: 12, background: "#f8fafc", overflow: "hidden" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🛒 Cart {cart.length > 0 && `(${cart.length})`}</span>
          {cart.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>Clear</button>}
        </div>

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

        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#0284c7", paddingTop: 10, marginTop: 6 }}><span>TOTAL ({cur.code})</span><span>{fmtCur(total)}</span></div>
        </div>

        <div>
          <div className="fl">Customer</div>
          <select className="sel" value={customerId} onChange={(e) => { const cId = e.target.value; setCustomerId(cId); const c = customers.find((x) => x.id === cId); if (c?.pricelistId) setSalePricelist(c.pricelistId); }}>
            <option value="">Walk-in</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.balance > 0 ? ` (owes ${fmt(c.balance)} ${base.symbol})` : ""}</option>)}
          </select>
        </div>

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
              {partialCash ? fmtCur(+partialCash) : "Tap to enter"}
            </button>
            {partialCash && <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>On account: {fmtCur(Math.max(0, total - Math.min(+partialCash, total)))}</div>}
          </div>
        )}

        {err && <div className="alert-r">{err}</div>}
        <button className="btn btn-success" style={{ width: "100%", padding: "14px", fontSize: 15, justifyContent: "center", minHeight: 50 }} onClick={completeSale}>
          ✅ Complete Sale
        </button>
      </div>

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
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 6 }}>
                <span>TOTAL ({receipt.currency || "USD"})</span>
                <span>{fmt(receipt.total * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span>
              </div>
              {receipt.paid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                  <span>Cash Paid</span>
                  <span>{fmt(receipt.paid * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span>
                </div>
              )}
              {receipt.change > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Change</span>
                  <span>{fmt(receipt.change * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span>
                </div>
              )}
              {receipt.credit > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#c00", marginTop: 4 }}>
                  <span>On Account (debit)</span>
                  <span>{fmt(receipt.credit * (receipt.currencyRate || 1))}{receipt.currencySymbol || "$"}</span>
                </div>
              )}
              <div style={{ textAlign: "center", marginTop: 14, borderTop: "1px dashed #aaa", paddingTop: 10, fontSize: 11, color: "#555" }}>
                Customer: {receipt.customerName}<br />Thank you for shopping!
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: 340, justifyContent: "center" }} onClick={() => setReceipt(null)}>Close Receipt</button>
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
