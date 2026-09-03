'use client';

import { formatPrice, getTickSize } from '@/lib/orderflow-engine';
import { DOMSnapshot, TradingSymbol } from '@/types/trading';
import { ArrowDownRight, ArrowUpRight, Calculator, Shield, Target, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface DOMLadderProps {
  symbol: TradingSymbol;
  dom: DOMSnapshot | null;
  currentPrice: number;
  onSetExecutionLevels?: (entry: number, tp1: number, tp2: number, sl: number) => void;
}

export const DOMLadder: React.FC<DOMLadderProps> = ({
  symbol,
  dom,
  currentPrice,
  onSetExecutionLevels,
}) => {
  const [positionSize, setPositionSize] = useState<number>(1.0);
  const [simulatedEntry, setSimulatedEntry] = useState<number>(currentPrice);
  const [activeSide, setActiveSide] = useState<'LONG' | 'SHORT'>('LONG');

  const tickSize = getTickSize(symbol);
  const asks = dom?.asks.slice(0, 10).reverse() || [];
  const bids = dom?.bids.slice(0, 10) || [];

  const maxAskQty = Math.max(1, ...asks.map((a) => a[1]));
  const maxBidQty = Math.max(1, ...bids.map((b) => b[1]));
  const maxQty = Math.max(maxAskQty, maxBidQty);

  const totalBid = dom?.totalBidLiquidity || 1;
  const totalAsk = dom?.totalAskLiquidity || 1;
  const bidRatio = Math.round((totalBid / (totalBid + totalAsk)) * 100);
  const askRatio = 100 - bidRatio;

  // Calculation for quick scalp target simulation
  const calcTP1 = activeSide === 'LONG' ? simulatedEntry + tickSize * 15 : simulatedEntry - tickSize * 15;
  const calcTP2 = activeSide === 'LONG' ? simulatedEntry + tickSize * 30 : simulatedEntry - tickSize * 30;
  const calcSL = activeSide === 'LONG' ? simulatedEntry - tickSize * 10 : simulatedEntry + tickSize * 10;

  const pnlTP1 = Math.abs(calcTP1 - simulatedEntry) * positionSize;
  const pnlSL = Math.abs(simulatedEntry - calcSL) * positionSize;
  const rrRatio = Number((pnlTP1 / (pnlSL || 1)).toFixed(2));

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      {/* DOM Header & Imbalance Meter */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>DOM / DEPTH LADDER</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Spread: <span className="text-slate-200 font-semibold">{formatPrice(dom?.spread || tickSize, symbol)}</span>
          </span>
        </div>

        {/* Bid/Ask Imbalance Ratio Meter */}
        <div className="w-full bg-slate-950 rounded-full h-2 flex overflow-hidden border border-slate-800">
          <div
            className="bg-emerald-500 transition-all duration-200"
            style={{ width: `${bidRatio}%` }}
            title={`Bid Liquidity: ${bidRatio}%`}
          />
          <div
            className="bg-rose-500 transition-all duration-200"
            style={{ width: `${askRatio}%` }}
            title={`Ask Liquidity: ${askRatio}%`}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
          <span className="text-emerald-400 font-semibold">BID {bidRatio}% ({totalBid.toFixed(1)})</span>
          <span className="text-rose-400 font-semibold">{askRatio}% ({totalAsk.toFixed(1)}) ASK</span>
        </div>
      </div>

      {/* DOM Price Ladder Rows */}
      <div className="flex-1 overflow-y-auto p-1 font-mono text-xs space-y-[1px]">
        {/* Ask Levels (Sell Limit Orders) */}
        {asks.map(([price, qty], idx) => {
          const widthPct = Math.min(100, (qty / maxQty) * 100);
          const isRefill = dom?.refillsDetected.some((r) => r.price === price && r.side === 'ASK');

          return (
            <div
              key={`ask-${price}-${idx}`}
              onClick={() => setSimulatedEntry(price)}
              className="relative flex items-center justify-between px-2 py-0.5 rounded cursor-pointer hover:bg-rose-950/40 text-slate-300 transition-all group"
            >
              <div
                className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded-r pointer-events-none transition-all"
                style={{ width: `${widthPct}%` }}
              />
              <span className="text-rose-400 font-semibold z-10">{formatPrice(price, symbol)}</span>
              <div className="flex items-center gap-1 z-10">
                {isRefill && (
                  <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold animate-pulse">
                    REFILL
                  </span>
                )}
                <span className="text-slate-400 group-hover:text-slate-100">{qty.toFixed(2)}</span>
              </div>
            </div>
          );
        })}

        {/* Current Mid Spread Divider */}
        <div className="flex items-center justify-between px-2 py-1 bg-cyan-950/40 border-y border-cyan-500/40 text-cyan-300 font-bold my-1">
          <span className="text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            MID PRICE
          </span>
          <span>{formatPrice(currentPrice, symbol)}</span>
        </div>

        {/* Bid Levels (Buy Limit Orders) */}
        {bids.map(([price, qty], idx) => {
          const widthPct = Math.min(100, (qty / maxQty) * 100);
          const isRefill = dom?.refillsDetected.some((r) => r.price === price && r.side === 'BID');

          return (
            <div
              key={`bid-${price}-${idx}`}
              onClick={() => setSimulatedEntry(price)}
              className="relative flex items-center justify-between px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-950/40 text-slate-300 transition-all group"
            >
              <div
                className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded-r pointer-events-none transition-all"
                style={{ width: `${widthPct}%` }}
              />
              <span className="text-emerald-400 font-semibold z-10">{formatPrice(price, symbol)}</span>
              <div className="flex items-center gap-1 z-10">
                {isRefill && (
                  <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold animate-pulse">
                    REFILL
                  </span>
                )}
                <span className="text-slate-400 group-hover:text-slate-100">{qty.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scalp Execution Simulator & Risk/Reward Box */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>SCALP EXECUTION PLANNER</span>
          </span>
          {/* Long/Short toggle */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
            <button
              id="btn-dom-long"
              onClick={() => setActiveSide('LONG')}
              className={`px-2 py-0.5 rounded ${
                activeSide === 'LONG' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'
              }`}
            >
              LONG
            </button>
            <button
              id="btn-dom-short"
              onClick={() => setActiveSide('SHORT')}
              className={`px-2 py-0.5 rounded ${
                activeSide === 'SHORT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'
              }`}
            >
              SHORT
            </button>
          </div>
        </div>

        {/* Auto Targets Display */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-2">
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
            <div className="text-slate-400 flex items-center gap-0.5">
              <Target className="w-3 h-3 text-emerald-400" /> TP 1
            </div>
            <div className="text-emerald-300 font-bold">{formatPrice(calcTP1, symbol)}</div>
          </div>
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
            <div className="text-slate-400 flex items-center gap-0.5">
              <Target className="w-3 h-3 text-cyan-400" /> TP 2
            </div>
            <div className="text-cyan-300 font-bold">{formatPrice(calcTP2, symbol)}</div>
          </div>
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
            <div className="text-slate-400 flex items-center gap-0.5">
              <Shield className="w-3 h-3 text-rose-400" /> SL
            </div>
            <div className="text-rose-300 font-bold">{formatPrice(calcSL, symbol)}</div>
          </div>
        </div>

        {/* R:R Ratio and PnL */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
          <span className="text-slate-400">
            Risk:Reward: <span className="text-amber-300 font-bold">{rrRatio}:1</span>
          </span>
          <button
            id="btn-apply-execution"
            onClick={() => onSetExecutionLevels?.(simulatedEntry, calcTP1, calcTP2, calcSL)}
            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] rounded"
          >
            SET LEVELS
          </button>
        </div>
      </div>
    </div>
  );
};
