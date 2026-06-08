const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#f8fafc;color:#1e293b}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
input,select,textarea,button{font-family:'DM Sans',sans-serif}
.nav{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:12px;border:none;background:transparent;color:#64748b;font-size:15px;font-weight:500;width:100%;text-align:left;cursor:pointer;transition:all .13s;min-height:48px}
.nav:hover{background:#f1f5f9;color:#334155}
.nav.on{background:#e0f2fe;color:#0369a1}
.btn{padding:10px 22px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:all .13s;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;min-height:42px}
.btn-primary{background:#0284c7;color:#fff}.btn-primary:active{background:#0369a1}
.btn-success{background:#059669;color:#fff}.btn-success:active{background:#047857}
.btn-danger{background:#dc2626;color:#fff}.btn-danger:active{background:#b91c1c}
.btn-ghost{background:#ffffff;color:#475569;border:1px solid #cbd5e1}.btn-ghost:active{background:#f1f5f9;border-color:#94a3b8}
.btn-amber{background:#d97706;color:#fff}.btn-amber:active{background:#b45309}
.btn-sm{padding:7px 16px;font-size:13px;border-radius:8px;min-height:36px}
.inp{background:#ffffff;border:1.5px solid #cbd5e1;border-radius:10px;padding:12px 14px;color:#1e293b;font-size:15px;outline:none;width:100%;transition:border .13s;min-height:44px}
.inp:focus{border-color:#0284c7}
.sel{background:#ffffff;border:1.5px solid #cbd5e1;border-radius:10px;padding:12px 14px;color:#1e293b;font-size:15px;outline:none;width:100%;cursor:pointer;min-height:44px}
.sel:focus{border-color:#0284c7}
.card{background:#ffffff;border-radius:14px;padding:22px;border:1px solid #e2e8f0}
.stat{background:#ffffff;border-radius:14px;padding:22px;border:1px solid #e2e8f0}
.tag{display:inline-flex;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.03em}
.tag-red{background:#fef2f2;color:#dc2626}
.tag-green{background:#f0fdf4;color:#059669}
.tag-blue{background:#dbeafe;color:#0284c7}
.tag-amber{background:#fef9c3;color:#d97706}
.tag-slate{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
.tag-purple{background:#f3e8ff;color:#7c3aed}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;padding:12px 16px;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e2e8f0;white-space:nowrap}
td{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#475569;vertical-align:middle}
tr:active td{background:#f8fafc}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:200;padding:24px}
.modal{background:#ffffff;border-radius:18px;padding:28px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,.1)}
.fg{margin-bottom:16px}
.fl{display:block;font-size:12px;color:#64748b;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.prod-card{background:#f8fafc;border-radius:8px;cursor:pointer;border:2px solid #e2e8f0;transition:all .13s;user-select:none;aspect-ratio:16/10;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:8px 12px}
.prod-card:hover{border-color:#0284c7;background:#f1f5f9}
.prod-card:active{border-color:#0284c7;background:#e0f2fe}
.prod-card.oos{opacity:.45;cursor:not-allowed;pointer-events:none}
.ptab{padding:10px 20px;border-radius:10px;border:1.5px solid #cbd5e1;background:#ffffff;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;transition:all .13s;min-height:42px}
.ptab.on{background:#e0f2fe;color:#0369a1;border-color:#0284c7}
.roverlay{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:300;padding:24px}
.receipt{background:#fff;color:#111;border-radius:8px;padding:30px 26px;width:100%;max-width:340px;font-family:'DM Mono',monospace;font-size:12.5px}
.alert-r{padding:12px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.alert-g{padding:12px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;background:#f0fdf4;color:#059669;border:1px solid #bbf7d0}
.ppage{flex:1;overflow:auto;padding:26px 26px 26px 60px;display:flex;flex-direction:column;gap:20px}
`;
export default CSS;
