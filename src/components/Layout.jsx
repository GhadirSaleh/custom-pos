import CSS from "../styles.js";

const NAV = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "sell", icon: "🛒", label: "Sell" },
  { id: "inventory", icon: "📦", label: "Inventory" },
  { id: "purchase", icon: "🛍️", label: "Purchase" },
  { id: "customers", icon: "👥", label: "Customers" },
  { id: "vendors", icon: "🏭", label: "Vendors" },
  { id: "history", icon: "📋", label: "History" },
  { id: "currencies", icon: "💱", label: "Currencies" },
  { id: "pricelists", icon: "🏷️", label: "Pricelists" },
];

export default function Layout({ view, setView, sidebarOpen, setSidebarOpen, children }) {
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc", color: "#1e293b", overflow: "hidden" }}>
      <style>{CSS}</style>
      <aside style={{ width: sidebarOpen ? 220 : 0, background: "#ffffff", borderRight: sidebarOpen ? "1px solid #e2e8f0" : "none", padding: sidebarOpen ? "18px 12px" : "0 0", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, overflow: "hidden", transition: "all .2s ease", whiteSpace: "nowrap" }}>
        <div style={{ padding: "12px 16px 20px", borderBottom: "1px solid #e2e8f0", marginBottom: 8 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#0f172a", letterSpacing: "-.02em" }}>⚡ QuickPOS</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Point of Sale System</div>
        </div>
        {NAV.map((n) => (
          <button key={n.id} className={`nav ${view === n.id ? "on" : ""}`} onClick={() => setView(n.id)}>
            <span style={{ fontSize: 18 }}>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "14px 16px", borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#94a3b8" }}>
          v1.0 · All data saved locally
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          position: "absolute", top: 14, left: sidebarOpen ? 228 : 8, zIndex: 100,
          width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0",
          background: "#ffffff", color: "#1e293b", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "left .2s ease", boxShadow: "0 1px 3px rgba(0,0,0,.1)"
        }}>☰</button>
        {children}
      </main>
    </div>
  );
}
