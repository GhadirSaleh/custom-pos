import { useState, useEffect } from "react";

import { KEYS, SEED_PRODUCTS, SEED_CUSTOMERS, SEED_CURRENCIES, SEED_PRICELISTS, SEED_VENDORS } from "./utils/constants.js";
import Layout from "./components/Layout.jsx";
import Dashboard from "./components/Dashboard.jsx";
import SellView from "./components/SellView.jsx";
import InventoryView from "./components/InventoryView.jsx";
import PurchaseView from "./components/PurchaseView.jsx";
import CustomersView from "./components/CustomersView.jsx";
import VendorsView from "./components/VendorsView.jsx";
import HistoryView from "./components/HistoryView.jsx";
import CurrenciesView from "./components/CurrenciesView.jsx";
import PricelistsView from "./components/PricelistsView.jsx";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [sales, setSales] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [txns, setTxns] = useState(null);
  const [currencies, setCurrencies] = useState(null);
  const [pricelists, setPricelists] = useState(null);
  const [vendors, setVendors] = useState(null);

  useEffect(() => {
    const load = async () => {
      const get = async (key, fb) => {
        try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fb; } catch { return fb; }
      };
      setProducts(await get(KEYS.p, SEED_PRODUCTS));
      setCustomers(await get(KEYS.c, SEED_CUSTOMERS));
      setSales(await get(KEYS.s, []));
      setPurchases(await get(KEYS.pu, []));
      setTxns(await get(KEYS.t, []));
      setCurrencies(await get(KEYS.cr, SEED_CURRENCIES));
      setPricelists(await get(KEYS.pl, SEED_PRICELISTS));
      setVendors(await get(KEYS.v, SEED_VENDORS));
    };
    load();
  }, []);

  useEffect(() => { if (products) window.storage.set(KEYS.p, JSON.stringify(products)).catch(() => {}); }, [products]);
  useEffect(() => { if (customers) window.storage.set(KEYS.c, JSON.stringify(customers)).catch(() => {}); }, [customers]);
  useEffect(() => { if (sales) window.storage.set(KEYS.s, JSON.stringify(sales)).catch(() => {}); }, [sales]);
  useEffect(() => { if (purchases) window.storage.set(KEYS.pu, JSON.stringify(purchases)).catch(() => {}); }, [purchases]);
  useEffect(() => { if (txns) window.storage.set(KEYS.t, JSON.stringify(txns)).catch(() => {}); }, [txns]);
  useEffect(() => { if (currencies) window.storage.set(KEYS.cr, JSON.stringify(currencies)).catch(() => {}); }, [currencies]);
  useEffect(() => { if (pricelists) window.storage.set(KEYS.pl, JSON.stringify(pricelists)).catch(() => {}); }, [pricelists]);
  useEffect(() => { if (vendors) window.storage.set(KEYS.v, JSON.stringify(vendors)).catch(() => {}); }, [vendors]);

  if (!products || !customers || !sales || !purchases || !txns || !currencies || !pricelists || !vendors)
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc", color: "#64748b", fontFamily: "sans-serif", fontSize: 16, gap: 12 }}>
      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Loading QuickPOS...
    </div>;

  const ctx = { products, setProducts, customers, setCustomers, sales, setSales, purchases, setPurchases, txns, setTxns, currencies, setCurrencies, pricelists, setPricelists, vendors, setVendors, setView };

  return (
    <Layout view={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      {view === "dashboard" && <Dashboard {...ctx} />}
      {view === "sell" && <SellView {...ctx} />}
      {view === "inventory" && <InventoryView {...ctx} />}
      {view === "purchase" && <PurchaseView {...ctx} />}
      {view === "customers" && <CustomersView {...ctx} />}
      {view === "vendors" && <VendorsView {...ctx} />}
      {view === "history" && <HistoryView {...ctx} />}
      {view === "currencies" && <CurrenciesView {...ctx} />}
      {view === "pricelists" && <PricelistsView {...ctx} />}
    </Layout>
  );
}
