import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectMongo } from "./db.js";
import { ensureDefaultUsers } from "./ensureDefaults.js";
import { apiRouter } from "./routes.js";

const port = Number(process.env.PORT) || 4000;

await connectMongo();
await ensureDefaultUsers();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", apiRouter());

app.get("/health", (_req, res) => {
  res.json({ ok: true, db: "mongodb" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port} (MongoDB)`);
});
