import { useState, useRef } from "react";
import { baseCur } from "../utils/pricing.js";
import { exportXLSX, importXLSX } from "../utils/xlsx.js";

export default function CurrenciesView({ currencies, setCurrencies }) {
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
