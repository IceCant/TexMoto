export function formatPrice(price: string | number | null, currency: "USD" | "KHR") {
  if (price === null) return "—";
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "km-KH", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(Number(price));
}

export function displayMotorcycleName(brand: string | null, model: string | null) {
  return [brand, model].filter(Boolean).join(" ") || "Untitled motorcycle";
}

