// Formatting for the admin panel. Dates always in Pakistan time so server and browser agree.

const TZ = "Asia/Karachi";

export const rs = (n: number) => "Rs " + Math.round(n).toLocaleString("en-PK");
export const num = (n: number) => n.toLocaleString("en-PK");

export function day(d: Date | string | null | undefined): string {
  if (!d) return "–";
  const v = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00+05:00`) : new Date(d);
  return v.toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
}

export function dayTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "2026-11-26" for <input type="date">. */
export const isoDay = (d: Date | string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));

export const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAY_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  jazz: "JazzCash",
  easy: "Easypaisa",
  bank: "Bank transfer",
  credit: "Dealer credit",
};

export const SPEED_LABEL: Record<string, string> = { std: "Standard", exp: "Express", truck: "Truck" };

/** Pieces shown with cartons, e.g. "240 pcs · 24 ctn". */
export function pcs(stock: number, carton: number): string {
  const c = carton > 1 ? ` · ${num(Math.floor(stock / carton))} ctn` : "";
  return `${num(stock)} pcs${c}`;
}
