import { chromium, Browser, Page, BrowserContext } from "playwright";
import { Vodka } from "../types/VodkaProps";

/**
 * Abstrakcyjna klasa bazowa dla scraperów sklepów.
 *
 * Nadaje standardowy workflow:
 *  - start przeglądarki,
 *  - otwarcie strony,
 *  - akceptacja cookies,
 *  - przejście age gate,
 *  - zebranie danych,
 *  - zamknięcie przeglądarki.
 *
 * Każdy scraper musi zaimplementować metodę `scrape()`,
 * która zwraca listę produktów typu `Vodka[]`.
 */
export abstract class BaseScraper {
  /** Instancja uruchomionej przeglądarki Chromium */
  browser!: Browser;

  /** Kontekst przeglądarki — oddziela sesję, cookie, localStorage itd. */
  context!: BrowserContext;

  /** Główna karta, na której operuje scraper */
  page!: Page;

  /**
   * @param name Nazwa scrapera (np. "Lidl", "Biedronka") — wykorzystywana w logach
   * @param url Adres strony, którą scraper ma otworzyć
   * @param headless Czy uruchamiać w trybie headless (bez okna)
   * @param timeout Domyślny timeout operacji na stronie (w milisekundach)
   */
  constructor(
    public name: string,
    public url: string,
    public headless: boolean = true,
    public timeout: number = 10_000
  ) {}

  /**
   * Inicjalizuje Playwright:
   *  - uruchamia przeglądarkę,
   *  - tworzy nowy kontekst,
   *  - otwiera stronę,
   *  - ustawia domyślne timeouty.
   *
   * Wywołaj tę metodę zawsze jako pierwszą.
   */
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

  /**
   * Otwiera stronę ustawioną w konstruktorze.
   *
   * Używa:
   *  - `domcontentloaded` jako punktu załadowania,
   *  - lekkiego opóźnienia (800ms), aby dynamiczne elementy się wyrenderowały.
   *
   * @throws Error jeśli init() nie został wywołany.
   */
  async openPage() {
    if (!this.page) throw new Error("Call init() first");

    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
    await this.page.waitForTimeout(800);
  }

  /**
   * Akceptuje bannery cookies, jeśli są widoczne.
   *
   * @param selector Selektor CSS przycisku "Akceptuję" lub podobnego.
   *
   * Działanie:
   *  - Czeka do 8 sekund aż element się pojawi,
   *  - Próbuje kliknąć pierwszy dopasowany element,
   *  - Ignoruje błędy (jeśli banner nie pojawił się lub jest nieklikalny).
   */
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

  /**
   * Obsługuje tzw. "age gate" — przycisk potwierdzający pełnoletniość.
   *
   * @param submitSelector Selektor CSS przycisku potwierdzającego wiek.
   *
   * Działanie:
   *  - Czeka na element 8s,
   *  - Wymusza kliknięcie,
   *  - Czeka aż załadują się produkty (product-item lub productCard),
   *  - Wypisuje logi pomocnicze.
   *
   * Ignoruje błąd jeśli gate nie istnieje.
   */
  async fillAgeGate(submitSelector: string) {
    if (!this.page) return;

    try {
      console.log(`[${this.name}] Checking for age gate submit button...`);

      await this.page.waitForSelector(submitSelector, { timeout: 8000 });

      const btn = this.page.locator(submitSelector).first();
      await btn.waitFor({ state: "visible", timeout: 5000 });

      console.log(`[${this.name}] Age gate submit button visible, clicking...`);
      await btn.click({ force: true });

      await this.page.waitForSelector(".product-item, .productCard", {
        timeout: 6000,
      });

      console.log(`[${this.name}] Age gate passed, navigation done.`);
    } catch (err) {
      console.log(`[${this.name}] No age gate submit or failed to click:`, err);
    }
  }

  /**
   * Zamyka kolejno:
   *  - kartę,
   *  - kontekst,
   *  - przeglądarkę.
   *
   * Powinna być zawsze wywoływana w bloku `finally`.
   */
  async close() {
    console.log(`[${this.name}] Closing browser...`);
    await this.context?.close();
    await this.browser?.close();
  }

  /**
   * Główna metoda scraperów — implementowana w klasach dziedziczących.
   *
   * Powinna:
   *  1. Wywołać init()
   *  2. Otworzyć stronę
   *  3. Obsłużyć cookies / age gate (jeśli istnieją)
   *  4. Wyciągnąć dane
   *  5. Zwrócić wynik w formacie Vodka[]
   *
   * @returns Promise<Vodka[]> — lista przetworzonych produktów
   */
  abstract scrape(): Promise<Vodka[]>;
}
