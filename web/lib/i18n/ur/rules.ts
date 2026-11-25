// Urdu for strings built at runtime (counts, prices, product names in sentences).
// Ported from the v7 prototype. Each rule returns null when it cannot translate a part,
// so the next rule gets a chance.
type Rule = [RegExp, (m: RegExpMatchArray, T: (k: string) => string | null) => string | null];

const UNIT: Record<string, string> = { carton: "کارٹن", bundle: "بنڈل", tank: "ٹینکی" };

const rules: Rule[] = [
  [/^(\d+) pcs per (carton|bundle|tank)$/, (m) => "فی " + UNIT[m[2]] + " " + m[1] + " پیس"],
  [/^(\d+) cartons added to your order$/, (m) => m[1] + " کارٹن آرڈر میں شامل"],
  [/^Opens (.+) payment in the live site$/, (m, T) => { const n = T(m[1]); return n ? "اصل ویب سائٹ میں " + n + " ادائیگی کھلے گی" : null; }],
  [/^(.+) ·$/, (m, T) => { const n = T(m[1]); return n ? n + " ·" : null; }],
  [/^[^,]+(, [^,]+)+$/, (m, T) => {
    const out: string[] = [];
    for (const part of m[0].split(", ")) { const v = T(part); if (v == null) return null; out.push(v); }
    return out.join("، ");
  }],
  [/^[A-Z]{2}-[A-Z0-9]+$/, (m) => m[0]],
  [/^(\d+) ctn$/, (m) => m[1] + " کارٹن"],
  [/^(\d+) pcs$/, (m) => m[1] + " پیس"],
  [/^(\d+) fittings$/, (m) => m[1] + " فٹنگز"],
  [/^Whole look added: (\d+) fittings$/, (m) => "مکمل لُک شامل: " + m[1] + " فٹنگز"],
  [/^(\d+) bdl$/, (m) => m[1] + " بنڈل"],
  [/^(\d+) pcs of ([A-Z]{2}-[A-Z0-9]+) added$/, (m) => m[2] + " کے " + m[1] + " پیس شامل"],
  [/^([\d,.]+) litres$/, (m) => m[1] + " لیٹر"],
  [/^(\d+) layers$/, (m) => m[1] + " تہیں"],
  [/^(\d+) pieces?$/, (m) => m[1] + " پیس"],
  [/^(\d+) (finish|finishes)$/, (m) => m[1] + " فنش"],
  [/^(\d+) (colour|colours)$/, (m) => m[1] + " رنگ"],
  [/^· (\d+) items?$/, (m) => "· " + m[1] + (m[1] === "1" ? " چیز" : " چیزیں")],
  [/^(.+) added to cart$/, (m, T) => { const n = T(m[1]); return n ? n + " کارٹ میں شامل" : null; }],
  [/^(\d+) (carton|bundle|tank)s? of ([A-Z]{2}-[A-Z0-9]+) added$/, (m) => m[3] + " کے " + m[1] + " " + UNIT[m[2]] + " شامل"],
  [/^Quick view: (.+)$/, (m, T) => { const n = T(m[1]); return n ? "فوری جائزہ: " + n : null; }],
  [/^No match for “(.*)”\./, (m) => "“" + m[1] + "” سے کچھ نہیں ملا۔ “مکسر”، “ٹینکی”، “پائپ” یا AB-1204 جیسا پروڈکٹ کوڈ لکھیں۔"],
  [/^No product with SKU (.+)$/, (m) => "پروڈکٹ کوڈ " + m[1] + " والی کوئی پروڈکٹ نہیں"],
  [/^(.+) more for free delivery in Gujranwala & Lahore$/, (m) => "گوجرانوالہ اور لاہور میں مفت ڈیلیوری کے لیے " + m[1] + " مزید"],
  [/^Full set: you save (.+)$/, (m) => "پورا سیٹ: آپ کی بچت " + m[1]],
  [/^From (.+) \/ pc$/, (m) => m[1] + " فی پیس سے شروع"],
  [/^(.+) \/ pc$/, (m) => m[1] + " فی پیس"],
  [/^(.+) \/ set$/, (m) => m[1] + " فی سیٹ"],
  [/^(.+) dealer$/, (m) => m[1] + " ڈیلر ریٹ"],
  [/^Add 1 (carton|bundle|tank)$/, (m) => "1 " + UNIT[m[1]] + " ڈالیں"],
  [/^Add 1 (carton|bundle|tank) · (\d+) pcs$/, (m) => "1 " + UNIT[m[1]] + " ڈالیں · " + m[2] + " پیس"],
  [/^Add (\d+) (carton|bundle|tank)s?$/, (m) => m[1] + " " + UNIT[m[2]] + " ڈالیں"],
  [/^Add (\d+) pcs$/, (m) => m[1] + " پیس ڈالیں"],
  [/^Per piece · (carton|bundle) of (\d+)$/, (m) => "فی پیس · " + m[2] + " پیس کا " + UNIT[m[1]]],
  [/^(.+) ×(\d+)$/, (m, T) => { const n = T(m[1]); return n ? n + " ×" + m[2] : null; }],
  [/^Opens WhatsApp with ([A-Z]{2}-[A-Z0-9]+) in the message$/, (m) => "واٹس ایپ پیغام میں " + m[1] + " کے ساتھ کھلے گا"],
  [/ · /, (m, T) => {
    const out: string[] = [];
    for (const part of (m.input ?? "").split(" · ")) {
      const v = /[A-Za-z]/.test(part) ? T(part) : part;
      if (v == null) return null;
      out.push(v);
    }
    return out.join(" · ");
  }],
];

export default rules;
