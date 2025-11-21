import { RawVodka } from "../types/VodkaProps";
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
    },

    productItem: ".product-item, .big-products-box, .productCard",
    productName: "li.name, .product-name, .productTitle",
    productPrice: "li.old_price, .price__integer, .price",
    productPriceDecimals: ".price__decimal, .price-decimals",
    productImg: ".img-prod img, img",
    productLink: "a",
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
    await this.fillAgeGate("input#yes");

    const rawList = await this.getProductsRaw();

    const parser = new VodkaParser(this.name, "/biedronka.png");
    const vodkas = parser.parse(rawList);

    await this.close();
    return vodkas;
  }

  /**
   * Pobiera wszystkie karty produktów na stronie i konstruuje z nich
   * struktury RawVodka.
   *
   * Proces:
   * - Delikatny wait + scroll, bo Biedronka czasem lazy-loaduje elementy.
   * - Wyszukanie wszystkich elementów produktu po selektorze productItem.
   * - Próba wyciągnięcia:
   *   - nazwy
   *   - ceny (integer + decimals)
   *   - zdjęcia
   *   - URLa
   *   - całego tekstu karty
   *
   * Gdy jakiś element nie istnieje → fallback do "cardText".
   *
   * Zwraca RawVodka[], czyli WERSJĘ SUROWĄ,
   * którą później ogarnia VodkaParser.
   */
  private async getProductsRaw(): Promise<RawVodka[]> {
    await this.page.waitForTimeout(600);
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.page.waitForTimeout(800);

    const items = await this.page.$$(this.selectors.productItem);
    const results: RawVodka[] = [];

    for (const item of items) {
      try {
        const cardText = (await item.textContent())?.trim() ?? "";

        const rawName = await item
          .$eval(this.selectors.productName, (el) => el.textContent?.trim())
          .catch(() => cardText);

        const rawPriceInt = await item
          .$eval(this.selectors.productPrice, (el) => el.textContent?.trim())
          .catch(() => "");

        const rawPriceDec = await item
          .$eval(this.selectors.productPriceDecimals, (el) =>
            el.textContent?.trim()
          )
          .catch(() => "");

        /**
         * Składanie ceny:
         * - Jeśli oba fragmenty są → "4" + "." + "99" = "4.99"
         * - Jeśli tylko integer → używamy samego integera
         * - Jeśli nic → pusty string
         */
        const combinedPrice = rawPriceInt
          ? rawPriceDec
            ? `${rawPriceInt}.${rawPriceDec}`
            : rawPriceInt
          : "";

        // Parsowanie liczby z tekstu
        const priceNumber = this.cleanPriceToNumber(combinedPrice) || 0;

        const imageSrc = await item
          .$eval(this.selectors.productImg, (el) => el.getAttribute("src"))
          .catch(() => null);

        const url = await item
          .$eval(this.selectors.productLink, (el) => el.getAttribute("href"))
          .catch(() => null);

        results.push({
          name: rawName ?? cardText,
          price: priceNumber,
          imageSrc,
          volume: null,
          url,
          rawText: cardText,
        });
      } catch (err) {
        console.warn("[BiedronkaScraper] product parse failed:", err);
        continue;
      }
    }

    return results;
  }

  /**
   * Czyści tekst ceny do formatu number.
   *
   * Wykonuje:
   * - usuwanie spacji
   * - usuwanie "zł"
   * - filtr na cyfry i . oraz ,
   * - zamianę przecinka na kropkę
   * - parseFloat
   *
   * Jeśli czegoś nie da się sparsować → zwraca 0.
   */
  private cleanPriceToNumber(text: string): number {
    if (!text) return 0;
    const cleaned = text
      .replace(/\s/g, "")
      .replace(/zł/gi, "")
      .replace(/[^\d.,]/g, "")
      .replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
}
