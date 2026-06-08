const fmt = (n) => { const v = (+(n || 0)).toFixed(2); return v.endsWith(".00") ? v.slice(0, -3) : v; };
const fmtc = (n, sym) => fmt(n) + " " + (sym || "$");
const fmtDate = (d) => new Date(d || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export { fmt, fmtc, fmtDate, fmtTime };
