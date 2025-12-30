import { VodkaParser } from "../parsers/VodkaParser";
import { Vodka } from "../types/VodkaProps";
import { BaseScraper } from "./BaseScraper";

export class DinoScraper extends BaseScraper {
  // TODO: zmienic selektory bo te ni chuja nie dzialają (albo zjebalem)
  selectors = {
    cookies: "#cookiescript_accept",
    newsletter: "div[data-v\\-280ab3c9] button",

    ageGate: {
      submit: "input[data-v-e7d81f91]",
      accept: 'button > span:has-text("Tak")',
    },

    product: {
      item: "div[data-v-5311da7f]",
      name: "h3[data-v-6b9a5b60]",
      price: "div[data-v-6b9a5b60] > span",
      imgSrc: "img[data-v-6b9a5b60]",
      link: "a[data-v-6b9a5b60]",
    },
  };

  constructor(headless = true) {
    super("Dino", "https://marketdino.pl/kategoria/zakatek-alkoholi", headless);
  }

  async scrape(): Promise<Vodka[]> {
    await this.init();
    await this.openPage();

    await this.acceptCookies(this.selectors.cookies);
    await this.acceptAgeGate();

    const rawList = await this.getProductsRaw(this.selectors);

    const parser = new VodkaParser(this.name, "/dino.png");
    const vodkas = parser.parse(rawList);

    await this.close();
    return vodkas;
  }

  async acceptAgeGate() {
    const inputSelector = this.selectors.ageGate.submit;
    await this.page.waitForSelector(inputSelector, {
      timeout: 8000,
    });

    const input = this.page.locator(inputSelector).first();
    await input.waitFor({ state: "visible", timeout: 5000 });

    await input.check({ force: true });
    await this.fillAgeGate(this.selectors.ageGate.accept);
  }
}
