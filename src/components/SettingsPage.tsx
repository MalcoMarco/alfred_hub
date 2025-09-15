// src/components/SettingsPage.tsx
import React from "react";
import {
  getSettings,
  saveSettings,
  TIMEZONES,
  type OrgSettings,
} from "../services/settings"; // <- OJO: ../services

const shallowEqual = (a: OrgSettings, b: OrgSettings) =>
  a.orgName === b.orgName && a.timezone === b.timezone;

const SettingsPage: React.FC = () => {
  const [initial, setInitial] = React.useState<OrgSettings | null>(null);
  const [form, setForm] = React.useState<OrgSettings>({
    orgName: "",
    timezone: "America/Santo_Domingo",
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const dirty = initial ? !shallowEqual(initial, form) : false;

  React.useEffect(() => {
    let mounted = true;
    getSettings().then((s: OrgSettings) => {
      if (!mounted) return;
      setInitial(s);
      setForm(s);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const combo =
        (isMac && e.metaKey && e.key === "s") ||
        (!isMac && e.ctrlKey && e.key === "s");
      if (combo) {
        e.preventDefault();
        if (dirty && !saving) void handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, saving, form]);

  async function handleSave() {
    setSaving(true);
    const next = await saveSettings(form);
    setInitial(next);
    setForm(next);
    setSaving(false);
    setNotice("Cambios guardados correctamente.");
    setTimeout(() => setNotice(null), 2500);
  }

  function handleCancel() {
    if (initial) setForm(initial);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {notice}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Settings</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={!dirty || saving}
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="rounded-xl px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#0F2A6B" }}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium">Nombre de la organización</div>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.orgName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev: OrgSettings) => ({
                  ...prev,
                  orgName: e.target.value,
                }))
              }
              placeholder="AlfredPay®"
            />
          </div>

          <div>
            <div className="text-sm font-medium">Zona horaria</div>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.timezone}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setForm((prev: OrgSettings) => ({
                  ...prev,
                  timezone: e.target.value,
                }))
              }
            >
              {TIMEZONES.map((tz: string) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {initial?.updatedAt && (
          <p className="mt-3 text-xs text-gray-500">
            Última actualización:{" "}
            {new Date(initial.updatedAt).toLocaleString()}
          </p>
        )}

        {dirty && !saving && (
          <p className="mt-2 text-xs text-amber-700">
            Tienes cambios sin guardar (atajo <kbd>Ctrl/Cmd + S</kbd>).
          </p>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
