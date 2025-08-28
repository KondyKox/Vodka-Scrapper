import re

# mapa smaków z polskiego na angielski
FLAVOR_MAP = {
    "czysta": "pure",
    "cytrynowa": "lemon",
    "żurawinowa": "cranberry",
    "śliwkowa": "plum",
    "jabłkowa": "apple",
    "miętowa": "mint",
    "karmelowa": "caramel",
    "gruszkowa": "pear",
    "wiśniowa": "cherry",
    "wiśnia": "cherry",
}


def normalize_name(raw_name: str) -> str:
    name = re.sub(r"(?i)wódka", "", raw_name)
    name = re.sub(r"\d{1,2}[,.]?\d*%", "", name)
    return name.strip()


def parse_volume(raw_volume: str) -> float | None:
    if not raw_volume:
        return None

    vol = raw_volume.lower().replace(" ", "")
    try:
        if "ml" in vol:
            return int(vol.replace("ml", "")) / 1000
        if "l" in vol:
            return float(vol.replace("l", "").replace(",", "."))
    except ValueError:
        return None

    return None


def parse_price(raw_price: str) -> float | None:
    if not raw_price:
        return None

    try:
        match = re.search(r"(\d+[,.]?\d*)", raw_price)
        if match:
            return float(match.group(1).replace(",", "."))
    except ValueError:
        return None

    return None


def parse_flavor(raw_name: str) -> str:
    raw_name = raw_name.lower()
    for pl, en in FLAVOR_MAP.items():
        if pl in raw_name:
            return en
    return "plain"


def clean_text(text: str) -> str:
    if not text:
        return ""
    return text.replace("\xa0", "").strip()


def normalize_product(product: dict, store_name="Biedronka") -> dict:
    name = normalize_name(product.get("name", ""))
    flavor = parse_flavor(product.get("name", ""))
    volume = parse_volume(clean_text(product.get("volume", "")))
    price = parse_price(clean_text(product.get("price", "")))
    image_url = product.get("imageSrc")

    normalized = {
        "name": name,
        "flavor": flavor,
        "volume": volume,
        "price": price,
        "store": store_name,
    }

    if image_url:
        normalized["image_url"] = image_url

    return normalized
