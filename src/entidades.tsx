import React from "react";

const COUNTRY_FOLDERS = [
  {
    name: "Argentina",
    link: "https://drive.google.com/drive/folders/1420cJ8FCCJ-kFjKYDEjCttLZiqFKtBhN",
    flag: "https://flagcdn.com/ar.svg",
  },
  {
    name: "USA",
    link: "https://drive.google.com/drive/folders/1eDOeszJZYb_xZnfMsD-1hYbTbZbycWNw",
    flag: "https://flagcdn.com/us.svg",
  },
  {
    name: "Brasil",
    link: "https://drive.google.com/drive/folders/1rCGz0M8XtooJZd7JaOJr8_fP6xmQ-EGc",
    flag: "https://flagcdn.com/br.svg",
  },
  {
    name: "Perú",
    link: "https://drive.google.com/drive/folders/1JtUNnMuS16C5Ic3pM08NZeoKMFOh5UZv",
    flag: "https://flagcdn.com/pe.svg",
  },
  {
    name: "República Dominicana",
    link: "https://drive.google.com/drive/folders/1kU-vNgHeMtXHSW1bHhFEH4xyxkyk46my",
    flag: "https://flagcdn.com/do.svg",
  },
  {
    name: "México",
    link: "https://drive.google.com/drive/folders/1V4RX8zeHK2RspFYZ2K4I60zsLr1NeEeh",
    flag: "https://flagcdn.com/mx.svg",
  },
  {
    name: "Colombia",
    link: "https://drive.google.com/drive/folders/1Uh9G0SLOh_VkTS2oV-eEqLbobwaCgyTj",
    flag: "https://flagcdn.com/co.svg",
  },
  {
    name: "Salvador",
    link: "https://drive.google.com/drive/folders/1RQf21IfCjv9bZ4L0hFDsc886zQ0vfopF",
    flag: "https://flagcdn.com/sv.svg",
  },
];

export function CountryManuals() {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="text-lg font-semibold">Carpetas por País</h3>
      <p className="text-sm text-gray-500 mb-3">Accede a los manuales y políticas organizados por jurisdicción</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {COUNTRY_FOLDERS.map((c) => (
          <a
            key={c.name}
            href={c.link}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border p-5 hover:shadow-lg transition  from-white to-gray-100 flex items-center gap-4 group shadow-sm"
            style={{ minHeight: 80 }}
          >
            <img
              src={c.flag}
              alt={`Bandera de ${c.name}`}
              className="w-10 h-10 bg-white object-contain"
              loading="lazy"
            />
            <div className="flex-1">
              <span className="font-semibold text-gray-800 text-base group-hover:text-blue-700 transition-colors">
                {c.name}
              </span>
            </div>
            <span className="text-indigo-600 text-sm font-semibold group-hover:underline">Abrir →</span>
          </a>
        ))}
      </div>
    </div>
  );
}
