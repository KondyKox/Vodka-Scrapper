import csv
import json
import os
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

DEFAULT_FILE = DATA_DIR / "vodkas.json"


# Save data to JSON
def save_to_json(data, filename: Path = DEFAULT_FILE):
    if not data:
        print("⚠️ No data to save.")
        return

    with open(filename, mode="w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"✅ Data saved to: {filename}")


# Load data from JSON
def load_from_json(filename: Path = DEFAULT_FILE):
    if not filename.exists():
        print("⚠️ JSON file does not exist.")
        return []

    with open(filename, mode="r", encoding="utf-8") as f:
        return json.load(f)


# Save data to csv file
def save_to_csv(data, filename="data/vodkas.csv", include_timestamp=True):
    if not data:
        print("⚠️ No data to save.")
        return

    os.makedirs(os.path.dirname(filename), exist_ok=True)

    if include_timestamp:
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"

    # Columns
    fieldnames = [
        "name",
        "flavor",
        "volume",
        "alcoholPercentage",
        "price",
        "store",
        "imageSrc",
    ]

    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"✅ Data saved to: {filename}")
