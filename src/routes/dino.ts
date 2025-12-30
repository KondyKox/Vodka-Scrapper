import express from "express";
import { DinoScraper } from "../scrapers/Dino";

const router = express.Router();

router.get("/dino", async (req, res) => {
  const scraper = new DinoScraper();

  try {
    const data = await scraper.scrape();
    return res
      .status(200)
      .json({ message: "Dino scrape succesfull.", vodkas: data });
  } catch (err) {
    console.error("Error scraping Dino:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
