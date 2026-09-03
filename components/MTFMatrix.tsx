'use client';

import { formatPrice } from '@/lib/orderflow-engine';
import { Candle, TradingSymbol } from '@/types/trading';
import { Activity, ArrowDown, ArrowUp, BarChart, Clock, Compass } from 'lucide-react';
import React from 'react';

interface MTFMatrixProps {
  symbol: TradingSymbol;
  candlesM1: Candle[];
  candlesM5: Candle[];
  candlesM15: Candle[];
  candlesH1: Candle[];
  currentPrice: number;
}

export const MTFMatrix: React.FC<MTFMatrixProps> = ({
  symbol,
  candlesM1,
  candlesM5,
  candlesM15,
  candlesH1,
  currentPrice,
}) => {
  const getTFStats = (candles: Candle[], label: string, role: string) => {
    if (candles.length === 0) return { label, role, trend: 'NEUTRAL', change: 0, delta: 0, volume: 0 };
    const latest = candles[candles.length - 1];
    const prev = candles[Math.max(0, candles.length - 2)];
    const change = latest.close - latest.open;
    const isUp = change >= 0;

    return {
      label,
      role,
      trend: isUp ? 'BULLISH' : 'BEARISH',
      change,
      delta: latest.delta || 0,
      volume: latest.volume || 0,
    };
  };

  const m1 = getTFStats(candlesM1, 'M1', 'Scalp Execution');
  const m5 = getTFStats(candlesM5, 'M5', 'Market Structure');
  const m15 = getTFStats(candlesM15, 'M15', 'Auto-Signal Bias');
  const h1 = getTFStats(candlesH1, 'H1', 'Macro Context');

  const tfList = [m1, m5, m15, h1];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full font-mono text-xs select-none">
      {tfList.map((tf) => {
        const isBull = tf.trend === 'BULLISH';
        return (
          <div
            key={tf.label}
            className={`p-2 rounded-xl border transition-all ${
              isBull
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-100">{tf.label}</span>
                <span className="text-[10px] text-slate-400">({tf.role})</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isBull ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {tf.trend}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-0.5">
                {isBull ? (
                  <ArrowUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-rose-400" />
                )}
                {formatPrice(Math.abs(tf.change), symbol)}
              </span>
              <span className={tf.delta >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                Δ {tf.delta >= 0 ? `+${tf.delta.toFixed(0)}` : tf.delta.toFixed(0)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
