'use client';

import { formatPrice } from '@/lib/orderflow-engine';
import { TradingSymbol, VolumeProfileData } from '@/types/trading';
import { BarChart3, Compass, Layers } from 'lucide-react';
import React from 'react';

interface VolumeProfileMatrixProps {
  symbol: TradingSymbol;
  volumeProfile: VolumeProfileData;
  currentPrice: number;
}

export const VolumeProfileMatrix: React.FC<VolumeProfileMatrixProps> = ({
  symbol,
  volumeProfile,
  currentPrice,
}) => {
  const maxLevelVol = Math.max(1, ...volumeProfile.levels.map((l) => l.volume));

  // Determine price location relative to Value Area
  let locationStatus = 'INSIDE VALUE AREA';
  let locationColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';

  if (currentPrice > volumeProfile.vah) {
    locationStatus = 'ABOVE VAH (PREMIUM ZONE)';
    locationColor = 'text-rose-400 border-rose-500/40 bg-rose-950/40';
  } else if (currentPrice < volumeProfile.val) {
    locationStatus = 'BELOW VAL (DISCOUNT ZONE)';
    locationColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
  }

  const distToPOC = currentPrice - volumeProfile.poc;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      {/* Header & Location Badge */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 font-mono text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SESSION VOLUME PROFILE</span>
          </div>
          <span className="text-[10px] text-slate-400">VA: 70%</span>
        </div>

        {/* Location Status Card */}
        <div className={`p-2 rounded-lg border flex items-center justify-between text-xs font-mono font-bold ${locationColor}`}>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>{locationStatus}</span>
          </div>
          <span className="text-[11px]">
            {distToPOC >= 0 ? `+${formatPrice(distToPOC, symbol)}` : formatPrice(distToPOC, symbol)} vs POC
          </span>
        </div>
      </div>

      {/* Key Profile Benchmarks */}
      <div className="grid grid-cols-3 gap-1 px-3 py-2 bg-slate-950/90 border-b border-slate-900 text-xs font-mono text-center">
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px]">VAH (70%)</div>
          <div className="text-rose-400 font-bold">{formatPrice(volumeProfile.vah, symbol)}</div>
        </div>
        <div className="bg-amber-950/30 p-1.5 rounded border border-amber-500/30">
          <div className="text-amber-400 text-[10px]">POC (Point of Control)</div>
          <div className="text-amber-300 font-bold">{formatPrice(volumeProfile.poc, symbol)}</div>
        </div>
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px]">VAL (70%)</div>
          <div className="text-emerald-400 font-bold">{formatPrice(volumeProfile.val, symbol)}</div>
        </div>
      </div>

      {/* Volume Profile Histogram Rows */}
      <div className="flex-1 overflow-y-auto p-1 font-mono text-xs space-y-[1px]">
        {volumeProfile.levels.slice(0, 20).map((lvl) => {
          const isCurrent = Math.abs(currentPrice - lvl.price) < (volumeProfile.vah - volumeProfile.val) * 0.05;
          const buyPct = (lvl.buyVolume / (lvl.volume || 1)) * 100;
          const totalWidthPct = Math.min(100, (lvl.volume / maxLevelVol) * 100);

          return (
            <div
              key={lvl.price}
              className={`relative flex items-center justify-between px-2 py-1 rounded text-slate-300 transition-all ${
                lvl.isPOC
                  ? 'bg-amber-500/20 border border-amber-500/50 font-bold text-amber-200'
                  : lvl.isVAH
                  ? 'bg-rose-500/10 border-l-2 border-rose-500'
                  : lvl.isVAL
                  ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                  : 'hover:bg-slate-900/60'
              }`}
            >
              {/* Background Volume Bar (Split by Buy vs Sell) */}
              <div
                className="absolute right-0 top-0 bottom-0 flex opacity-20 pointer-events-none rounded-r overflow-hidden"
                style={{ width: `${totalWidthPct}%` }}
              >
                <div className="bg-emerald-500 h-full" style={{ width: `${buyPct}%` }} />
                <div className="bg-rose-500 h-full" style={{ width: `${100 - buyPct}%` }} />
              </div>

              {/* Price & Tag */}
              <div className="flex items-center gap-1.5 z-10">
                <span
                  className={`font-semibold ${
                    lvl.isPOC
                      ? 'text-amber-300'
                      : lvl.isVAH
                      ? 'text-rose-400'
                      : lvl.isVAL
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {formatPrice(lvl.price, symbol)}
                </span>
                {lvl.isPOC && (
                  <span className="text-[9px] px-1 bg-amber-500 text-slate-950 font-bold rounded">
                    POC
                  </span>
                )}
                {lvl.isHVN && !lvl.isPOC && (
                  <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded">
                    HVN
                  </span>
                )}
                {lvl.isLVN && (
                  <span className="text-[9px] px-1 bg-slate-900 text-slate-400 border border-slate-700 rounded">
                    LVN
                  </span>
                )}
              </div>

              {/* Volume & Delta */}
              <div className="flex items-center gap-2 z-10 text-[11px]">
                <span
                  className={
                    lvl.delta > 0 ? 'text-emerald-400' : lvl.delta < 0 ? 'text-rose-400' : 'text-slate-400'
                  }
                >
                  {lvl.delta > 0 ? `+${lvl.delta.toFixed(0)}` : lvl.delta.toFixed(0)}
                </span>
                <span className="text-slate-400">{lvl.volume.toFixed(0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
