import { useState, useRef } from "react";
import { fmtc } from "../utils/format.js";
import { NUM_KEYS } from "../utils/constants.js";

export function Numpad({ target, onConfirm, onCancel }) {
  const [qtyStr, setQtyStr] = useState(target?.qty != null ? String(target.qty) : "1");
  const isDefault = useRef(target?.qty == null);

  const press = (k) => {
    if (typeof k === "number") {
      setQtyStr((prev) => {
        const next = isDefault.current ? String(k) : prev + k;
        isDefault.current = false;
        return next;
      });
    } else if (k === "⌫") {
      setQtyStr((prev) => {
        const next = prev.length > 1 ? prev.slice(0, -1) : "1";
        if (next === "1") isDefault.current = true;
        return next;
      });
    } else if (k === ".") {
      setQtyStr((prev) => {
        if (prev.includes(".")) return prev;
        return prev + ".";
      });
      isDefault.current = false;
    }
  };

  const qty = parseFloat(qtyStr) || 0;
  const max = target?.product?.stock ?? 9999;
  const displayQty = qty > max ? max : qtyStr;

  return (
    <div className="roverlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 300, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{target?.product?.name}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Stock: {target?.product?.stock} {target?.product?.unit}</div>
        <div style={{
          background: "#f8fafc", borderRadius: 10, padding: "10px 16px", textAlign: "right",
          fontSize: 28, fontWeight: 700, color: "#0284c7", fontFamily: "'DM Mono',monospace", marginBottom: 14,
          letterSpacing: 2, minHeight: 48
        }}>
          {displayQty}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NUM_KEYS.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 6 }}>
              {row.map((k) => (
                <button key={k} onClick={() => press(k)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 9, border: "none",
                  background: k === "⌫" ? "#fee2e2" : "#f1f5f9",
                  color: k === "⌫" ? "#991b1b" : "#1e293b",
                  fontSize: 18, fontWeight: 700, cursor: "pointer"
                }}>{k}</button>
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => onConfirm(Math.min(qty, max))} style={{
          width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 9, border: "none",
          background: "#0284c7", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"
        }}>Add to Cart</button>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function CashNumpad({ total, cur, onConfirm, onCancel }) {
  const [cash, setCash] = useState("");
  const isDefault = useRef(true);

  const press = (k) => {
    if (typeof k === "number") {
      setCash((prev) => {
        const next = isDefault.current ? String(k) : prev + k;
        isDefault.current = false;
        return next;
      });
    } else if (k === ".") {
      setCash((prev) => {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : prev + ".";
      });
      isDefault.current = false;
    } else if (k === "back") {
      setCash((prev) => {
        const next = prev.slice(0, -1);
        if (next === "") isDefault.current = true;
        return next;
      });
    } else if (k === "exact") {
      setCash(String(total));
      isDefault.current = false;
    }
  };

  const cashNums = [[1, 2, 3], [4, 5, 6], [7, 8, 9], ["back", 0, "."]];

  return (
    <div className="roverlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 320, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Cash Received</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Total due: <strong style={{ color: "#0284c7" }}>{fmtc(total, cur.symbol)}</strong></div>
        <div style={{
          background: "#f8fafc", borderRadius: 10, padding: "10px 16px", textAlign: "right",
          fontSize: 28, fontWeight: 700, color: cash && +cash >= total ? "#059669" : "#0284c7",
          fontFamily: "'DM Mono',monospace", marginBottom: 14, letterSpacing: 2, minHeight: 48
        }}>
          {cash || "0"}
        </div>
        {cash && +cash >= total && <div style={{ fontSize: 13, color: "#059669", marginBottom: 10, fontWeight: 600 }}>Change: {fmtc(+cash - total, cur.symbol)}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {cashNums.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 6 }}>
              {row.map((k) => (
                <button key={k} onClick={() => press(k)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 9, border: "1px solid #e2e8f0",
                  background: k === "back" ? "#fee2e2" : "#f1f5f9",
                  color: k === "back" ? "#991b1b" : "#1e293b",
                  fontSize: 18, fontWeight: 700, cursor: "pointer"
                }}>{k === "back" ? "⌫" : k}</button>
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => press("exact")} style={{
          width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 9, border: "1px solid #e2e8f0",
          background: "#fef3c7", color: "#92400e", fontSize: 14, fontWeight: 700, cursor: "pointer"
        }}>Exact: {fmtc(total, cur.symbol)}</button>
        <button onClick={() => onConfirm(cash)} style={{
          width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 9, border: "none",
          background: "#0284c7", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"
        }}>Confirm</button>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
