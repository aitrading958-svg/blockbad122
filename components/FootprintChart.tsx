'use client';

import {
  formatPrice,
  getPriceDecimals,
  getTickSize,
} from '@/lib/orderflow-engine';
import {
  Candle,
  FootprintPriceLevel,
  TradingSymbol,
  VolumeProfileData,
} from '@/types/trading';
import {
  ArrowDown,
  ArrowUp,
  Maximize2,
  Minimize2,
  Sliders,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';

interface FootprintChartProps {
  symbol: TradingSymbol;
  timeframe: string;
  candles: Candle[];
  volumeProfile: VolumeProfileData;
  currentPrice: number;
}

export const FootprintChart: React.FC<FootprintChartProps> = ({
  symbol,
  timeframe,
  candles,
  volumeProfile,
  currentPrice,
}) => {
  const [viewMode, setViewMode] = useState<'footprint' | 'candlestick' | 'delta'>('footprint');
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayCandles = useMemo(() => {
    return candles.slice(-Math.floor(18 * zoom));
  }, [candles, zoom]);

  // Calculate overall high & low for Y scale
  const { minPrice, maxPrice } = useMemo(() => {
    if (displayCandles.length === 0) return { minPrice: currentPrice - 10, maxPrice: currentPrice + 10 };
    let min = Infinity;
    let max = -Infinity;
    for (const c of displayCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    // Add padding
    const padding = (max - min) * 0.1 || getTickSize(symbol) * 5;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
    };
  }, [displayCandles, currentPrice, symbol]);

  const priceRange = Math.max(0.0001, maxPrice - minPrice);
  const tickSize = getTickSize(symbol);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-100">{symbol}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
            {timeframe.toUpperCase()} FOOTPRINT
          </span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {formatPrice(currentPrice, symbol)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px] font-mono">
            <button
              id="btn-view-footprint"
              onClick={() => setViewMode('footprint')}
              className={`px-2 py-0.5 rounded ${
                viewMode === 'footprint' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Footprint
            </button>
            <button
              id="btn-view-candlestick"
              onClick={() => setViewMode('candlestick')}
              className={`px-2 py-0.5 rounded ${
                viewMode === 'candlestick' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
            <button
              id="btn-view-delta"
              onClick={() => setViewMode('delta')}
              className={`px-2 py-0.5 rounded ${
                viewMode === 'delta' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Delta
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              id="btn-zoom-in"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-zoom-out"
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas / Interactive Visualization Area */}
      <div ref={containerRef} className="relative flex-1 w-full bg-slate-950 overflow-x-auto overflow-y-hidden p-2">
        {/* Value Area / Volume Profile overlay lines */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* VAH Line */}
          {volumeProfile.vah >= minPrice && volumeProfile.vah <= maxPrice && (
            <div
              className="absolute w-full border-t border-dashed border-rose-500/60 flex items-center justify-end pr-2 text-[10px] font-mono text-rose-400"
              style={{
                top: `${((maxPrice - volumeProfile.vah) / priceRange) * 100}%`,
              }}
            >
              <span className="bg-slate-950/80 px-1 rounded border border-rose-500/40">
                VAH: {formatPrice(volumeProfile.vah, symbol)}
              </span>
            </div>
          )}

          {/* POC Line */}
          {volumeProfile.poc >= minPrice && volumeProfile.poc <= maxPrice && (
            <div
              className="absolute w-full border-t-2 border-amber-400/80 flex items-center justify-end pr-2 text-[10px] font-mono text-amber-300 font-bold"
              style={{
                top: `${((maxPrice - volumeProfile.poc) / priceRange) * 100}%`,
              }}
            >
              <span className="bg-slate-950/90 px-1 rounded border border-amber-400/50">
                POC: {formatPrice(volumeProfile.poc, symbol)}
              </span>
            </div>
          )}

          {/* VAL Line */}
          {volumeProfile.val >= minPrice && volumeProfile.val <= maxPrice && (
            <div
              className="absolute w-full border-t border-dashed border-emerald-500/60 flex items-center justify-end pr-2 text-[10px] font-mono text-emerald-400"
              style={{
                top: `${((maxPrice - volumeProfile.val) / priceRange) * 100}%`,
              }}
            >
              <span className="bg-slate-950/80 px-1 rounded border border-emerald-500/40">
                VAL: {formatPrice(volumeProfile.val, symbol)}
              </span>
            </div>
          )}

          {/* Live Price Horizontal Line */}
          {currentPrice >= minPrice && currentPrice <= maxPrice && (
            <div
              className="absolute w-full border-t border-cyan-400 flex items-center justify-between px-2 text-[10px] font-mono text-cyan-300 font-bold z-20"
              style={{
                top: `${((maxPrice - currentPrice) / priceRange) * 100}%`,
              }}
            >
              <span className="bg-cyan-950/90 px-1 rounded text-cyan-300 animate-pulse">LIVE</span>
              <span className="bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-400 text-cyan-200">
                {formatPrice(currentPrice, symbol)}
              </span>
            </div>
          )}
        </div>

        {/* Candles Container */}
        <div className="flex items-stretch justify-end h-full gap-2 min-w-full pb-6">
          {displayCandles.map((c, idx) => {
            const isBullish = c.close >= c.open;
            const topPct = ((maxPrice - c.high) / priceRange) * 100;
            const bottomPct = ((c.low - minPrice) / priceRange) * 100;
            const bodyTopPct = ((maxPrice - Math.max(c.open, c.close)) / priceRange) * 100;
            const bodyHeightPct = Math.max(1.5, ((Math.abs(c.close - c.open)) / priceRange) * 100);

            const footprintEntries = c.footprint instanceof Map
              ? Array.from(c.footprint.values())
              : Object.values(c.footprint || {});

            const sortedFootprint = footprintEntries.sort((a, b) => b.price - a.price);

            const timeStr = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={c.time || idx} className="relative flex flex-col items-center justify-end min-w-[76px] flex-1 max-w-[120px] h-full">
                {/* Candlestick & Footprint Layer */}
                <div className="relative w-full h-[88%] flex flex-col justify-end">
                  {/* Candlestick Mode */}
                  {viewMode === 'candlestick' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Wick */}
                      <div
                        className={`absolute w-0.5 ${isBullish ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{
                          top: `${topPct}%`,
                          bottom: `${bottomPct}%`,
                        }}
                      />
                      {/* Body */}
                      <div
                        className={`absolute w-4 rounded-sm border ${
                          isBullish
                            ? 'bg-emerald-500/30 border-emerald-400'
                            : 'bg-rose-500/30 border-rose-400'
                        }`}
                        style={{
                          top: `${bodyTopPct}%`,
                          height: `${bodyHeightPct}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Footprint Cluster Mode */}
                  {viewMode === 'footprint' && (
                    <div className="absolute inset-0 flex flex-col justify-between overflow-hidden py-1">
                      {/* Candle Wick line in background */}
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 w-0.5 opacity-30 ${
                          isBullish ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{
                          top: `${topPct}%`,
                          bottom: `${bottomPct}%`,
                        }}
                      />

                      {/* Cluster Rows */}
                      <div className="relative flex flex-col w-full gap-[1px] justify-center h-full z-10">
                        {sortedFootprint.slice(0, 14).map((lvl) => {
                          const isBuyImbalance = lvl.isDiagonalBuyImbalance;
                          const isSellImbalance = lvl.isDiagonalSellImbalance;
                          const isPOC = lvl.isPOCLevel;

                          return (
                            <div
                              key={lvl.price}
                              className={`flex items-center justify-between px-1 py-0.5 text-[9px] font-mono rounded ${
                                isPOC
                                  ? 'bg-amber-500/20 border border-amber-500/40 font-bold text-amber-200'
                                  : 'bg-slate-900/60 border border-slate-800/40 text-slate-300'
                              }`}
                            >
                              {/* Bid Volume (Hit Bid = Market Sell) */}
                              <span
                                className={`text-left w-1/2 truncate ${
                                  isSellImbalance
                                    ? 'text-rose-400 font-bold bg-rose-950/60 px-0.5 rounded'
                                    : 'text-slate-400'
                                }`}
                              >
                                {lvl.bidVolume.toFixed(1)}
                              </span>

                              {/* Price Level Divider */}
                              <span className="text-slate-600 px-0.5">×</span>

                              {/* Ask Volume (Hit Ask = Market Buy) */}
                              <span
                                className={`text-right w-1/2 truncate ${
                                  isBuyImbalance
                                    ? 'text-emerald-400 font-bold bg-emerald-950/60 px-0.5 rounded'
                                    : 'text-slate-300'
                                }`}
                              >
                                {lvl.askVolume.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delta Bar Mode */}
                  {viewMode === 'delta' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div
                        className={`w-6 rounded text-center text-[10px] font-mono font-bold flex items-center justify-center ${
                          c.delta >= 0
                            ? 'bg-emerald-500/40 border border-emerald-400 text-emerald-300'
                            : 'bg-rose-500/40 border border-rose-400 text-rose-300'
                        }`}
                        style={{
                          height: `${Math.min(90, Math.max(15, Math.abs(c.delta) * 1.5))}%`,
                        }}
                      >
                        {c.delta > 0 ? `+${c.delta.toFixed(0)}` : c.delta.toFixed(0)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Candle Delta & Time Footer */}
                <div className="w-full flex flex-col items-center pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                  <span
                    className={`font-semibold ${
                      c.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    Δ {c.delta >= 0 ? `+${c.delta.toFixed(0)}` : c.delta.toFixed(0)}
                  </span>
                  <span className="text-slate-400 text-[9px]">{timeStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
