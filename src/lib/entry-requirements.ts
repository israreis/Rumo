/**
 * Onde conferir as exigências de entrada (visto, autorização eletrônica, validade do passaporte)
 * de cada país. Não guardamos as regras em si: elas mudam, então o app aponta a fonte oficial.
 */
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** Países do Espaço Schengen (entrada pelas regras da UE: EES e ETIAS). */
const SCHENGEN = new Set([
  "alemanha", "austria", "belgica", "bulgaria", "croacia", "dinamarca", "eslovaquia", "eslovenia", "espanha", "estonia",
  "finlandia", "franca", "grecia", "holanda", "paises baixos", "hungria", "islandia", "italia", "letonia", "liechtenstein",
  "lituania", "luxemburgo", "malta", "noruega", "polonia", "portugal", "republica tcheca", "tchequia", "romenia", "suecia", "suica",
].map(norm));

const OFFICIAL: Record<string, { label: string; url: string }> = {
  "reino unido": { label: "GOV.UK — verificar visto ou ETA", url: "https://www.gov.uk/check-uk-visa" },
  inglaterra: { label: "GOV.UK — verificar visto ou ETA", url: "https://www.gov.uk/check-uk-visa" },
  escocia: { label: "GOV.UK — verificar visto ou ETA", url: "https://www.gov.uk/check-uk-visa" },
  "pais de gales": { label: "GOV.UK — verificar visto ou ETA", url: "https://www.gov.uk/check-uk-visa" },
  "irlanda do norte": { label: "GOV.UK — verificar visto ou ETA", url: "https://www.gov.uk/check-uk-visa" },
  irlanda: { label: "Irish Immigration Service", url: "https://www.irishimmigration.ie/coming-to-visit-ireland/" },
  "estados unidos": { label: "Departamento de Estado dos EUA — vistos", url: "https://travel.state.gov/content/travel/en/us-visas.html" },
  canada: { label: "Governo do Canadá — visitar o Canadá", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html" },
};

export type EntryInfo = { country: string; label: string; url: string };

/** Fonte oficial para conferir a entrada no país (ou uma busca, se não houver uma conhecida). */
export function entryInfo(country: string): EntryInfo {
  const key = norm(country);
  const known = OFFICIAL[key];
  if (known) return { country, ...known };
  if (SCHENGEN.has(key)) return { country, label: "União Europeia — EES e ETIAS (Schengen)", url: "https://travel-europe.europa.eu/" };
  const q = encodeURIComponent(`exigências de entrada ${country} para brasileiros visto passaporte`);
  return { country, label: "Buscar fontes oficiais", url: `https://www.google.com/search?q=${q}` };
}

/** Países da viagem fora do Brasil, sem repetir, na ordem do roteiro. */
export function foreignCountries(dests: { country: string | null }[], home = "Brasil"): string[] {
  const seen = new Set<string>([norm(home)]);
  const out: string[] = [];
  for (const d of dests) {
    const c = d.country?.trim();
    if (!c || seen.has(norm(c))) continue;
    seen.add(norm(c));
    out.push(c);
  }
  return out;
}

/** Título do item de checklist que marca o país como conferido. */
export const entryCheckTitle = (country: string) => `Exigências de entrada conferidas: ${country}`;
export const isEntryChecked = (country: string, items: { title: string; done: boolean }[]) =>
  items.some((i) => i.done && norm(i.title) === norm(entryCheckTitle(country)));
