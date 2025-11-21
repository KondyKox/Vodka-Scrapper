// ---------------------------------------------
// 1) Output type for frontend
// ---------------------------------------------
export interface Vodka {
  name: string;
  flavor: VodkaFlavor;
  volume: number; // in ml
  alcoholPercentage: number;
  imageSrc: string;
  store: Store; // contains pricehistory etc.
}

// ---------------------------------------------
// 2) Raw type returned from scrapers
// ---------------------------------------------
export interface RawVodka {
  /**
   * Surowa nazwa z karty produktu — np. "Stock Prestige 0,5l 40%"
   * Może być identyczna z rawText, ale NIE musi.
   */
  name: string;

  /**
   * Surowa cena wyciągnięta przez scrappera.
   * Jeśli scraper nie potrafił → null.
   */
  price: number | null;

  /**
   * Surowy link do zdjęcia.
   * Jeśli brak → null.
   */
  imageSrc: string | null;

  /**
   * Jeśli scraper potrafił wyciągnąć objętość (np. Lidl nie zawsze) → ml
   * Jeśli nie → null (parser zgadnie z rawText).
   */
  volume: number | null;

  /**
   * Link do karty produktu, jeśli scraper go widzi.
   * Nie zawsze możliwy → null.
   */
  url: string | null;

  /**
   * Najważniejszy tekst.
   * To jest cały surowy tekst karty (jak w Pythonowym scrapowaniu).
   * Parser z tego wyciąga flavor, abv, volume, price fallback itd.
   */
  rawText: string;
}

// ---------------------------------------------
// 3) Flavor enum
// ---------------------------------------------
export type VodkaFlavor =
  | "pure"
  | "mint"
  | "lemon"
  | "cherry"
  | "currant"
  | "mango";

// ---------------------------------------------
// 4) Price history
// ---------------------------------------------
export interface PriceHistory {
  date: Date;
  price: number;
}

// ---------------------------------------------
// 5) Store info stored inside Vodka
// ---------------------------------------------
export interface Store {
  name: string;
  image: string;
  priceHistory: PriceHistory[];
  price: number;
  lastUpdate: Date;
}
