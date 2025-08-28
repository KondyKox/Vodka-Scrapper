import requests
from bs4 import BeautifulSoup


def get_prices():
    url = "https://www.biedronka.pl/pl/piwniczka-biedronki,kategoria,wodka"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "lxml")

    vodkas = []

    # Dobrać selektory do rzeczywistej strony
    for item in soup.select(".product-item"):
        name = item.select_one(".product-title").text.strip()
        price = item.select_one(".price").text.strip()
        vodkas.append({"name": name, "price": price})

    return vodkas
