// src/services/settings.ts
export type OrgSettings = {
  orgName: string;
  timezone: string;
  updatedAt?: string;
};

const LS_KEY = "alfredpay:org-settings";

async function apiGet(): Promise<OrgSettings | null> {
  try {
    const r = await fetch("/api/settings", { credentials: "include" });
    if (!r.ok) return null;
    return (await r.json()) as OrgSettings;
  } catch {
    return null;
  }
}

async function apiUpdate(payload: OrgSettings): Promise<boolean> {
  try {
    const r = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function getSettings(): Promise<OrgSettings> {
  const api = await apiGet();
  if (api) return api;

  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw) as OrgSettings;

  const def: OrgSettings = {
    orgName: "AlfredPay®",
    timezone: "America/Santo_Domingo",
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LS_KEY, JSON.stringify(def));
  return def;
}

export async function saveSettings(next: OrgSettings): Promise<OrgSettings> {
  const payload: OrgSettings = { ...next, updatedAt: new Date().toISOString() };
  const ok = await apiUpdate(payload);
  if (!ok) localStorage.setItem(LS_KEY, JSON.stringify(payload));
  return payload;
}

export const TIMEZONES: string[] = [
  "America/Santo_Domingo",
  "America/Mexico_City",
  "America/Bogota",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];
