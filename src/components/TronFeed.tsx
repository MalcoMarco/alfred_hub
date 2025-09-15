// src/components/TronFeed.tsx
import React from 'react';
import { useTronFeed } from '../services/tron';

export default function TronFeed({ address }: { address: string }) {
  const events = useTronFeed(address, 10000);
  return (
    <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">TRON — Activity Feed</h3>
        <span className="text-xs text-gray-500">live</span>
      </div>
      <ul className="space-y-2 max-h-96 overflow-auto">
        {events.map(e => (
          <li key={e.tx_hash} className="text-sm text-gray-700">
            <b className={e.direction==='IN'?'text-emerald-600':e.direction==='OUT'?'text-rose-600':'text-gray-500'}>
              {e.direction}
            </b>
            <span className="ml-1">{e.amount} {e.token || ''}</span>
            <span className="ml-2 text-xs text-gray-500 truncate">{e.from} → {e.to}</span>
            <a className="ml-2 text-xs text-indigo-600 hover:underline" href={e.link} target="_blank" rel="noreferrer">ver</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
