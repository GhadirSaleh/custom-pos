import uid from "./uid.js";

const KEYS = { p: "pos:p2", c: "pos:c2", s: "pos:s2", pu: "pos:pu2", t: "pos:t2", cr: "pos:cr2", pl: "pos:pl2", v: "pos:v2" };

const SEED_PRODUCTS = [
  { id: uid(), name: "Coca Cola 500ml", sku: "CC001", cat: "Beverages", price: 2.5, cost: 1.2, stock: 100, unit: "pcs" },
  { id: uid(), name: "Bread Loaf", sku: "BR001", cat: "Bakery", price: 3.0, cost: 1.8, stock: 50, unit: "pcs" },
  { id: uid(), name: "Rice 1kg", sku: "RC001", cat: "Grains", price: 1.5, cost: 0.9, stock: 200, unit: "kg" },
  { id: uid(), name: "Milk 1L", sku: "MK001", cat: "Dairy", price: 1.8, cost: 1.1, stock: 80, unit: "L" },
  { id: uid(), name: "Orange Juice 1L", sku: "OJ001", cat: "Beverages", price: 2.0, cost: 1.2, stock: 60, unit: "L" },
  { id: uid(), name: "Eggs (12 pack)", sku: "EG001", cat: "Dairy", price: 4.5, cost: 3.0, stock: 40, unit: "box" },
  { id: uid(), name: "Sugar 1kg", sku: "SG001", cat: "Grains", price: 1.2, cost: 0.7, stock: 150, unit: "kg" },
  { id: uid(), name: "Mineral Water 1.5L", sku: "MW001", cat: "Beverages", price: 0.8, cost: 0.35, stock: 120, unit: "pcs" },
];

const SEED_CUSTOMERS = [
  { id: uid(), name: "John Smith", phone: "555-0101", email: "john@email.com", balance: 0, since: Date.now() },
  { id: uid(), name: "Maria Garcia", phone: "555-0102", email: "maria@email.com", balance: 25.0, since: Date.now() },
  { id: uid(), name: "Bob Johnson", phone: "555-0103", email: "bob@email.com", balance: 0, since: Date.now() },
];

const SEED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1, isBase: true },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
];

const SEED_PRICELISTS = [
  { id: uid(), name: "Standard", isDefault: true, pricingType: "manual", formula: null },
  { id: uid(), name: "Wholesale", isDefault: false, pricingType: "formula", formula: { type: "markup", value: 25, rounding: "nearest_05" } },
];

const SEED_VENDORS = [
  { id: uid(), name: "Fresh Distributors", phone: "555-0201", email: "orders@freshdist.com", contact: "Sarah" },
  { id: uid(), name: "Wholesale Mart", phone: "555-0202", email: "info@wholesalemart.com", contact: "Mike" },
  { id: uid(), name: "Global Foods Co.", phone: "555-0203", email: "sales@globalfoods.com", contact: "Jane" },
];

const CAT_ICONS = { Beverages: "🥤", Bakery: "🍞", Grains: "🌾", Dairy: "🥛", Meat: "🥩", Fruits: "🍎", Vegetables: "🥦", Snacks: "🍿", Other: "📦" };
const catIcon = (cat) => CAT_ICONS[cat] || "📦";

const NUM_KEYS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ["⌫", 0, "."],
];

const FORMULA_OPTIONS = [
  { value: "markup", label: "Markup on Cost" },
  { value: "margin", label: "Margin on Cost" },
  { value: "discount", label: "Discount off Base" },
  { value: "fixed", label: "Fixed on Cost" },
];

const ROUNDING_OPTIONS = [
  { value: "none", label: "No rounding" },
  { value: "nearest_05", label: "Nearest $0.05" },
  { value: "nearest_10", label: "Nearest $0.10" },
  { value: "nearest_50", label: "Nearest $0.50" },
  { value: "nearest_1", label: "Nearest $1.00" },
  { value: "psychological", label: "Psychological ($X.99)" },
];

export {
  KEYS,
  SEED_PRODUCTS,
  SEED_CUSTOMERS,
  SEED_CURRENCIES,
  SEED_PRICELISTS,
  SEED_VENDORS,
  CAT_ICONS,
  catIcon,
  NUM_KEYS,
  FORMULA_OPTIONS,
  ROUNDING_OPTIONS,
};
