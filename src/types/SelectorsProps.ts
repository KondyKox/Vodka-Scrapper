export interface Selectors {
  cookies: string;
  ageGate: {
    accept: string;
    submit?: string;
    day?: string;
    month?: string;
    year?: string;
  };
  product: {
    item: string;
    name: string;
    price: string;
    priceDecimals?: string;
    imgSrc: string;
    link: string;
  };
}
