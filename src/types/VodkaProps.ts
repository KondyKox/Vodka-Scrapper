// Types
export interface Vodka {
  name: string;
  flavor: VodkaFlavor;
  volume: number;
  alcoholPercentage: number;
  imageSrc: string;
  store: Store;
}

export interface RawVodka {
  name: string; // surowa nazwa z karty
  price: number | null; // surowa cena (sama liczba), może być null jak nic nie znajdzie
  imageSrc: string | null;
  volume: number | null; // surowe ml/l z tekstu
  url: string | null; // opcjonalnie link
  rawText: string; // CAŁY TEKST karty jak w Pythonie
}

export type VodkaFlavor =
  | "pure"
  | "mint"
  | "lemon"
  | "cherry"
  | "currant"
  | "mango";

export interface PriceHistory {
  date: Date;
  price: number;
}

export interface Store {
  name: string;
  image: string;
  priceHistory: PriceHistory[];
  price: number;
  lastUpdate: Date | null;
}
