from scrapers import BiedronkaScraper
from utils import save_to_csv, save_to_json, normalize_product


def main():
    # Biedronka
    scraper = BiedronkaScraper(headless=True)
    raw_products = scraper.run()

    # testing
    # for p in raw_products:
    #     print(p.get("name"), p.get("price"), p.get("volume"))

    normalized_products = [
        normalize_product(p, store_name="Biedronka") for p in raw_products
    ]

    save_to_csv(normalized_products, filename="data/vodkas.csv")
    save_to_json(normalized_products, filename="data/vodkas.json")


if __name__ == "__main__":
    main()
