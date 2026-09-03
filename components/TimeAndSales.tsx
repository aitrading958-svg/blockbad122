'use client';

import { formatPrice } from '@/lib/orderflow-engine';
import { TradeTick, TradingSymbol } from '@/types/trading';
import { Filter, Flame, ListOrdered } from 'lucide-react';
import React, { useState } from 'react';

interface TimeAndSalesProps {
  symbol: TradingSymbol;
  trades: TradeTick[];
}

export const TimeAndSales: React.FC<TimeAndSalesProps> = ({ symbol, trades }) => {
  const [whaleOnly, setWhaleOnly] = useState(false);

  const filteredTrades = whaleOnly ? trades.filter((t) => t.isWhale) : trades;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      {/* Header & Filter */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold">
          <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
          <span>TIME & SALES</span>
          <span className="text-[10px] px-1 bg-slate-800 text-slate-400 rounded">LIVE</span>
        </div>

        {/* Whale filter button */}
        <button
          id="btn-toggle-whale"
          onClick={() => setWhaleOnly(!whaleOnly)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
            whaleOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Flame className={`w-3 h-3 ${whaleOnly ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
          <span>WHALES</span>
        </button>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-3 px-3 py-1 bg-slate-950 text-[10px] font-mono text-slate-400 border-b border-slate-900">
        <span>TIME</span>
        <span className="text-center">PRICE</span>
        <span className="text-right">SIZE</span>
      </div>

      {/* Trade Rows */}
      <div className="flex-1 overflow-y-auto p-1 font-mono text-xs space-y-[1px]">
        {filteredTrades.slice(0, 40).map((t) => {
          const timeStr = new Date(t.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const isBuy = t.side === 'BUY';

          return (
            <div
              key={t.id}
              className={`grid grid-cols-3 px-2 py-1 rounded transition-all items-center ${
                t.isWhale
                  ? isBuy
                    ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                  : 'hover:bg-slate-900/50'
              }`}
            >
              {/* Time */}
              <span className="text-slate-400 text-[10px]">{timeStr}</span>

              {/* Price */}
              <span
                className={`text-center font-semibold ${
                  isBuy ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatPrice(t.price, symbol)}
              </span>

              {/* Size & Whale indicator */}
              <div className="flex items-center justify-end gap-1">
                {t.isWhale && (
                  <span className="text-[9px] px-1 bg-amber-500 text-slate-950 font-bold rounded">
                    WHALE
                  </span>
                )}
                <span
                  className={`font-semibold ${
                    isBuy ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {t.size.toFixed(t.size >= 100 ? 0 : 2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
