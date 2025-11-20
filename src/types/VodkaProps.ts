// Types
export interface Vodka {
  _id: string;
  name: string;
  imageSrc: string;
  alcoholPercentage: number;
  flavor: VodkaFlavor;
  variants: VodkaVariant[];
}

export type VodkaFlavor =
  | "pure"
  | "mint"
  | "lemon"
  | "cherry"
  | "currant"
  | "mango";

export interface VodkaVariant {
  volume: number;
  stores: Store[];
  averagePrice?: number;
}

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
