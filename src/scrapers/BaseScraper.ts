import { chromium, Browser, Page, BrowserContext } from "playwright";
import { Vodka } from "../types/VodkaProps";

export abstract class BaseScraper {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(
    public name: string,
    public url: string,
    public headless: boolean = true,
    public timeout: number = 10_000
  ) {}

  async init() {
    this.browser = await chromium.launch({ headless: this.headless });

    this.context = await this.browser.newContext({
      locale: "pl-PL",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.timeout);
  }

  async openPage() {
    if (!this.page) throw new Error("Call init() first");

    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
    // await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(800);
  }

  // accept cookies on page
  async acceptCookies(selector: string) {
    if (!this.page) return;

    try {
      console.log(`[${this.name}] Waiting for cookie banner...`);

      await this.page.waitForSelector(selector, {
        timeout: 8000,
      });

      const button = this.page.locator(selector).first();

      await button.click();
      await this.page.waitForTimeout(800);

      console.log(`[${this.name}] Cookies accepted.`);
    } catch {
      console.log(`[${this.name}] Cookie banner not clickable.`);
    }
  }

  // age gate
  async fillAgeGate(submitSelector: string) {
    if (!this.page) return;

    try {
      console.log(`[${this.name}] Checking for age gate submit button...`);

      // czekamy, aż input submit pojawi się w DOM
      await this.page.waitForSelector(submitSelector, { timeout: 8000 });

      const btn = this.page.locator(submitSelector).first();
      await btn.waitFor({ state: "visible", timeout: 5000 });

      console.log(`[${this.name}] Age gate submit button visible, clicking...`);
      await btn.click({ force: true });

      // Po kliknięciu czekamy, aż strona się przeładuje
      await this.page.waitForSelector(".product-item, .productCard", {
        timeout: 6000,
      });

      console.log(`[${this.name}] Age gate passed, navigation done.`);
    } catch (err) {
      console.log(`[${this.name}] No age gate submit or failed to click:`, err);
    }
  }

  async close() {
    console.log(`[${this.name}] Closing browser...`);
    await this.context?.close();
    await this.browser?.close();
  }

  abstract scrape(): Promise<Vodka[]>;
}
