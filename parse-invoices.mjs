// Parse both invoice position files into structured transactions.
import fs from "node:fs";

const MONTHS_PT = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

function parseBrDate(dateStr, fallbackYear) {
  // "21 fev" or "14 de mar. 2026"
  const parts = dateStr.trim().match(/(\d{1,2})\s*(?:de\s+)?([a-z]{3})\.?\s*(\d{4})?/i);
  if (!parts) return null;
  const day = parseInt(parts[1], 10);
  const monthName = parts[2].toLowerCase().slice(0, 3);
  const month = MONTHS_PT[monthName];
  if (month === undefined) return null;
  const year = parts[3] ? parseInt(parts[3], 10) : fallbackYear;
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

function parseBrMoney(s) {
  // "R$ 2.511,44" or "1.826,45" or "+ R$ 2.832,60" or "70,63"
  const clean = s.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : null;
}

// ============================================================================
// C6 parser
// ============================================================================
function parseC6() {
  const text = fs.readFileSync("c6_pos.txt", "utf-8");
  const lines = text.split("\n");
  const transactions = [];
  let currentYear = 2026;
  let currentCardFinal = "";

  // C6 has a complex layout where a transaction may be:
  //   [60]DATE  [100]DESCRIPTION  [xx]VALUE                      -- normal purchase
  //   [60]DATE  [100]DESCRIPTION  [370]IOF Transações Exterior  [xx]IOF_VALUE  -- FX purchase: this row is the IOF
  //   [370]USD X | Cotação ...
  //   [60]DATE  [100]DESCRIPTION  [xx]MAIN_VALUE                 -- (next row) main amount
  // So for same date+description, there can be 2 rows: IOF + main.

  for (const line of lines) {
    // Match rows that look like transactions: start with [60]DD mmm
    // and end with some [xx]value.
    const m = line.match(/^\[(\d+)\](\d{1,2})\s+([a-z]{3})\s+/);
    if (!m) continue;
    const firstX = parseInt(m[1], 10);
    if (firstX !== 60) continue;
    // Rest of the line
    const rest = line.slice(m[0].length);
    // Expect: [100]DESCRIPTION_PARTS...  [X]VALUE
    // Get the last bracket-value pair
    const segments = [...rest.matchAll(/\[(\d+)\]([^\[]+)/g)].map((s) => ({
      x: parseInt(s[1], 10),
      text: s[2].trim(),
    }));
    if (segments.length === 0) continue;
    // Last segment is usually the value
    const last = segments[segments.length - 1];
    // Value should be at high X (>= 480)
    if (last.x < 480) continue;
    const amount = parseBrMoney(last.text);
    if (amount == null) continue;

    // Check if this is IOF row
    const isIof = segments.some((s) =>
      s.text.toLowerCase().includes("iof transações exterior"),
    );

    // Description = all segments except the last (and not IOF-info)
    const descParts = segments
      .slice(0, -1)
      .filter((s) => !s.text.toLowerCase().includes("iof transações exterior"))
      .map((s) => s.text);
    const description = descParts.join(" ").replace(/\s+/g, " ").trim();

    const dateStr = `${m[2]} ${m[3]}`;
    // C6 fatura has transactions from Dec/Jan/Feb/Mar — year depends
    // Current fatura closes 24/03/26. So Dec = prev year, Jan-Mar = current year.
    let year = 2026;
    if (["dez", "nov", "out"].includes(m[3])) year = 2025;
    // "24 jun" appears for parcela 9/10 — must be older (2025)
    if (["jun", "jul", "mai", "abr", "ago", "set"].includes(m[3])) year = 2025;

    const date = parseBrDate(dateStr, year);

    // Skip non-purchase items
    const descLower = description.toLowerCase();
    const skip =
      descLower.includes("inclusao de pagamento") ||
      descLower.includes("estorno tarifa") ||
      descLower.includes("- estorno");
    if (skip) continue;

    transactions.push({
      date: date ? date.toISOString().slice(0, 10) : null,
      description,
      amount,
      is_iof: isIof,
      card: "C6",
    });
  }

  return transactions;
}

// ============================================================================
// Inter parser
// ============================================================================
function parseInter() {
  const text = fs.readFileSync("inter_pos.txt", "utf-8");
  const lines = text.split("\n");
  const transactions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match: [24]DD de mmm. YYYY  [77]DESC_PART1 [80]?DESC_PART2  [300]- [Xxx]+?R$ VALUE
    const m = line.match(/^\[24\](\d{1,2})\s+de\s+([a-z]{3})\.\s+(\d{4})/i);
    if (!m) continue;

    const segments = [...line.matchAll(/\[(\d+)\]([^\[]+)/g)].map((s) => ({
      x: parseInt(s[1], 10),
      text: s[2].trim(),
    }));
    if (segments.length < 2) continue;

    const dateStr = `${m[1]} ${m[2].toLowerCase()} ${m[3]}`;
    const date = parseBrDate(dateStr);

    const last = segments[segments.length - 1];
    // Inter value column is around x=380-405
    if (last.x < 380) continue;

    const isCredit = last.text.startsWith("+");
    const amount = parseBrMoney(last.text);
    if (amount == null) continue;

    // Skip credits (estornos, pagamentos)
    if (isCredit) continue;

    // Description: everything between date and value, minus the beneficiary
    // "-" separator at x=300
    const descParts = segments
      .slice(1) // skip date segment
      .filter((s) => s.x < 280)
      .map((s) => s.text);
    let description = descParts.join(" ").replace(/\s+/g, " ").trim();
    // Clean up patterns like "P AGAMENTO" (space split in chars)
    description = description
      .replace(/\s+([A-Z])\s+/g, "$1 ")
      .replace(/\s+-$/, "")
      .trim();

    // Skip pagamento
    if (/pagamento\s+on\s+line/i.test(description)) continue;

    const isIof = /iof\s+internacional/i.test(description);

    transactions.push({
      date: date ? date.toISOString().slice(0, 10) : null,
      description,
      amount,
      is_iof: isIof,
      card: "Inter",
    });
  }

  return transactions;
}

const c6 = parseC6();
const inter = parseInter();

// Output summary
console.log(`\n=== C6 (${c6.length} transações) ===`);
let c6Sum = 0;
for (const t of c6) {
  c6Sum += t.amount;
  console.log(
    `${t.date} | R$ ${t.amount.toFixed(2).padStart(9)} | ${t.is_iof ? "[IOF] " : "      "}${t.description}`,
  );
}
console.log(`C6 total: R$ ${c6Sum.toFixed(2)}`);

console.log(`\n=== Inter (${inter.length} transações) ===`);
let interSum = 0;
for (const t of inter) {
  interSum += t.amount;
  console.log(
    `${t.date} | R$ ${t.amount.toFixed(2).padStart(9)} | ${t.is_iof ? "[IOF] " : "      "}${t.description}`,
  );
}
console.log(`Inter total: R$ ${interSum.toFixed(2)}`);

// Save JSON
fs.writeFileSync(
  "invoices-parsed.json",
  JSON.stringify({ c6, inter }, null, 2),
);
console.log(`\nSalvou invoices-parsed.json`);
