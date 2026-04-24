import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("invoices-parsed.json", "utf-8"));

const USER_ID = "20a9ea55-28af-44cc-96bd-a13a288818a7";
const CARD_C6 = "209b197d-a39c-4ad6-ba2a-d5a498d68090";
const CARD_INTER = "e05a36f6-ec18-4cd9-a128-fe8fd0c32d0e";

const CAT = {
  Alimentacao: "fb29427f-3b3a-4014-8586-5a74cd36a9d3",
  Assinaturas: "e8faa97c-186c-40f7-ad95-9ca49ed53a30",
  Combustivel: "903671ed-745b-4903-b6c3-ffba948d81f9",
  Compras: "3b74237d-d89c-4d47-911d-b70d340808bd",
  ContasFixas: "d240f729-294e-4f15-8ee9-9a74d3e29d72",
  Delivery: "af48e656-8763-4b55-8177-c121fa8aa4f5",
  Jogos: "7381afa4-0153-4698-8680-eb07439add09",
  Lazer: "84f86c53-50d6-495c-b682-3095c528df38",
  Outros: "ea294524-edf2-43b5-9f88-baaa21cdaabf",
  Saude: "167b0514-4929-455c-9297-26d056861354",
  Transporte: "f5f71718-5a32-48a9-a296-949281da6312",
  Viagem: "020827c8-de39-4a0b-b081-10e3c94a9c63",
};

function categorize(description, isIof) {
  const d = description.toLowerCase();
  // IOF
  if (isIof || d.includes("iof internacional")) return { id: CAT.Outros, essencialidade: "neutro" };
  // Viagem
  if (/airbnb|latam|swiss\.com|ita spa|ita air|holafly|hudson guarulhos|kabanasflamboyant/i.test(description))
    return { id: CAT.Viagem, essencialidade: "superfluo" };
  // Alimentação (restaurantes, supermercados, cafés)
  if (/restaurant|brasserie|nostra pizzeria|dundeeroasted|bello pane|varandas kanpai|madalena gastrobar|cencosud|bonatacarejo|superboxminimerca|mont serrat|formpan|posto aldeia|rede z z|redez|montecarlo|jacoste/i.test(description))
    return { id: CAT.Alimentacao, essencialidade: "essencial" };
  // Delivery
  if (/^ifd\*|ifood club|arcos dourados|burger chef|tower burger/i.test(description))
    return { id: CAT.Delivery, essencialidade: "superfluo" };
  // Transporte
  if (/uber|flamboyant estacioname/i.test(description))
    return { id: CAT.Transporte, essencialidade: "essencial" };
  // Combustível
  if (/posto aldeia|posto shell|posto br/i.test(description))
    return { id: CAT.Combustivel, essencialidade: "essencial" };
  // Saúde
  if (/drogasil|drogaria|farmacia/i.test(description))
    return { id: CAT.Saude, essencialidade: "essencial" };
  // Assinaturas / SaaS
  if (/applecombill|openai|chatgpt|vercel|cloudflare|asaas|paypal \*twitch|amazon prime|amazon ad free|disney plus|canva|claro flex|anuidade diferenciada|ebn \*canva/i.test(description))
    return { id: CAT.Assinaturas, essencialidade: "neutro" };
  // Jogos
  if (/xsolla|gamers club|pg \*gamers|steam|playstation|xbox/i.test(description))
    return { id: CAT.Jogos, essencialidade: "essencial" };
  // Compras
  if (/mercado\*|mercadolivre|amazon br|ec \*|facini|shopping inter|seudori|rooster|mp \*/i.test(description))
    return { id: CAT.Compras, essencialidade: "superfluo" };
  return { id: CAT.Outros, essencialidade: "neutro" };
}

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

function buildValues(tx, cardId) {
  const cat = categorize(tx.description, tx.is_iof);
  const desc = tx.is_iof ? `IOF – ${tx.description}` : tx.description;
  // Installment detection
  const m = tx.description.match(/Parcela\s+0?(\d+)\s+de\s+0?(\d+)|Parcela\s+(\d+)\/(\d+)/i);
  const parcNum = m ? parseInt(m[1] ?? m[3], 10) : null;
  const parcTot = m ? parseInt(m[2] ?? m[4], 10) : null;
  return `(
    '${USER_ID}',
    'despesa',
    ${tx.amount.toFixed(2)},
    '${sqlEscape(desc)}',
    '${cat.id}',
    '${cardId}',
    'Crédito',
    'pago',
    '${cat.essencialidade}',
    ${tx.is_iof ? "ARRAY['iof']::text[]" : "'{}'::text[]"},
    '${tx.date}T12:00:00Z',
    ${parcNum ?? "NULL"},
    ${parcTot ?? "NULL"}
  )`;
}

function buildSql(list, cardId, label) {
  if (list.length === 0) return "";
  const values = list.map((t) => buildValues(t, cardId)).join(",\n");
  return `-- ${label} (${list.length} transações)
insert into public.transactions (
  user_id, type, amount, description, category_id, credit_card_id,
  payment_method, status, essentiality, tags, occurred_at,
  installment_number, installment_total
) values
${values};
`;
}

const sql = [
  buildSql(data.c6, CARD_C6, "C6 — fatura abril/2026"),
  buildSql(data.inter, CARD_INTER, "Inter — fatura abril/2026"),
].join("\n");

fs.writeFileSync("insert-transactions.sql", sql);
console.log(`Escreveu ${data.c6.length + data.inter.length} inserções em insert-transactions.sql`);
console.log(`C6: ${data.c6.length} · Inter: ${data.inter.length}`);

// Summary by category
const summary = new Map();
for (const t of [...data.c6, ...data.inter]) {
  const cat = categorize(t.description, t.is_iof);
  const name = Object.entries(CAT).find(([, v]) => v === cat.id)?.[0] ?? "?";
  summary.set(name, (summary.get(name) ?? 0) + t.amount);
}
console.log("\nPor categoria:");
for (const [name, total] of [...summary.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${name.padEnd(15)} R$ ${total.toFixed(2).padStart(10)}`);
}
