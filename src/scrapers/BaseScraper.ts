import { chromium, Browser, Page } from "playwright";

export class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  constructor(
    public url: string,
    public headless: boolean = true,
    public timeout: number = 10_000
  ) {}

  async init() {
    this.browser = await chromium.launch({ headless: this.headless });
    const context = await this.browser.newContext({
      locale: "pl-PL",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    });
    this.page = await context.newPage();
    this.page.setDefaultTimeout(this.timeout);
  }

  async openPage() {
    if (!this.page) throw new Error("Call init() first");
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle");
  }

  // accept cookies on page
  async acceptCookies(selector: string) {
    if (!this.page) return;

    try {
      const button = this.page.locator(selector);
      await button.first().waitFor({ timeout: 3000 });
      await button.first().click();
      await this.page.waitForTimeout(1000);
      console.log("Cookies accepted.");
    } catch {
      console.log("No cookie banner found.");
    }
  }

  // age gate
  async fillAgeGate(
    selectors: {
      day: string;
      month: string;
      year: string;
      submit: string;
    },
    birthdate = ["01", "01", "1990"]
  ) {
    if (!this.page) return;

    try {
      console.log("Looking for age verification...");

      const day = this.page.locator(selectors.day);
      await day.waitFor({ timeout: 3000 });

      await day.fill(birthdate[0]);
      await this.page.locator(selectors.month).fill(birthdate[1]);
      await this.page.locator(selectors.year).fill(birthdate[2]);

      const submit = this.page.locator(selectors.submit);
      await submit.waitFor({ timeout: 3000 });
      await submit.click();

      await this.page.waitForTimeout(2000);
      console.log("Age gate filled.");
    } catch {
      console.log("No age gate found.");
    }
  }

  async close() {
    console.log("Closing browser...");
    await this.browser?.close();
  }
}
