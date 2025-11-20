import express from "express";
import { BiedronkaScraper } from "../scrapers/Biedronka";

const router = express.Router();

router.get("/biedronka", async (req, res) => {
  const scraper = new BiedronkaScraper();

  try {
    const data = await scraper.scrape();
    return res
      .status(200)
      .json({ message: "Biedronka scrape successful.", vodkas: data });
  } catch (err) {
    console.error("Error scraping Biedronka:", err);
    return res.status(500).json({ message: "Internal Server Error." });
  }
});

export default router;
