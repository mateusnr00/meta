import fs from "node:fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfPath = process.argv[2];
if (!pdfPath) process.exit(1);

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  const rows = new Map();
  for (const item of content.items) {
    if (!item.str || !item.str.trim()) continue;
    const y = Math.round(item.transform[5] / 2) * 2;
    const x = item.transform[4];
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push({ x, text: item.str });
  }
  const sortedY = [...rows.keys()].sort((a, b) => b - a);
  console.log(`\n=== PAGE ${p} ===`);
  for (const y of sortedY) {
    const cells = rows.get(y).sort((a, b) => a.x - b.x);
    const preview = cells
      .map((c) => `[${Math.round(c.x)}]${c.text}`)
      .join("  ");
    console.log(preview);
  }
}
