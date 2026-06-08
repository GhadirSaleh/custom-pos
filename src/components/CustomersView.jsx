import { useState, useRef } from "react";
import uid from "../utils/uid.js";
import { fmt, fmtDate, fmtTime } from "../utils/format.js";
import { baseCur } from "../utils/pricing.js";
import { exportXLSX, importXLSX } from "../utils/xlsx.js";

export default function CustomersView({ customers, setCustomers, txns, setTxns, sales, currencies, pricelists }) {
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
