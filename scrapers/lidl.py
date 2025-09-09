from scrapers import BaseScraper
from selenium.webdriver.common.by import By
from utils import (
    clean_text,
    parse_flavor,
    parse_lidl_summary,
    normalize_product,
)


class LidlScraper(BaseScraper):
    def __init__(self, headless=True):
        super().__init__(
            url="https://winnicalidla.pl/kategorie/sklepy/wodka",
            headless=headless,
        )

    def get_products(self):
        products_data = []
        products = self.driver.find_elements(By.CLASS_NAME, "product-item")

        print(f"Found {len(products)} products on Lidl page.")

        for idx, product in enumerate(products, start=1):
            raw_line = ""  # for debug logs
            try:
                prod_info_el = product.find_element(
                    By.CSS_SELECTOR, "a.product-item-link"
                )
                raw_line = clean_text(
                    prod_info_el.get_attribute("textContent")
                )  # ["Vodka Name", "0,5L", "40%"]

                # Split product data
                parsed = parse_lidl_summary(raw_line)
                name_part = parsed["name_part"]
                raw_volume = parsed["raw_volume"]
                raw_abv = parsed["raw_abv"]

                flavor = parse_flavor(name_part)

                img_el = product.find_elements(
                    By.CSS_SELECTOR,
                    "img.product-image-photo, .product-image-photo img, img",
                )
                imageSrc = img_el[0].get_attribute("src") if img_el else None

                raw_product = {
                    "name": name_part,
                    "price": 0,
                    "flavor": flavor,
                    "volume": raw_volume,
                    "alcoholPercentage": raw_abv,
                    "imageSrc": imageSrc,
                }

                normalized = normalize_product(raw_product, store_name="Lidl")
                products_data.append(normalized)

            except Exception as e:
                print(
                    f"[LIDL] Failed to parse product #{idx}: {e} | raw_line='{raw_line}'"
                )
                continue

        return products_data

    def run(self):
        try:
            self.open_page()
            return self.get_products()
        finally:
            self.close()
