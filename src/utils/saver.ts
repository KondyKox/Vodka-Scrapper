import path from "path";
import { Vodka } from "../types/VodkaProps";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "vodkas.json");

export const saveVodkas = (data: Vodka[]) => {
  if (!data || data.length === 0) {
    console.warn("No data to save.");
    return;
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  console.log("Vodkas saved!");
};

export const loadVodkas = () => {
  if (!fs.existsSync(FILE_PATH)) {
    console.warn("No vodkas found.");
    return [];
  }

  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  return JSON.parse(raw);
};
