import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

import AlfredLogo from "./assets/alfred-logo.png";
import { CountryManuals } from "./entidades";
import TronFeed from "./components/TronFeed";
import SettingsPage from "./components/SettingsPage";
import EvidenceVault from "./components/EvidenceVault";
import AipriseModal from "./components/AipriseModal";
import LoginScreen from "./components/LoginScreen";
import UsersRolesPage from "./components/UsersRolesPage";
import EtherscanPage from "./components/EtherscanPage";
import WalletsPage from "./components/WalletsPage";

// ✅ Importes RELATIVOS (sin alias @)
import { createAipriseSession, api } from "./services/aiprise";
import { authService } from "./services/auth";

/* ========================================
 * Tipos
 * ====================================== */
type ModuleKey =
  | "overview"
  | "kyc"
  | "manuals"
  | "evidences"
  | "integrations"
  | "users"
  | "audit"
  | "settings"
  | "etherscan"
  | "wallets";

type CaseItem = {
  id: string;
  kind: "KYC" | "KYB";
  status: string | null;
  risk: string | null;
  createdAt: string;
  updatedAt?: string;
  reportUrl?: string;
  externalId?: string | null;
};

const modules: Record<ModuleKey, string> = {
  overview: "Overview",
  kyc: "KYC/KYB",
  manuals: "Manuales & Políticas",
  evidences: "Evidencias (Vault)",
  integrations: "Integraciones",
  users: "Usuarios & Roles",
  audit: "Audit Log",
  settings: "Settings",
  etherscan: "Etherscan",
  wallets: "Wallets",
};

const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/* ========================================
 * UI helpers
 * ====================================== */
const Card: React.FC<
  React.PropsWithChildren<{ className?: string; title?: string; right?: React.ReactNode }>
> = ({ className, title, right, children }) => (
  <div className={cx("rounded-2xl border border-gray-200 bg-white p-4 md:p-5", className)}>
    {(title || right) && (
      <div className="mb-3 flex items-center justify-between">
        {title ? <h3 className="font-semibold text-gray-900">{title}</h3> : <div />}
        {right ?? null}
      </div>
    )}
    {children}
  </div>
);

const TileLink: React.FC<{
  href: string;
  title: string;
  tag?: string;
  sub?: string;
}> = ({ href, title, tag, sub }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="block rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {tag && (
      <div className="mb-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-gray-700">
        {tag}
      </div>
    )}
    <div className="font-medium">{title}</div>
    {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
  </a>
);

/** Icons */
const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
const Check = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/* ========================================
 * Login se ha movido a components/LoginScreen.tsx
 * ====================================== */

/* ========================================
 * Overview
 * ====================================== */
