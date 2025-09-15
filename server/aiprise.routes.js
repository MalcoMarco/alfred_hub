// server/aiprise.routes.js
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

const AIPRISE_API = process.env.AIPRISE_API || "https://api.aiprise.com";
const AIPRISE_KEY = process.env.AIPRISE_KEY;
const AIPRISE_IFRAME_BASE = process.env.AIPRISE_IFRAME_BASE || "https://widgetwrldmex-dev.alfredpay.io";

// DEMO: memoria
const CASES = [];

// POST /aiprise/session -> { iframeUrl, expiresAt }
router.post("/aiprise/session", async (req, res) => {
  try {
    const { kind, externalId } = req.body || {};
    if (!AIPRISE_KEY) return res.status(500).json({ error: "Falta AIPRISE_KEY en backend" });

    const r = await fetch(`${AIPRISE_API}/v1/onboarding/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AIPRISE_KEY}`,
      },
      body: JSON.stringify({ type: kind, external_id: externalId }),
    });

    if (!r.ok) {
      const msg = await r.text().catch(() => "");
      return res.status(502).json({ error: "aiprise_error", details: msg });
    }

    const data = await r.json(); // { token, session_id, expires_at }
    const iframeUrl = `${AIPRISE_IFRAME_BASE}/start?token=${encodeURIComponent(data.token)}`;

    CASES.unshift({
      id: data.session_id || String(Date.now()),
      kind,
      externalId: externalId || null,
      status: "started",
      risk: null,
      createdAt: new Date().toISOString(),
    });

    res.json({ iframeUrl, expiresAt: data.expires_at });
  } catch (e) {
    res.status(500).json({ error: e?.message || "internal_error" });
  }
});

// POST /aiprise/webhook (demo)
router.post("/aiprise/webhook", (req, res) => {
  const evt = req.body || {};
  const id = evt?.data?.case_id || evt?.data?.session_id;
  const found = CASES.find((c) => c.id === id);
  if (found) {
    found.status = evt?.data?.status || found.status;
    found.risk = evt?.data?.risk || found.risk;
    found.updatedAt = new Date().toISOString();
    if (evt?.data?.report_url) found.reportUrl = evt.data.report_url;
  }
  res.sendStatus(200);
});

// GET /cases (demo)
router.get("/cases", (_req, res) => res.json(CASES));

export default router;
