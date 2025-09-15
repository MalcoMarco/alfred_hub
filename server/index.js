// server/index.js
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" }); // lee AIPRISE_KEY, PORT, etc.

import express from "express";
import cors from "cors";
import aipriseRoutes from "./aiprise.routes.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://alfred.com.do", "https://www.alfred.com.do"],
    credentials: true,
  })
);

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

// En local exponemos en raíz (POST http://localhost:8080/aiprise/session)
app.use("/", aipriseRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("API running on :" + PORT));
