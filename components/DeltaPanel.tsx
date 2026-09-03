'use client';

import { Candle, TradingSymbol } from '@/types/trading';
import { Activity, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';

interface DeltaPanelProps {
  symbol: TradingSymbol;
  candles: Candle[];
}

export const DeltaPanel: React.FC<DeltaPanelProps> = ({ symbol, candles }) => {
  const recentCandles = useMemo(() => candles.slice(-20), [candles]);

  const maxDelta = useMemo(() => {
    return Math.max(1, ...recentCandles.map((c) => Math.abs(c.delta)));
  }, [recentCandles]);

  const latestCandle = recentCandles[recentCandles.length - 1] || { delta: 0, cvd: 0, volume: 1, buyVolume: 0.5 };
  const buyRatio = latestCandle.volume > 0 ? (latestCandle.buyVolume / latestCandle.volume) * 100 : 50;
  const sellRatio = 100 - buyRatio;

  // Detect live CVD divergence
  const divergence = useMemo(() => {
    if (recentCandles.length < 6) return null;
    const current = recentCandles[recentCandles.length - 1];
    const prev = recentCandles[recentCandles.length - 4];

    if (current.low <= prev.low && current.cvd > prev.cvd) {
      return {
        type: 'BULLISH',
        text: 'Bullish Delta Divergence (Price Lower Low, CVD Higher Low - Absorption)',
      };
    }
    if (current.high >= prev.high && current.cvd < prev.cvd) {
      return {
        type: 'BEARISH',
        text: 'Bearish Delta Divergence (Price Higher High, CVD Lower High - Exhaustion)',
      };
    }
    return null;
  }, [recentCandles]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      {/* Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 font-mono text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>CUMULATIVE DELTA & DIVERGENCE</span>
          </div>
          <span className="text-[11px] text-slate-400">
            CVD: <span className={latestCandle.cvd >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {latestCandle.cvd >= 0 ? `+${latestCandle.cvd.toFixed(0)}` : latestCandle.cvd.toFixed(0)}
            </span>
          </span>
        </div>

        {/* Aggression Distribution */}
        <div className="w-full bg-slate-950 rounded-full h-1.5 flex overflow-hidden border border-slate-800 mb-1">
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${buyRatio}%` }} />
          <div className="bg-rose-500 h-full transition-all" style={{ width: `${sellRatio}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span className="text-emerald-400">Buy Agg: {buyRatio.toFixed(0)}%</span>
          <span className="text-rose-400">Sell Agg: {sellRatio.toFixed(0)}%</span>
        </div>

        {/* Divergence Alert Box */}
        {divergence && (
          <div
            className={`mt-2 p-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 font-bold ${
              divergence.type === 'BULLISH'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            <span>{divergence.text}</span>
          </div>
        )}
      </div>

      {/* Delta Bars Visual Stream */}
      <div className="flex-1 flex items-end justify-between p-3 gap-1 overflow-x-auto">
        {recentCandles.map((c, idx) => {
          const heightPct = Math.min(100, Math.max(8, (Math.abs(c.delta) / maxDelta) * 100));
          const isPositive = c.delta >= 0;

          return (
            <div
              key={c.time || idx}
              className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-8 bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-200 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                Δ: {c.delta.toFixed(1)} | CVD: {c.cvd.toFixed(0)}
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isPositive
                    ? 'bg-emerald-500 hover:bg-emerald-400'
                    : 'bg-rose-500 hover:bg-rose-400'
                }`}
                style={{ height: `${heightPct}%` }}
              />

              {/* Time */}
              <span className="text-[8px] font-mono text-slate-500">
                {new Date(c.time).getMinutes()}m
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
