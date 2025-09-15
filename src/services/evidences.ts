// Servicio de Evidencias: demo local + soporte presigned URL si tu backend lo expone.
export type EvidenceItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url?: string;           // URL del archivo (local ObjectURL o S3)
};

export type UploadProgress = (pct: number) => void;

const LS_KEY = "alfredpay:evidences";

function readLS(): EvidenceItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as EvidenceItem[]) : [];
  } catch {
    return [];
  }
}
function writeLS(items: EvidenceItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function listEvidences(): EvidenceItem[] {
  return readLS();
}

export function removeEvidence(id: string) {
  const items = readLS().filter((x) => x.id !== id);
  writeLS(items);
}

function xhrUpload(url: string, file: File, onProgress?: UploadProgress, method = "PUT", headers?: Record<string,string>) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (headers) Object.entries(headers).forEach(([k,v]) => xhr.setRequestHeader(k,v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(file);
  });
}

/**
 * Intenta subir a backend:
 *  1) POST /api/evidences/presign  body: {name, type}
 *  2) Respuesta esperada:
 *     - { uploadUrl, method?: "PUT"|"POST", headers?: Record<string,string>, fileUrl }
 *       (fileUrl = URL pública a guardar en la lista)
 * Si falla, cae a modo local (ObjectURL) para demo.
 */
export async function uploadEvidence(file: File, onProgress?: UploadProgress): Promise<EvidenceItem> {
  // 1) Intento con backend (presign)
  try {
    const presign = await fetch("/api/evidences/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    });
    if (presign.ok) {
      const { uploadUrl, method = "PUT", headers, fileUrl } = (await presign.json()) as {
        uploadUrl: string; method?: "PUT" | "POST"; headers?: Record<string,string>; fileUrl: string;
      };
      await xhrUpload(uploadUrl, file, onProgress, method, headers);
      const item: EvidenceItem = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        url: fileUrl,
      };
      const items = [item, ...readLS()];
      writeLS(items);
      return item;
    }
  } catch {
    // cae a modo local
  }

  // 2) Modo demo local (sin backend)
  // Nota: ObjectURL no persiste tras recargar; guardamos metadata y la UI lo sabrá.
  const objectUrl = URL.createObjectURL(file);
  if (onProgress) onProgress(100);
  const item: EvidenceItem = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    url: objectUrl,
  };
  const items = [item, ...readLS()];
  writeLS(items);
  return item;
}
