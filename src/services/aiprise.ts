export type AipriseSession = {
  iframeUrl: string;
  expiresAt?: string;
};

// Base del backend (sin barra final)
export const API_BASE = (import.meta.env.VITE_BACKEND_URL ?? "").replace(/\/+$/, "");

// Helper para componer URLs absolutas al backend
export const api = (path: string) =>
  `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

export async function createAipriseSession(
  kind: "KYC" | "KYB",
  externalId?: string
): Promise<AipriseSession> {
  const r = await fetch(api("/aiprise/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, externalId }),
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => "");
    throw new Error("No se pudo iniciar el onboarding" + (msg ? `: ${msg}` : ""));
  }
  return (await r.json()) as AipriseSession;
}
