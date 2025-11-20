import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import biedronkaRoute from "./routes/biedronka";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/scrape", biedronkaRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
