from utils import clean_text
import re


def parse_lidl_summary(raw_text: str) -> str:
    """
    Parsuje krótką linię produktową z Lidla:
    np. "Soplica Cytrynówka | 0,5L | 28%" -> {
        "name_part": "Soplica Cytrynówka",
        "raw_volume": "0,5L",
        "raw_abv": "28%"
    }

    Zwraca dict z kluczami: name_part, raw_volume, raw_abv.
    Wszystkie wartości są stringami (może być "" gdy brak).
    """

    txt = clean_text(raw_text)
    parts = [p.strip() for p in re.split(r"\s*[|•]\s*|\n+", txt) if p.strip()]

    name_part = parts[0] if parts else txt

    vol_m = re.search(r"(\d+(?:[.,]\d+)?)\s*(ml|l)\b", txt.lower())
    raw_volume = vol_m.group(0) if vol_m else ""

    abv_m = re.search(r"(\d{1,2}(?:[.,]\d)?)\s*%", txt)
    raw_abv = abv_m.group(0) if abv_m else ""

    return {
        "name_part": name_part,
        "raw_volume": raw_volume,
        "raw_abv": raw_abv,
        "raw_full": txt,  # debug
    }
