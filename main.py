from scrapers.biedronka import get_prices
from utils.helpers import save_to_csv


def main():
    vodka_prices = get_prices()
    save_to_csv(vodka_prices)

    for vodka in vodka_prices:
        print(vodka)


if __name__ == "__main__":
    main()
