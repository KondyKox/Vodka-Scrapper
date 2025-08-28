import pandas as pd


def save_to_csv(data, filename="data/vodkas.csv"):
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False, encoding="utf-8-sig")
