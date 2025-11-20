// src/scrapers/BiedronkaScraper.ts
import { RawVodka } from "../types/VodkaProps";
import { BaseScraper } from "./BaseScraper";
import { VodkaParser } from "../parsers/VodkaParser";

export class BiedronkaScraper extends BaseScraper {
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

  constructor(headless = false) {
    super(
      "Biedronka",
      "https://www.biedronka.pl/pl/piwniczka-biedronki,kategoria,wodka",
      headless
    );
  }

  async scrape() {
    await this.init();
    await this.openPage();

    await this.acceptCookies(this.selectors.cookies);
    await this.fillAgeGate(this.selectors.ageGate);

    const rawList = await this.getProductsRaw();

    const parser = new VodkaParser(this.name, "/biedronka.png");
    const vodkas = parser.parse(rawList);

    await this.close();
    return vodkas;
  }

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

        // składamy cenę
        const combinedPrice = rawPriceInt
          ? rawPriceDec
            ? `${rawPriceInt}.${rawPriceDec}`
            : rawPriceInt
          : "";

        // parujemy cenę do number
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
