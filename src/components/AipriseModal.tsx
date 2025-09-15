import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  iframeUrl?: string;
  title?: string;
};

const AipriseModal: React.FC<Props> = ({ open, onClose, iframeUrl, title = "Onboarding" }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[999] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[95vw] max-w-5xl h-[85vh] rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Cerrar</button>
        </div>

        {iframeUrl ? (
          <iframe
            title="AiPrise Onboarding"
            src={iframeUrl}
            className="w-full h-[calc(85vh-52px)]"
            // permisos habituales para verificación (ajústalos si el widget pide más/menos)
            allow="camera; microphone; clipboard-read; clipboard-write; geolocation; fullscreen"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div className="p-6 text-sm text-gray-500">Cargando…</div>
        )}
      </div>
    </div>
  );
};

export default AipriseModal;
