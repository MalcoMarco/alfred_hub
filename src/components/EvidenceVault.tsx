import React, { useEffect, useState } from "react";
import * as evid from "../services/evidences"; // 👈 import flexible (namespace)

// Tipo flexible para no chocar con el tipo real del servicio
type EvidenceRow = {
  id: string;
  name: string;
  size?: number;
  url?: string;
  // cualquier otro campo
  [k: string]: any;
};

const fmt = {
  date: (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—"),
  size: (n?: number) =>
    typeof n === "number" ? `${(n / 1024).toFixed(1)} KB` : "—",
};

const EvidenceVault: React.FC = () => {
  const [items, setItems] = useState<EvidenceRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtiene la función disponible del servicio, con alias tolerantes
  const listFn = (evid as any).listEvidences ?? (evid as any).list ?? (evid as any).getAll;
  const uploadFn =
    (evid as any).uploadEvidence ?? (evid as any).upload ?? (evid as any).create;
  const deleteFn =
    (evid as any).deleteEvidence ??
    (evid as any).removeEvidence ??
    (evid as any).remove ??
    (evid as any).del ??
    (evid as any).delete;

  const refresh = async () => {
    try {
      setError(null);
      const data: EvidenceRow[] = (await listFn?.()) ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el listado de evidencias.");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadFn?.(file);
      await refresh();
    } catch {
      alert("No se pudo subir la evidencia.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta evidencia?")) return;
    setBusy(true);
    try {
      await deleteFn?.(id);
      await refresh();
    } catch {
      alert("No se pudo eliminar la evidencia.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-gray-600">
          Sube PDFs, capturas, CSV, oficios, etc. (Demo: no persistente)
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
            <input type="file" className="hidden" onChange={onFileChange} disabled={busy} />
            Subir evidencia
          </label>
          <button
            onClick={refresh}
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={busy}
          >
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-auto rounded-lg border">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Archivo</th>
              <th className="px-3 py-2 text-left">Tamaño</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                  No hay evidencias cargadas.
                </td>
              </tr>
            ) : (
              items.map((f) => {
                // tolerante a distintas claves: createdAt | created | uploadedAt | date | time
                const created =
                  f.createdAt ?? f.created ?? f.uploadedAt ?? f.date ?? f.time;

                return (
                  <tr key={f.id} className="border-t">
                    <td className="px-3 py-2">
                      {f.url ? (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          {f.name}
                        </a>
                      ) : (
                        f.name
                      )}
                    </td>
                    <td className="px-3 py-2">{fmt.size(f.size)}</td>
                    <td className="px-3 py-2">{fmt.date(created)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onDelete(f.id)}
                        className="text-red-700 hover:underline"
                        disabled={busy}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EvidenceVault;
