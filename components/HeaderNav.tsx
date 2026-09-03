'use client';

import { FeedHealth, Timeframe, TradingSymbol } from '@/types/trading';
import {
  Activity,
  Bell,
  BellOff,
  Clock,
  Radio,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface HeaderNavProps {
  symbol: TradingSymbol;
  setSymbol: (s: TradingSymbol) => void;
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
  feedHealth: FeedHealth;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onTriggerManualSignal: () => void;
  next5mCountdown: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  feedHealth,
  soundEnabled,
  setSoundEnabled,
  onTriggerManualSignal,
  next5mCountdown,
}) => {
  const symbols: { id: TradingSymbol; label: string; tag: string; isCrypto: boolean }[] = [
    { id: 'XAUTUSDT', label: 'XAUT/USDT', tag: 'Tether Gold Crypto', isCrypto: true },
  ];

  const timeframes: { id: Timeframe; label: string; role: string }[] = [
    { id: '1m', label: 'M1', role: 'Primary Scalp' },
    { id: '5m', label: 'M5', role: 'Structure' },
    { id: '15m', label: 'M15', role: 'Auto-Signal' },
    { id: '1h', label: 'H1', role: 'Macro Bias' },
  ];

  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Brand & Symbol Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
              KLUSTRA <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">ORDER FLOW</span>
            </div>
            <div className="text-[10px] text-slate-400 tracking-tight">MMXM / IPDA Scalp Engine</div>
          </div>
        </div>

        {/* Symbols Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 gap-1">
          {symbols.map((item) => {
            const isActive = symbol === item.id;
            return (
              <button
                key={item.id}
                id={`btn-symbol-${item.id}`}
                onClick={() => setSymbol(item.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Timeframe Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 gap-1">
          {timeframes.map((tf) => {
            const isActive = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                id={`btn-tf-${tf.id}`}
                onClick={() => setTimeframe(tf.id)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={tf.role}
              >
                <span>{tf.label}</span>
                {tf.id === '1m' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right side: 15-Min Auto Signal Timer, Live Health, Sound toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 5-Minute Auto Signal Countdown */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 text-[11px]">5M AUTO: </span>
            <span className="text-amber-300 font-semibold">{next5mCountdown}</span>
          </div>
        </div>

        {/* Feed Health Status Pill */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                feedHealth.status === 'LIVE' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                feedHealth.status === 'LIVE' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span
            className={`font-semibold text-[11px] ${
              feedHealth.status === 'LIVE' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {feedHealth.status}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 text-[11px]">{feedHealth.latencyMs}ms</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 text-[11px]">{feedHealth.ticksPerSecond} tps</span>
        </div>

        {/* Audio Alerts Toggle */}
        <button
          id="btn-toggle-audio"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-lg border transition-all ${
            soundEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={soundEnabled ? 'Audio alerts active' : 'Audio alerts muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>

        {/* Force AI Scalp Recalculation */}
        <button
          id="btn-recalculate-scalp"
          onClick={onTriggerManualSignal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>EVALUATE 7-Q</span>
        </button>
      </div>
    </header>
  );
};
