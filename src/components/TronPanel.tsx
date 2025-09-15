import React, { useEffect, useMemo, useState } from "react";
import TronFeed from "./TronFeed";

type Wallet = { label: string; address: string };

const STORAGE_KEY = "tron_wallets";

function loadWallets(): Wallet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // default: tu wallet de demo
  return [{ label: "Ops Wallet", address: "TRyprAnbh8PAdhmZLiP7nEjhdR2KUJnNzc" }];
}

function saveWallets(ws: Wallet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
}

export default function TronPanel({ defaultAddress }: { defaultAddress?: string }) {
  const [wallets, setWallets] = useState<Wallet[]>(loadWallets());
  const [selected, setSelected] = useState<string>(defaultAddress || wallets[0]?.address || "");
  const [label, setLabel] = useState("");
  const [addr, setAddr] = useState("");

  useEffect(() => saveWallets(wallets), [wallets]);

  const selectedWallet = useMemo(
    () => wallets.find(w => w.address === selected),
    [wallets, selected]
  );

  const addWallet = () => {
    const a = addr.trim();
    if (!/^T[a-zA-Z0-9]{33,}$/.test(a)) {
      alert("Dirección TRON inválida");
      return;
    }
    const w: Wallet = { label: label.trim() || a.slice(0, 10) + "…", address: a };
    setWallets(prev => (prev.some(x => x.address === w.address) ? prev : [w, ...prev]));
    setLabel(""); setAddr(""); setSelected(a);
  };

  const removeWallet = (a: string) => {
    setWallets(prev => prev.filter(x => x.address !== a));
    if (selected === a && wallets.length > 1) setSelected(wallets.find(x => x.address !== a)!.address);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm"
        >
          {wallets.map(w => (
            <option key={w.address} value={w.address}>{w.label} — {w.address.slice(0,6)}…</option>
          ))}
        </select>

        {selectedWallet && (
          <button
            onClick={() => removeWallet(selectedWallet.address)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Quitar
          </button>
        )}

        <span className="mx-2 text-gray-400">|</span>

        <input
          value={label} onChange={e => setLabel(e.target.value)}
          placeholder="Etiqueta (opcional)" className="rounded-lg border px-2 py-1.5 text-sm"
        />
        <input
          value={addr} onChange={e => setAddr(e.target.value)}
          placeholder="Dirección TRON (T...)" className="rounded-lg border px-2 py-1.5 text-sm w-[320px]"
        />
        <button onClick={addWallet} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          Añadir wallet
        </button>
      </div>

      {/* Feed de la wallet seleccionada */}
      {selected && (
        <div className="rounded-xl border p-3">
          <div className="text-xs text-gray-500 mb-2">
            Mostrando: <b>{selectedWallet?.label || selected}</b> — {selected}
          </div>
          <TronFeed address={selected} />
        </div>
      )}
    </div>
  );
}
