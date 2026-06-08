import { useState, useRef } from "react";
import uid from "../utils/uid.js";
import { exportXLSX, importXLSX } from "../utils/xlsx.js";

export default function VendorsView({ vendors, setVendors }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);

  const exportVendors = () => {
    const data = vendors.map((v) => ({ Name: v.name, Phone: v.phone || "", Email: v.email || "", Contact: v.contact || "" }));
    exportXLSX(data, ["Name", "Phone", "Email", "Contact"], "vendors.xlsx");
  };

  const importVendors = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importXLSX(file);
      let added = 0;
      setVendors((vs) => {
        const next = [...vs];
        rows.forEach((r) => {
          const name = r.Name || r.name || "";
          if (!name) return;
          const idx = next.findIndex((v) => v.name.toLowerCase() === name.toLowerCase());
          if (idx >= 0) {
            next[idx] = { ...next[idx], phone: r.Phone || r.phone || next[idx].phone, email: r.Email || r.email || next[idx].email, contact: r.Contact || r.contact || next[idx].contact };
          } else {
            next.push({ id: uid(), name, phone: r.Phone || r.phone || "", email: r.Email || r.email || "", contact: r.Contact || r.contact || "" });
            added++;
          }
        });
        return next;
      });
      setImportMsg({ type: "success", text: `✅ Imported ${added} vendors` });
    } catch {
      setImportMsg({ type: "error", text: "❌ Failed to import file" });
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 5000);
  };

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.phone || "").includes(search) ||
    (v.contact || "").toLowerCase().includes(search)
  );
  const openAdd = () => { setForm({ name: "", phone: "", email: "", contact: "" }); setModal("add"); };
  const openEdit = (v) => { setForm({ ...v }); setModal(v.id); };
  const save = () => {
    if (!form.name) return;
    if (modal === "add") setVendors((vs) => [...vs, { ...form, id: uid() }]);
    else setVendors((vs) => vs.map((v) => v.id === modal ? { ...v, ...form } : v));
    setModal(null);
  };
  const del = (id) => { if (confirm("Delete this vendor?")) setVendors((vs) => vs.filter((v) => v.id !== id)); };
  const F = (k) => ({ value: form[k] || "", onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <div className="ppage">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>🏭 Vendors</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{vendors.length} vendors</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importVendors} />
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>📥 Import</button>
          <button className="btn btn-ghost btn-sm" onClick={exportVendors}>📤 Export</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Vendor</button>
        </div>
      </div>
      {importMsg && <div className={importMsg.type === "error" ? "alert-r" : "alert-g"}>{importMsg.text}</div>}
      <div className="card" style={{ padding: "12px 16px" }}>
        <input className="inp" placeholder="Search by name, phone, or contact..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Contact</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td style={{ color: "#64748b" }}>{v.phone || "—"}</td>
                <td style={{ color: "#64748b" }}>{v.email || "—"}</td>
                <td style={{ color: "#475569" }}>{v.contact || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(v.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#475569", padding: "30px" }}>No vendors found</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>{modal === "add" ? "➕ Add Vendor" : "✏️ Edit Vendor"}</div>
            <div className="fg"><label className="fl">Vendor Name *</label><input className="inp" placeholder="Vendor name" {...F("name")} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="fg"><label className="fl">Phone</label><input className="inp" placeholder="Phone number" {...F("phone")} /></div>
              <div className="fg"><label className="fl">Email</label><input className="inp" placeholder="Email address" {...F("email")} /></div>
            </div>
            <div className="fg"><label className="fl">Contact Person</label><input className="inp" placeholder="Contact name" {...F("contact")} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save}>Save Vendor</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
