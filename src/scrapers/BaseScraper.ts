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
  async fillAgeGate(selectors: {
    day?: string;
    month?: string;
    year?: string;
    submit: string;
  }) {
    if (!this.page) return;

    try {
      console.log(`[${this.name}] Checking for age gate...`);

      const { day, month, year, submit } = selectors;

      const submitBtn = this.page.locator(submit).first();
      const hasSubmit = (await submitBtn.count()) > 0;

      const dayField = day ? this.page.locator(day).first() : null;
      const monthField = month ? this.page.locator(month).first() : null;
      const yearField = year ? this.page.locator(year).first() : null;

      // --- CASE 1: age gate z polami ---
      if (dayField && monthField && yearField) {
        const hasDay = (await dayField.count()) > 0;

        if (hasDay) {
          await dayField.fill("01");
          await monthField.fill("01");
          await yearField.fill("1990");
          await submitBtn.click();
          await this.page.waitForTimeout(1200);

          console.log(`[${this.name}] Age gate (input version) filled.`);
          return;
        }
      }

      // --- CASE 2: tylko przycisk ---
      if (hasSubmit) {
        console.log(`[${this.name}] Simple age gate button found.`);

        await submitBtn.click();
        await this.page.waitForTimeout(800);

        console.log(`[${this.name}] Age gate (button version) clicked.`);
        return;
      }

      console.log(`[${this.name}] No age gate found.`);
    } catch (err) {
      console.log(`[${this.name}] Failed age verification.`);
    }
  }

  async close() {
    console.log(`[${this.name}] Closing browser...`);
    await this.context?.close();
    await this.browser?.close();
  }

  abstract scrape(): Promise<Vodka[]>;
}
