import { useState, useRef } from "react";
import uid from "../utils/uid.js";
import { fmt } from "../utils/format.js";
import { baseCur, applyFormula } from "../utils/pricing.js";
import { FORMULA_OPTIONS, ROUNDING_OPTIONS } from "../utils/constants.js";
import { exportXLSX, importXLSX } from "../utils/xlsx.js";

export default function PricelistsView({ pricelists, setPricelists, products, setProducts, currencies }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

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

  const del = (id) => {
    if (!confirm("Delete this pricelist?")) return;
    setPricelists((ps) => ps.filter((p) => p.id !== id));
      setProducts((ps) => ps.map((p) => { if (!p.prices) return p; const copy = { ...p.prices }; delete copy[id]; return { ...p, prices: copy }; }));
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
