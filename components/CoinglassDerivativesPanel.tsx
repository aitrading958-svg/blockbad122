'use client';

import { DerivativesSnapshot, TradingSymbol } from '@/types/trading';
import { Activity, Droplet, Skull, Waves, Users, AlignLeft, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';

interface CoinglassDerivativesPanelProps {
  symbol: TradingSymbol;
  data: DerivativesSnapshot | null;
}

export const CoinglassDerivativesPanel: React.FC<CoinglassDerivativesPanelProps> = ({ symbol, data }) => {
  if (!data) {
    return (
      <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none p-3 items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-slate-500 font-mono text-xs">
          <Activity className="w-4 h-4" /> Loading Derivatives Data...
        </div>
      </div>
    );
  }

  const { openInterest, oiChange24h, longShortRatioGlobal, longShortRatioTop, whaleVsRetailDelta, liquidations } = data;

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const globalLongPct = (longShortRatioGlobal / (longShortRatioGlobal + 1)) * 100;
  const globalShortPct = 100 - globalLongPct;
  
  const topLongPct = (longShortRatioTop / (longShortRatioTop + 1)) * 100;
  const topShortPct = 100 - topLongPct;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 font-mono text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span>MACRO & DERIVATIVES</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 font-mono text-xs">
        
        {/* Open Interest */}
        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 flex items-center gap-1"><Droplet className="w-3 h-3 text-cyan-400" /> Open Interest (OI)</span>
            <span className={`font-bold ${oiChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {oiChange24h >= 0 ? '+' : ''}{oiChange24h.toFixed(2)}%
            </span>
          </div>
          <div className="text-xl font-bold text-slate-100">{formatCurrency(openInterest)}</div>
        </div>

        {/* Global Long/Short Ratio */}
        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Global L/S Ratio</span>
            <span className="font-bold text-slate-200">{longShortRatioGlobal.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 flex overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${globalLongPct}%` }} />
            <div className="bg-rose-500 h-full transition-all" style={{ width: `${globalShortPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-emerald-400 font-bold">{globalLongPct.toFixed(1)}% Long</span>
            <span className="text-rose-400 font-bold">{globalShortPct.toFixed(1)}% Short</span>
          </div>
        </div>

        {/* Top Trader Long/Short Ratio */}
        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-amber-400" /> Top Trader L/S</span>
            <span className="font-bold text-slate-200">{longShortRatioTop.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 flex overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${topLongPct}%` }} />
            <div className="bg-rose-500 h-full transition-all" style={{ width: `${topShortPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-emerald-400 font-bold">{topLongPct.toFixed(1)}% Long</span>
            <span className="text-rose-400 font-bold">{topShortPct.toFixed(1)}% Short</span>
          </div>
        </div>

        {/* Whale vs Retail Delta */}
        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 flex justify-between items-center">
          <div className="text-slate-400 flex items-center gap-1"><Waves className="w-3 h-3 text-cyan-400" /> Whale vs Retail Delta</div>
          <div className={`font-bold flex items-center gap-1 ${whaleVsRetailDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {whaleVsRetailDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {whaleVsRetailDelta >= 0 ? '+' : ''}{whaleVsRetailDelta.toFixed(1)}
          </div>
        </div>

        {/* Live Liquidations Tape */}
        <div className="flex-1 min-h-[100px] flex flex-col mt-1">
          <div className="text-slate-400 flex items-center gap-1 mb-1.5"><Skull className="w-3 h-3 text-rose-400" /> Live Liquidations</div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {liquidations.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-2">No recent liquidations</div>
            ) : (
              liquidations.map(liq => (
                <div key={liq.id} className={`flex items-center justify-between p-1.5 rounded border text-[10px] ${liq.side === 'LONG' ? 'bg-rose-950/20 border-rose-900/30 text-rose-300' : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300'}`}>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{liq.side === 'LONG' ? 'REKT LONG' : 'REKT SHORT'}</span>
                  </div>
                  <span>{formatCurrency(liq.size)}</span>
                  <span className="font-bold text-slate-200">${liq.price.toFixed(1)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