const Overview: React.FC = () => {
  const metrics = useMemo(
    () => [
      { label: "Casos KYC activos", value: 18 },
      { label: "KYB en revisión", value: 7 },
      { label: "Alertas KYT", value: 5 },
      { label: "Requerimientos regulatorios", value: 3 },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="text-center">
            <div className="text-3xl font-bold text-gray-900">{m.value}</div>
            <div className="mt-1 text-sm text-gray-500">{m.label}</div>
          </Card>
        ))}
      </div>

      <Card title="Acciones rápidas">
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Nuevo caso KYB", sub: "Crear solicitud de verificación" },
            { label: "Generar Reporte KYC", sub: "PDF institucional" },
            { label: "Abrir mesa de ayuda", sub: "Ticket de requerimiento" },
            { label: "Descargar política AML", sub: "Última versión" },
          ].map((a) => (
            <button key={a.label} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-left shadow-sm hover:bg-gray-50">
              <div className="font-medium">{a.label}</div>
              <div className="text-xs text-gray-500">{a.sub}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Accesos rápidos" right={<input className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" placeholder="Filtrar..." />}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { tag: "KYC/KYB", title: "AiPrise – KYB/KYC Cases", sub: "Verificaciones de identidad, empresas y flujo de casos." },
            { tag: "Docs", title: "Repositorio – Políticas & Manuales", sub: "AML/CFT, PEPs, KYB, ISO 37301, 27001, 22301, etc." },
            { tag: "KYT", title: "KYT / Monitoreo de Wallets", sub: "Monitoreo transaccional, señales y reportes." },
            { tag: "Ops", title: "Helpdesk – Evidencias & Requerimientos", sub: "Flujo de evidencias, regulatorios y auditorías." },
          ].map((b) => (
            <div key={b.title} className="rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
              <div className="mb-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-gray-700">{b.tag}</div>
              <div className="font-semibold">{b.title}</div>
              <div className="mt-1 text-sm text-gray-600">{b.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Actividad reciente">
          <ul className="space-y-3">
            {[
              { t: "Caso KYB – Tesser Payments", ago: "hace 2 h" },
              { t: "Alerta KYT – Wallet 0x0e3d5...", ago: "hace 4 h" },
              { t: "Actualizado – Política AML v2025.4", ago: "ayer" },
            ].map((i) => (
              <li key={i.t} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">{i.t}</div>
                  <div className="text-xs text-gray-500">{i.ago}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Evidencias (Vault)">
          <div className="text-sm text-gray-600">Guarda oficios, capturas, extractos, CSV, PDFs y respuestas regulatorias. (Demo: no persistente)</div>
          <div className="mt-3 rounded-lg border border-dashed p-6 text-center text-gray-500">
            Arrastra archivos aquí o haz clic en “Subir evidencia”.
          </div>
        </Card>
      </div>

      <Card title="KYT / Monitoreo de Wallets (TRON)">
        <TronFeed address="TRyprAnbh8PAdhmZLiP7nEjhdR2KUJnNzc" />
      </Card>
    </div>
  );
};

/* ========================================
 * KYC/KYB (AiPrise)
 * ====================================== */
const Badge: React.FC<{ tone: "gray" | "green" | "red" | "yellow"; children: React.ReactNode }> = ({ tone, children }) => {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[tone]}`}>{children}</span>;
};

const KYBPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CaseItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setErr(null);
      // ✅ Corrección: segundo argumento del fetch
      const r = await fetch(api("/cases"), { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as CaseItem[];
      setRows(data);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar la lista");
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  async function start(kind: "KYC" | "KYB") {
    try {
      setLoading(true);
      setOpen(true);
      setIframeUrl(undefined);
      const session = await createAipriseSession(kind, undefined);
      setIframeUrl(session.iframeUrl);
    } catch (e) {
      console.error(e);
      alert("No se pudo iniciar el onboarding");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  // (Opcional) escuchar postMessage del iframe para cerrar al completar
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (typeof ev.data === "object" && ev.data && (ev.data as any).event === "aiprise:completed") {
        setOpen(false);
        fetchCases();
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const toneFor = (status: string | null, risk: string | null): "gray" | "green" | "red" | "yellow" => {
    if (!status) return "gray";
    if (status.toLowerCase().includes("reject")) return "red";
    if (status.toLowerCase().includes("approve")) return risk && risk.toLowerCase() === "high" ? "yellow" : "green";
    if (status.toLowerCase().includes("need")) return "yellow";
    return "gray";
  };

  return (
    <div className="space-y-4">
      <Card
        title="Casos KYB/KYC"
        right={
          <div className="flex gap-2">
            <button onClick={() => start("KYB")} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50" disabled={loading}>
              Nuevo caso KYB
            </button>
            <button onClick={() => start("KYC")} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50" disabled={loading}>
              Nuevo caso KYC
            </button>
            <button onClick={fetchCases} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              Actualizar
            </button>
          </div>
        }
      >
        {/* {err && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{err}</div>} */}

        <div className="overflow-auto rounded-lg border">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Caso</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Riesgo</th>
                <th className="px-3 py-2 text-left">Creado</th>
                <th className="px-3 py-2 text-left">Actualizado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                    Aún no hay casos registrados.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.id}</td>
                    <td className="px-3 py-2">{c.kind}</td>
                    <td className="px-3 py-2">
                      <Badge tone={toneFor(c.status, c.risk)}>{c.status ?? "—"}</Badge>
                    </td>
                    <td className="px-3 py-2">{c.risk ?? "—"}</td>
                    <td className="px-3 py-2">{new Date(c.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {c.reportUrl ? (
                        <a
                          href={c.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-end gap-1 text-blue-700 hover:underline"
                        >
                          Ver <ArrowRight className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AipriseModal open={open} onClose={() => setOpen(false)} iframeUrl={iframeUrl} title="Onboarding AiPrise" />
    </div>
  );
};

/* ========================================
 * Otros módulos
 * ====================================== */
const ManualsPage: React.FC = () => (
  <div className="space-y-4">
    <Card title="Carpetas por País" right={<span className="text-sm text-gray-500">Accede a las políticas por jurisdicción</span>}>
      <CountryManuals />
    </Card>
  </div>
);

const EvidencesPage: React.FC = () => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Vault de Evidencias</h3>
      </div>
      <EvidenceVault />
    </div>
  </div>
);

const IntegrationsPage: React.FC = () => (
  <div className="space-y-4">
    <Card title="Integraciones">
      <div className="grid gap-3 md:grid-cols-3">
        <TileLink href="https://app.aiprise.com/" title="AiPrise" tag="KYC/KYB" sub="Verificaciones de identidad, empresas y flujo de casos." />
        <TileLink href="https://app.elliptic.co/" title="Elliptic / KYT" tag="KYT" sub="Monitoreo y señales blockchain." />
        <TileLink href="https://www.moneygram.com/" title="MoneyGram" tag="Payouts" sub="Pagos y remesas." />
        <TileLink href="https://www.worldpay.com/" title="WorldPay" tag="Payments" sub="Procesamiento de pagos." />
        <TileLink href="https://www.thunes.com/" title="Thunes" tag="Network" sub="Pagos globales." />
        <TileLink href="https://www.circle.com/" title="Circle" tag="USDC" sub="Infraestructura cripto/fiat." />
      </div>
    </Card>

    <Card title="KYT / Monitoreo de Wallets (TRON)">
      <TronFeed address="TRyprAnbh8PAdhmZLiP7nEjhdR2KUJnNzc" />
    </Card>
  </div>
);

// UsersRolesPage se ha movido a components/UsersRolesPage.tsx

const AuditLogPage: React.FC = () => (
  <div className="space-y-4">
    <Card title="Audit Log">
      <ul className="space-y-2 text-sm">
        {[
          "Usuario MM descargó AML_Policy_v2025.4.pdf",
          "Actualización de rol: Pilar → VP Ops",
          "Login exitoso desde 190.166.x.x",
        ].map((e, i) => (
          <li key={i} className="rounded border p-2">
            {e}
          </li>
        ))}
      </ul>
    </Card>
  </div>
);

/* ========================================
 * Shell
 * ====================================== */
const Shell: React.FC<{ onLogout: () => void; userToken: string }> = ({ onLogout, userToken }) => {
  const [active, setActive] = useState<ModuleKey>("overview");

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={AlfredLogo} alt="alfred" className="h-7 w-auto select-none" draggable={false} />
            <span className="hidden font-medium text-gray-500 sm:inline">Compliance Portal</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            title="Salir"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border bg-white p-2">
          <nav className="space-y-1">
            {(Object.keys(modules) as ModuleKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={cx(
                  "w-full rounded-xl px-3 py-2 text-left",
                  active === key ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"
                )}
                aria-current={active === key ? "page" : undefined}
              >
                {modules[key]}
              </button>
            ))}
          </nav>

          <div className="mt-4 rounded-2xl border bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Rol actual</div>
            <div className="text-sm font-medium">Compliance Officer</div>
            <div className="mt-1 text-xs text-gray-500">Vista previa de permisos (demo).</div>
          </div>
        </aside>

        <main>
          {active === "overview" && <Overview />}
          {active === "kyc" && <KYBPage />}
          {active === "manuals" && <ManualsPage />}
          {active === "evidences" && <EvidencesPage />}
          {active === "integrations" && <IntegrationsPage />}
          {active === "users" && <UsersRolesPage />}
          {active === "audit" && <AuditLogPage />}
          {active === "settings" && <SettingsPage />}
          {active === "etherscan" && <EtherscanPage />}
          {active === "wallets" && <WalletsPage />}
        </main>
      </div>
    </div>
  );
};

/* ========================================
 * MAIN
 * ====================================== */
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Verificar si ya hay un token válido al cargar la app
  useEffect(() => {
    const token = authService.getToken();
    if (token && authService.isAuthenticated()) {
      setUserToken(token);
      setAuthed(true);
    }
  }, []);

  const handleAuth = (token: string) => {
    setUserToken(token);
    setAuthed(true);
  };

  const handleLogout = () => {
    setUserToken(null);
    setAuthed(false);
  };

  return authed && userToken ? (
    <Shell onLogout={handleLogout} userToken={userToken} />
  ) : (
    <LoginScreen onAuth={handleAuth} />
  );
}
