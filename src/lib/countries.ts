/** Países mais comuns com moeda e fuso principal, para preencher destinos automaticamente. */
export const COUNTRY_INFO: Record<string, { currency: string; tz: string }> = {
  "Brasil": { currency: "BRL", tz: "America/Sao_Paulo" },
  "Argentina": { currency: "ARS", tz: "America/Argentina/Buenos_Aires" },
  "Chile": { currency: "CLP", tz: "America/Santiago" },
  "Uruguai": { currency: "UYU", tz: "America/Montevideo" },
  "Paraguai": { currency: "PYG", tz: "America/Asuncion" },
  "Peru": { currency: "PEN", tz: "America/Lima" },
  "Colômbia": { currency: "COP", tz: "America/Bogota" },
  "Bolívia": { currency: "BOB", tz: "America/La_Paz" },
  "Equador": { currency: "USD", tz: "America/Guayaquil" },
  "México": { currency: "MXN", tz: "America/Mexico_City" },
  "Estados Unidos": { currency: "USD", tz: "America/New_York" },
  "Canadá": { currency: "CAD", tz: "America/Toronto" },
  "Cuba": { currency: "CUP", tz: "America/Havana" },
  "República Dominicana": { currency: "DOP", tz: "America/Santo_Domingo" },
  "Costa Rica": { currency: "CRC", tz: "America/Costa_Rica" },
  "Panamá": { currency: "USD", tz: "America/Panama" },
  "Portugal": { currency: "EUR", tz: "Europe/Lisbon" },
  "Espanha": { currency: "EUR", tz: "Europe/Madrid" },
  "França": { currency: "EUR", tz: "Europe/Paris" },
  "Itália": { currency: "EUR", tz: "Europe/Rome" },
  "Alemanha": { currency: "EUR", tz: "Europe/Berlin" },
  "Holanda": { currency: "EUR", tz: "Europe/Amsterdam" },
  "Países Baixos": { currency: "EUR", tz: "Europe/Amsterdam" },
  "Bélgica": { currency: "EUR", tz: "Europe/Brussels" },
  "Áustria": { currency: "EUR", tz: "Europe/Vienna" },
  "Irlanda": { currency: "EUR", tz: "Europe/Dublin" },
  "Grécia": { currency: "EUR", tz: "Europe/Athens" },
  "Finlândia": { currency: "EUR", tz: "Europe/Helsinki" },
  "Croácia": { currency: "EUR", tz: "Europe/Zagreb" },
  "Eslovênia": { currency: "EUR", tz: "Europe/Ljubljana" },
  "Luxemburgo": { currency: "EUR", tz: "Europe/Luxembourg" },
  "Malta": { currency: "EUR", tz: "Europe/Malta" },
  "Estônia": { currency: "EUR", tz: "Europe/Tallinn" },
  "Letônia": { currency: "EUR", tz: "Europe/Riga" },
  "Lituânia": { currency: "EUR", tz: "Europe/Vilnius" },
  "Reino Unido": { currency: "GBP", tz: "Europe/London" },
  "Inglaterra": { currency: "GBP", tz: "Europe/London" },
  "Escócia": { currency: "GBP", tz: "Europe/London" },
  "País de Gales": { currency: "GBP", tz: "Europe/London" },
  "Irlanda do Norte": { currency: "GBP", tz: "Europe/London" },
  "Islândia": { currency: "ISK", tz: "Atlantic/Reykjavik" },
  "Suíça": { currency: "CHF", tz: "Europe/Zurich" },
  "Noruega": { currency: "NOK", tz: "Europe/Oslo" },
  "Suécia": { currency: "SEK", tz: "Europe/Stockholm" },
  "Dinamarca": { currency: "DKK", tz: "Europe/Copenhagen" },
  "República Tcheca": { currency: "CZK", tz: "Europe/Prague" },
  "Tchéquia": { currency: "CZK", tz: "Europe/Prague" },
  "Hungria": { currency: "HUF", tz: "Europe/Budapest" },
  "Polônia": { currency: "PLN", tz: "Europe/Warsaw" },
  "Turquia": { currency: "TRY", tz: "Europe/Istanbul" },
  "Marrocos": { currency: "MAD", tz: "Africa/Casablanca" },
  "Egito": { currency: "EGP", tz: "Africa/Cairo" },
  "África do Sul": { currency: "ZAR", tz: "Africa/Johannesburg" },
  "Emirados Árabes Unidos": { currency: "AED", tz: "Asia/Dubai" },
  "Israel": { currency: "ILS", tz: "Asia/Jerusalem" },
  "Japão": { currency: "JPY", tz: "Asia/Tokyo" },
  "China": { currency: "CNY", tz: "Asia/Shanghai" },
  "Coreia do Sul": { currency: "KRW", tz: "Asia/Seoul" },
  "Tailândia": { currency: "THB", tz: "Asia/Bangkok" },
  "Singapura": { currency: "SGD", tz: "Asia/Singapore" },
  "Hong Kong": { currency: "HKD", tz: "Asia/Hong_Kong" },
  "Índia": { currency: "INR", tz: "Asia/Kolkata" },
  "Indonésia": { currency: "IDR", tz: "Asia/Jakarta" },
  "Vietnã": { currency: "VND", tz: "Asia/Ho_Chi_Minh" },
  "Austrália": { currency: "AUD", tz: "Australia/Sydney" },
  "Nova Zelândia": { currency: "NZD", tz: "Pacific/Auckland" },
};

export const COUNTRY_NAMES = Object.keys(COUNTRY_INFO).sort((a, b) => a.localeCompare(b, "pt-BR"));

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const INDEX = new Map(Object.entries(COUNTRY_INFO).map(([k, v]) => [norm(k), v]));

/** Moeda e fuso de um país pelo nome em português (ignora acentos e maiúsculas). */
export function countryInfo(name: string | null | undefined) {
  return name ? INDEX.get(norm(name)) : undefined;
}

/** "GBP · Libra esterlina" — nome da moeda em português, quando o navegador souber. */
export function currencyLabel(code: string): string {
  try {
    const n = new Intl.DisplayNames(["pt-BR"], { type: "currency" }).of(code);
    return n && n !== code ? `${code} · ${n.charAt(0).toUpperCase()}${n.slice(1)}` : code;
  } catch {
    return code;
  }
}
