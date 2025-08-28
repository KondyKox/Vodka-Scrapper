from selenium.webdriver.common.by import By
from scrapers.base_scraper import BaseScraper
import re


def parse_volume(volume_text: str) -> int:
    volume_text = volume_text.lower().strip()
    if "ml" in volume_text:
        return int(re.sub(r"\D", "", volume_text))
    if "l" in volume_text:
        return int(float(volume_text.replace("l", "").strip().replace(",", ".")) * 1000)
    return None


def parse_abv(name: str) -> int | None:
    match = re.search(r"(\d{2})\s*%", name)
    return int(match.group(1)) if match else None


def clean_name(name: str) -> str:
    # Usuwamy abv z nazwy, poprawiamy case
    return re.sub(r",?\s*\d{2}\s*%", "", name).strip().title()


def parse_price(price_text: str) -> float | None:
    # Wyciągamy liczbę (np. "59,99 zł" -> 59.99)
    match = re.search(r"(\d+[,.]?\d*)", price_text)
    return float(match.group(1).replace(",", ".")) if match else None


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
                raw_name = product.find_element(By.CSS_SELECTOR, "li.name").text.strip()
                raw_price = product.find_element(
                    By.CSS_SELECTOR, "li.price"
                ).text.strip()
                raw_volume = product.find_element(
                    By.CSS_SELECTOR, "li.price > p.liters"
                ).text.strip()
                imageSrc = product.find_element(
                    By.CSS_SELECTOR, ".img-prod > img"
                ).get_attribute("src")

                volume_ml = parse_volume(raw_volume)
                abv = parse_abv(raw_name)
                name = clean_name(raw_name)
                price_pln = parse_price(raw_price)

                # marka = słowo po "Wódka"
                brand = None
                if name.lower().startswith("wódka "):
                    brand = name.split(" ", 1)[1].split()[0]

                products_data.append(
                    {
                        "brand": brand,
                        "name": name,
                        "abv": abv,
                        "volume_ml": volume_ml,
                        "price_pln": price_pln,
                        "image_url": imageSrc,
                    }
                )
            except Exception as e:
                print(f"Failed to parse product: {e}")
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
