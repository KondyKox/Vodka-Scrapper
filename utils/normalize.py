import re

FLAVOR_REGEX = {
    r"cytryn": "lemon",
    r"żurawin": "cranberry",
    r"śliwk": "plum",
    r"jabł": "apple",
    r"mięt": "mint",
    r"karmel": "caramel",
    r"gruszk": "pear",
    r"wiśni|wiśnia": "cherry",
    r"czysta|czarna": "pure",
}


def clean_text(text: str) -> str:
    if text is None:
        return ""
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def parse_volume(raw_volume: str) -> int | None:
    if not raw_volume:
        return None
    vol = clean_text(raw_volume).lower()
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(ml|l)\b", vol)
    if not m:
        return None
    val = float(m.group(1).replace(",", "."))
    unit = m.group(2)

    if unit == "ml":
        return round(val / 1000, 3)
    else:
        return round(val, 3)


def parse_price(raw_price: str) -> float | None:
    if not raw_price:
        return None
    t = clean_text(raw_price)

    # forma "59 99" albo "59,99"
    m = re.search(r"(\d+)[\s,\.](\d{2})", t)
    if m:
        return float(f"{m.group(1)}.{m.group(2)}")

    # fallback: np. "59,99"
    m2 = re.search(r"\d+[.,]\d{2}", t)
    if m2:
        return float(m2.group(0).replace(",", "."))

    return None


def parse_abv(raw_name: str) -> int | None:
    if not raw_name:
        return None
    m = re.search(r"(\d{1,2}(?:[.,]\d)?)\s*%", raw_name)
    if not m:
        return None
    return int(float(m.group(1).replace(",", ".")))


def normalize_name(raw_name: str) -> str:
    s = clean_text(raw_name)
    s = re.sub(r"(?i)\bwódka\b", "", s)
    s = re.sub(r",?\s*\d{1,2}(?:[.,]\d)?\s*%", "", s)
    return s.strip().title()


def parse_flavor(raw_name: str) -> str:
    raw = clean_text(raw_name).lower()
    for pattern, flavor in FLAVOR_REGEX.items():
        if re.search(pattern, raw):
            return flavor
    return "pure"


def normalize_product(product: dict, store_name: str) -> dict:
    """
    Normalizuje surowe dane produktu do spójnego schematu wódki.
    """
    raw_name = product.get("name", "")
    raw_price = product.get("price", "")
    raw_volume = product.get("volume", "")
    raw_abv = product.get("alcoholPercentage", "")
    src = product.get("imageSrc")

    return {
        "name": normalize_name(raw_name),
        "flavor": parse_flavor(raw_name),
        "volume": (
            parse_volume(raw_volume) if isinstance(raw_volume, str) else raw_volume
        ),
        "alcoholPercentage": (
            parse_abv(str(raw_abv))
            if not isinstance(raw_abv, (int, float))
            else raw_abv or 40
        ),
        "price": (
            raw_price if isinstance(raw_price, (int, float)) else parse_price(raw_price)
        ),
        "store": store_name,
        "imageSrc": src,
    }
