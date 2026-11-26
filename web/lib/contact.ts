// The company's phone and WhatsApp number. Change it here only.
export const PHONE = "0306 6199004";
export const PHONE_TEL = "+923066199004";

/** wa.me link to the company's WhatsApp, optionally with a ready-written message. */
export function waLink(text?: string): string {
  return "https://wa.me/923066199004" + (text ? "?text=" + encodeURIComponent(text) : "");
}

/** Opens the WhatsApp chat in a new tab (the app on phones). */
export function openWhatsApp(text?: string) {
  window.open(waLink(text), "_blank", "noopener");
}
