import fs from "node:fs";
const data = JSON.parse(fs.readFileSync("invoices-parsed.json", "utf-8"));

const USER_ID = "20a9ea55-28af-44cc-96bd-a13a288818a7";
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
  if (isIof || d.includes("iof internacional")) return { id: CAT.Outros, e: "neutro" };
  if (/airbnb|latam|swiss\.com|ita spa|ita air|holafly|hudson guarulhos|kabanasflamboyant/i.test(description))
    return { id: CAT.Viagem, e: "superfluo" };
  if (/restaurant|brasserie|nostra pizzeria|dundeeroasted|bello pane|varandas kanpai|madalena gastrobar|cencosud|bonatacarejo|superboxminimerca|mont serrat|formpan|posto aldeia|rede z z|redez|montecarlo|jacoste/i.test(description))
    return { id: CAT.Alimentacao, e: "essencial" };
  if (/^ifd\*|ifood club|arcos dourados|burger chef|tower burger/i.test(description))
    return { id: CAT.Delivery, e: "superfluo" };
  if (/uber|flamboyant estacioname/i.test(description))
    return { id: CAT.Transporte, e: "essencial" };
  if (/posto aldeia|posto shell|posto br/i.test(description))
    return { id: CAT.Combustivel, e: "essencial" };
  if (/drogasil|drogaria|farmacia/i.test(description))
    return { id: CAT.Saude, e: "essencial" };
  if (/applecombill|openai|chatgpt|vercel|cloudflare|asaas|paypal \*twitch|amazon prime|amazon ad free|disney plus|canva|claro flex|anuidade diferenciada|ebn \*canva/i.test(description))
    return { id: CAT.Assinaturas, e: "neutro" };
  if (/xsolla|gamers club|pg \*gamers|steam|playstation|xbox/i.test(description))
    return { id: CAT.Jogos, e: "essencial" };
  if (/mercado\*|mercadolivre|amazon br|ec \*|facini|shopping inter|seudori|rooster|mp \*/i.test(description))
    return { id: CAT.Compras, e: "superfluo" };
  return { id: CAT.Outros, e: "neutro" };
}

const sqlEsc = (s) => s.replace(/'/g, "''");
const rows = data.inter.map((t) => {
  const c = categorize(t.description, t.is_iof);
  const desc = t.is_iof ? `IOF – ${t.description}` : t.description;
  const m = t.description.match(/Parcela\s+0?(\d+)\s+de\s+0?(\d+)|Parcela\s+(\d+)\/(\d+)/i);
  const n = m ? parseInt(m[1] ?? m[3], 10) : null;
  const tot = m ? parseInt(m[2] ?? m[4], 10) : null;
  const tags = t.is_iof ? "ARRAY['iof']::text[]" : "'{}'::text[]";
  return `('${USER_ID}','despesa',${t.amount.toFixed(2)},'${sqlEsc(desc)}','${c.id}','${CARD_INTER}','Crédito','pago','${c.e}',${tags},'${t.date}T12:00:00Z',${n ?? "null"},${tot ?? "null"})`;
});

const sql = `insert into public.transactions (
  user_id, type, amount, description, category_id, credit_card_id,
  payment_method, status, essentiality, tags, occurred_at,
  installment_number, installment_total
) values
${rows.join(",\n")};`;

fs.writeFileSync("inter-compact.sql", sql);
console.log(`${rows.length} linhas escritas em inter-compact.sql (${sql.length} chars)`);
