export function convertPrice(amount, targetCur, currencies) {
  const c = currencies.find((x) => x.code === targetCur);
  return c ? amount * c.rate : amount;
}

export function baseCur(currencies) {
  return currencies.find((c) => c.isBase) || currencies[0];
}

export function applyFormula(cost, basePrice, formula) {
  if (!formula || formula.type === "none") return basePrice;
  let price;
  switch (formula.type) {
    case "markup": price = cost * (1 + formula.value / 100); break;
    case "margin": price = cost / (1 - Math.min(formula.value, 99) / 100); break;
    case "discount": price = basePrice * (1 - formula.value / 100); break;
    case "fixed": price = cost + formula.value; break;
    default: price = basePrice;
  }
  return roundPrice(price, formula.rounding);
}

export function roundPrice(price, method) {
  switch (method) {
    case "nearest_05": return Math.round((price) * 20) / 20;
    case "nearest_10": return Math.round((price) * 10) / 10;
    case "nearest_50": return Math.round((price) * 2) / 2;
    case "nearest_1": return Math.round(price);
    case "psychological": return Math.floor(price) + 0.99;
    default: return price;
  }
}
