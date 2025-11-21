import {
  RawVodka,
  Vodka,
  VodkaFlavor,
  Store,
  PriceHistory,
} from "../types/VodkaProps";

/**
 * Klasa odpowiedzialna za przetwarzanie danych surowych (RawVodka)
 * na ujednoliconą strukturę Vodka, gotową do wpięcia w frontend/DB.
 *
 * Ten parser działa na:
 * - normalizacji nazw,
 * - wyciąganiu smaku,
 * - wyciąganiu procentów alkoholu,
 * - odczytywaniu pojemności,
 * - interpretacji ceny,
 * - budowaniu struktury store z historią cen.
 *
 * Każdy sklep ma własną instancję parsera (z nazwą sklepu i logo),
 * dzięki czemu logika scrapowania jest oddzielona od logiki normalizacji.
 */
export class VodkaParser {
  /**
   * @param storeName Nazwa sklepu (np. "Biedronka")
   * @param storeImage Ścieżka do ikonki sklepu (np. "/biedronka.png")
   */
  constructor(private storeName: string, private storeImage: string) {}

  /**
   * Przekształca tablicę danych RawVodka[] na Vodka[].
   *
   * Główne kroki:
   * 1. Odczyt pełnego tekstu karty (raw.rawText).
   * 2. Normalizacja nazwy — usuwamy ceny, pojemności, %, śmieci.
   * 3. Określenie smaku na podstawie słów kluczowych.
   * 4. Wyciągnięcie procentów alkoholu lub fallback na 40%.
   * 5. Wyciągnięcie pojemności (ml) — albo z raw.volume, albo z tekstu.
   * 6. Interpretacja ceny — raw.price > fallback z tekstu > 0.
   * 7. Zbudowanie PriceHistory.
   * 8. Złożenie finalnego obiektu Vodka.
   *
   * W przypadku błędu parser nie rzu­ca wyjątku — jedynie loguje i pomija produkt.
   */
  parse(rawList: RawVodka[]): Vodka[] {
    const out: Vodka[] = [];

    for (const raw of rawList) {
      try {
        const rawText = raw.rawText ?? raw.name ?? "";

        // --- Core parsing ---

        const name = this.normalizeName(rawText);
        const flavor = this.parseFlavor(rawText);

        // ABV: jak nie znajdzie – domyślnie 40 jak Bóg (i ruscy) przykazał
        const alcoholPercentage = this.parseAbv(rawText) ?? 40;

        // weź to, co podał scraper — albo wyciągnij ze stringa
        const volume = raw.volume ?? this.parseVolume(rawText) ?? 0;

        // Cena → number. Najpierw bierze z RawVodka.price (selenium),
        // jeśli tam było null/0 → fallback: szukanie w tekście.
        const price = raw.price ?? this.parsePriceFromText(rawText);

        // Historia musi mieć przynajmniej jeden punkt
        const pricePoint: PriceHistory = {
          date: new Date(),
          price,
        };

        // Informacja o sklepie — gotowa struktura Store
        const store: Store = {
          name: this.storeName,
          image: this.storeImage,
          priceHistory: [pricePoint],
          price,
          lastUpdate: new Date(),
        };

        // Cały poprawnie sparsowany wpis
        const vodka: Vodka = {
          name,
          flavor,
          volume,
          alcoholPercentage,
          imageSrc: raw.imageSrc ?? "",
          store,
        };

        out.push(vodka);
      } catch (err) {
        console.warn(`[VodkaParser] failed to parse raw entry:`, err, raw);
        continue;
      }
    }

    return out;
  }

  // ─────────────────────────────────────────────
  //                 HELPERS
  // ─────────────────────────────────────────────

  /**
   * Normalizuje nazwę wódki.
   *
   * Usuwa:
   * - pojemności: "0.7l", "700ml", "1 l", "50 cl"
   * - procenty alkoholu: "40%", "30 % vol"
   * - ceny: "24,99 zł", "19 zł"
   * - podwójne spacje
   *
   * Pozostawia czysty tytuł produktu.
   */
  normalizeName(raw: string): string {
    return raw
      .replace(/(\d+(?:[.,]\d+)?\s*(?:l|ml|cl))/gi, "") // usuwa pojemność
      .replace(/(\d{1,3}\s*%)/gi, "") // usuwa %
      .replace(/(\d+[.,]?\d*\s*zł)/gi, "") // usuwa ceny
      .replace(/\s{2,}/g, " ") // usuwa nadmiar spacji
      .trim();
  }

  /**
   * Określa smak wódki na podstawie słów kluczowych.
   *
   * Jeśli brak dopasowania → "pure".
   */
  parseFlavor(raw: string): VodkaFlavor {
    const s = raw.toLowerCase();
    if (s.includes("mango")) return "mango";
    if (s.includes("cytryn") || s.includes("lemon")) return "lemon";
    if (s.includes("mięt") || s.includes("mint")) return "mint";
    if (s.includes("wiś")) return "cherry";
    if (s.includes("porzecz")) return "currant";
    return "pure";
  }

  /**
   * Parsuje procent alkoholu (ABV).
   *
   * Obsługiwane formaty:
   * - "40%"
   * - "40 %"
   * - "40% vol"
   * - "40 vol"
   * - "alc 40%"
   *
   * Jeśli nie znajdzie → zwraca null.
   */
  parseAbv(raw: string): number | null {
    const m =
      raw.match(/(\d{2})(?=\s*%|\s*vol|\s*alc)/i) || raw.match(/(\d{2})\s*%/i);

    if (!m) return null;

    const n = parseInt(m[1], 10);
    return isNaN(n) ? null : n;
  }

  /**
   * Parsuje objętość wódki (w ml).
   *
   * Obsługiwane formaty:
   * - "0.5l" → 500
   * - "1l" → 1000
   * - "700ml" → 700
   * - "70 cl" → 700
   *
   * Zwraca mililitry lub null.
   */
  parseVolume(raw: string): number | null {
    const match = raw.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(l|ml|cl)/i);
    if (!match) return null;

    let value = parseFloat(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();

    if (unit === "l") value *= 1000;
    if (unit === "cl") value *= 10;

    return Math.round(value);
  }

  /**
   * Fallback do ceny — przydatne, gdy scraper (np. Puppeteer/Selenium)
   * nie był w stanie poprawnie sparsować wartości.
   *
   * Szuka w stringu wzorca:
   * - "24,99 zł"
   * - "19.50 zł"
   *
   * Zwraca number albo 0.
   */
  parsePriceFromText(raw: string): number {
    const match = raw.match(/(\d+[.,]\d{1,2})\s*zł/i);
    if (!match) return 0;

    const num = parseFloat(match[1].replace(",", "."));
    return isNaN(num) ? 0 : num;
  }
}
