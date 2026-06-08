import { useState, useRef } from "react";
import uid from "../utils/uid.js";
import { fmt } from "../utils/format.js";
import { baseCur } from "../utils/pricing.js";
import { exportXLSX, importXLSX } from "../utils/xlsx.js";

export default function InventoryView({ products, setProducts, currencies, pricelists }) {
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
