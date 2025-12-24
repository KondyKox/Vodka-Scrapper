import { BaseScraper } from "./BaseScraper";
import { VodkaParser } from "../parsers/VodkaParser";

/**
 * Scraper odpowiedzialny za pobieranie danych o wódkach
 * z kategorii "Piwniczka Biedronki" na stronie biedronka.pl.
 *
 * Dziedziczy po BaseScraper, więc korzysta ze wspólnych metod:
 * - init() – odpalenie Puppeteera
 * - openPage() – przejście na adres sklepu
 * - acceptCookies() – kliknięcie przycisku cookies
 * - fillAgeGate() – przejście przez weryfikację wieku
 * - close() – zamknięcie przeglądarki
 *
 * Zadaniem tego scraperka jest:
 * 1. Odpalić stronę.
 * 2. Ominąć cookies + age gate.
 * 3. Zeskrolować stronę.
 * 4. Zebrać "surowe" informacje o produktach (RawVodka).
 * 5. Przepuścić je przez parser → dostajesz Vodka[] gotowe na frontend.
 */
export class BiedronkaScraper extends BaseScraper {
  /**
   * Selektory wykorzystywane do interakcji i scrapowania.
   * Podzielone logicznie:
   * - cookies – kilka możliwych selektorów akceptacji
   * - ageGate – pola formularza + submit
   * - product* – elementy kart produktów
   */
  selectors = {
    cookies: "button#onetrust-accept-btn-handler, #didomi-notice-agree-button",

    ageGate: {
      day: 'input[name="gateDay"]',
      month: 'input[name="gateMonth"]',
      year: 'input[name="gateYear"]',
      submit: "#gateSubmit",
      accept: "input#yes",
    },

    product: {
      item: ".product-item, .big-products-box, .productCard",
      name: "li.name, .product-name, .productTitle",
      price: "li.old_price, .price__integer, .price",
      priceDecimals: ".price__decimal, .price-decimals",
      imgSrc: ".img-prod img, img",
      link: "a",
    },
  };

  /**
   * Konstruktor. Przekazuje do BaseScraper:
   * - nazwę sklepu
   * - URL kategorii z alkoholami
   * - tryb headless (domyślnie true)
   */
  constructor(headless = true) {
    super(
      "Biedronka",
      "https://www.biedronka.pl/pl/piwniczka-biedronki,kategoria,wodka",
      headless
    );
  }

  /**
   * Główna metoda scrapera.
   * Wykonuje pełny proces:
   * 1. Start Puppeteera.
   * 2. Wejście na stronę.
   * 3. Akceptacja cookies.
   * 4. Przejście przez age gate.
   * 5. Pobranie listy surowych produktów.
   * 6. Konwersja RawVodka → Vodka przez VodkaParser.
   * 7. Zamknięcie przeglądarki.
   *
   * Zwraca tablicę Vodka[] gotową do zapisania w DB lub wysłania na frontend.
   */
  async scrape() {
    await this.init();
    await this.openPage();

    await this.acceptCookies(this.selectors.cookies);
    await this.fillAgeGate(this.selectors.ageGate.accept);

    const rawList = await this.getProductsRaw(this.selectors);

    const parser = new VodkaParser(this.name, "/biedronka.png");
    const vodkas = parser.parse(rawList);

    await this.close();
    return vodkas;
  }
}
