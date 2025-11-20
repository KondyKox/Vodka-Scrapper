import {
  RawVodka,
  Vodka,
  VodkaFlavor,
  Store,
  PriceHistory,
} from "../types/VodkaProps";

export class VodkaParser {
  constructor(private storeName: string, private storeImage: string) {}

  parse(rawList: RawVodka[]): Vodka[] {
    const out: Vodka[] = [];

    for (const raw of rawList) {
      try {
        const rawText = raw.rawText ?? raw.name ?? "";

        const name = this.normalizeName(rawText);
        const flavor = this.parseFlavor(rawText);
        const alcoholPercentage = this.parseAbv(rawText) ?? 40;

        // jeśli scraper umiał znaleźć volume → bierzemy
        // jeśli nie → próbujemy wyciągnąć z rawText
        const volume = raw.volume ?? this.parseVolume(rawText) ?? 0;

        // cena z scrapera (number) albo fallback
        const price = raw.price ?? this.parsePriceFromText(rawText);

        const pricePoint: PriceHistory = {
          date: new Date(),
          price,
        };

        const store: Store = {
          name: this.storeName,
          image: this.storeImage,
          priceHistory: [pricePoint],
          price,
          lastUpdate: new Date(),
        };

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

  // ---- helpers ----

  normalizeName(raw: string): string {
    return (
      raw
        // usuń pojemności
        .replace(/(\d+(?:[.,]\d+)?\s*(?:l|ml|cl))/gi, "")
        // usuń 40%, 30%, 50% vol, itd.
        .replace(/(\d{1,3}\s*%)/gi, "")
        // usuń ceny
        .replace(/(\d+[.,]?\d*\s*zł)/gi, "")
        // usuń śmieci
        .replace(/\s{2,}/g, " ")
        .trim()
    );
  }

  parseFlavor(raw: string): VodkaFlavor {
    const s = raw.toLowerCase();
    if (s.includes("mango")) return "mango";
    if (s.includes("cytryn") || s.includes("lemon")) return "lemon";
    if (s.includes("mięt") || s.includes("mint")) return "mint";
    if (s.includes("wiś")) return "cherry";
    if (s.includes("porzecz")) return "currant";
    return "pure";
  }

  parseAbv(raw: string): number | null {
    const m =
      raw.match(/(\d{2})(?=\s*%|\s*vol|\s*alc)/i) || raw.match(/(\d{2})\s*%/i);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return isNaN(n) ? null : n;
  }

  parseVolume(raw: string): number | null {
    const match = raw.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(l|ml|cl)/i);
    if (!match) return null;

    let value = parseFloat(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();

    if (unit === "l") value *= 1000;
    if (unit === "cl") value *= 10;

    return Math.round(value);
  }

  // UWAGA: surowa cena z raw.price jest numberem
  // tutaj robimy fallback z tekstu
  parsePriceFromText(raw: string): number {
    const match = raw.match(/(\d+[.,]\d{1,2})\s*zł/i);
    if (!match) return 0;

    const num = parseFloat(match[1].replace(",", "."));
    return isNaN(num) ? 0 : num;
  }
}
