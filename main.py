from scrapers import BiedronkaScraper, LidlScraper
from utils import save_to_csv, save_to_json, normalize_product


def main():
    scrapers = [
        # ("Biedronka", BiedronkaScraper(headless=True)),
        ("Lidl", LidlScraper(headless=True)),
    ]

    all_products = []

    for store_name, scraper in scrapers:
        products = scraper.run()
        normalized = [normalize_product(p, store_name=store_name) for p in products]
        all_products.extend(normalized)

    save_to_csv(all_products, filename="data/vodkas.csv")
    save_to_json(all_products, filename="data/vodkas.json")


if __name__ == "__main__":
    main()
