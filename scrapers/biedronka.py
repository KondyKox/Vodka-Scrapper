from selenium.webdriver.common.by import By
from scrapers.base_scraper import BaseScraper
from utils import (
    clean_text,
    parse_volume,
    parse_price,
    parse_abv,
    normalize_name,
    parse_flavor,
)


class BiedronkaScraper(BaseScraper):
    def __init__(self, headless=True):
        super().__init__(
            url="https://www.biedronka.pl/pl/piwniczka-biedronki,kategoria,wodka",
            headless=headless,
        )
        self.cookie_selector = "button#onetrust-accept-btn-handler"
        self.age_selectors = {
            "day": 'input[name="gateDay"]',
            "month": 'input[name="gateMonth"]',
            "year": 'input[name="gateYear"]',
            "submit": "#gateSubmit",
        }

    def get_products(self):
        products_data = []
        products = self.driver.find_elements(By.CLASS_NAME, "product-item")

        print(f"Found {len(products)} products on Biedronka page.")

        for product in products:
            try:
                # surowy tekst całej karty (przydatny do fallbacków)
                card_text = clean_text(product.text)

                # --- NAZWA ---
                name_el = product.find_elements(By.CSS_SELECTOR, "li.name")
                raw_name = clean_text(name_el[0].text) if name_el else card_text

                # --- CENA ---
                price_block = product.find_elements(By.CSS_SELECTOR, "li.old_price")
                raw_price = (
                    clean_text(price_block[0].text) if price_block else card_text
                )

                # --- POJEMNOŚĆ ---
                vol_el = product.find_elements(By.CSS_SELECTOR, "li.price p.liters")
                raw_volume = clean_text(vol_el[0].text) if vol_el else ""

                # --- OBRAZEK ---
                img_el = product.find_elements(By.CSS_SELECTOR, ".img-prod img, img")
                imageSrc = img_el[0].get_attribute("src") if img_el else None

                # --- PARSING ---
                name = normalize_name(raw_name)
                flavor = parse_flavor(raw_name)
                abv = parse_abv(raw_name) or parse_abv(card_text)
                volume = parse_volume(raw_volume) or parse_volume(card_text)
                price = parse_price(raw_price) or parse_price(card_text)

                products_data.append(
                    {
                        "name": name,
                        "flavor": flavor,
                        "alcoholPercentage": abv,
                        "volume": volume,
                        "price": price,
                        "imageSrc": imageSrc,
                    }
                )
            except Exception as e:
                print(f"[BIEDRONKA] Failed to parse product: {e}")
                continue

        return products_data

    # Run scraper
    def run(self):
        try:
            self.open_page()
            self.accept_cookies(self.cookie_selector)
            self.fill_age_gate(self.age_selectors)
            return self.get_products()
        finally:
            self.close()
