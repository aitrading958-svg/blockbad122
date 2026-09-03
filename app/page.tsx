'use client';

import { CoinglassDerivativesPanel } from '@/components/CoinglassDerivativesPanel';
import { DOMHeatmap } from '@/components/DOMHeatmap';
import { DOMLadder } from '@/components/DOMLadder';
import { DeltaPanel } from '@/components/DeltaPanel';
import { FootprintChart } from '@/components/FootprintChart';
import { HeaderNav } from '@/components/HeaderNav';
import { MTFMatrix } from '@/components/MTFMatrix';
import { SignalEngineCard } from '@/components/SignalEngineCard';
import { TimeAndSales } from '@/components/TimeAndSales';
import { VolumeProfileMatrix } from '@/components/VolumeProfileMatrix';
import { audioAlerts } from '@/lib/audio-alerts';
import {
  LiveMarketFeed,
  fetchHistoricalKlines,
} from '@/lib/market-feeds';
import {
  calculateVolumeProfile,
  evaluateSevenQuestions,
  formatPrice,
  generateScalpingSignal,
  getTickSize,
  quantizePrice,
} from '@/lib/orderflow-engine';
import {
  Candle,
  DOMSnapshot,
  FeedHealth,
  FootprintPriceLevel,
  ScalpingSignal,
  SevenQuestionsEvaluation,
  Timeframe,
  TradeTick,
  TradingSymbol,
  VolumeProfileData,
} from '@/types/trading';
import {
  Activity,
  Layers,
  Radio,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function Home() {
  const [symbol, setSymbol] = useState<TradingSymbol>('XAUTUSDT');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live Market State
  const [trades, setTrades] = useState<TradeTick[]>([]);
  const [dom, setDOM] = useState<DOMSnapshot | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(2865.0);

  // Multi-Timeframe Candles
  const [candlesM1, setCandlesM1] = useState<Candle[]>([]);
  const [candlesM5, setCandlesM5] = useState<Candle[]>([]);
  const [candlesM15, setCandlesM15] = useState<Candle[]>([]);
  const [candlesH1, setCandlesH1] = useState<Candle[]>([]);
  const [derivatives, setDerivatives] = useState<any | null>(null);

  // Feed Health
  const [feedHealth, setFeedHealth] = useState<FeedHealth>({
    status: 'LIVE',
    source: 'Initializing Feed...',
    lastUpdated: 0,
    dataAgeMs: 0,
    latencyMs: 12,
    ticksPerSecond: 0,
    totalTradesReceived: 0,
  });

  // Signal & Reasoning Engine State
  const [currentSignal, setCurrentSignal] = useState<ScalpingSignal | null>(null);
  const [sevenQuestions, setSevenQuestions] = useState<SevenQuestionsEvaluation | null>(null);
  const [signalHistory, setSignalHistory] = useState<ScalpingSignal[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReasoningText, setAiReasoningText] = useState('');
  const [next5mCountdown, setNext5mCountdown] = useState('05:00');

  // References for low-latency live candle updates
  const feedRef = useRef<LiveMarketFeed | null>(null);
  const currentCandleRef = useRef<Candle | null>(null);

  // Dynamic Volume Profile for current session
  const volumeProfile: VolumeProfileData = React.useMemo(() => {
    const tickSize = getTickSize(symbol);
    return calculateVolumeProfile(candlesM1, tickSize);
  }, [candlesM1, symbol]);

  // Handle new incoming trade tick
  const handleTrade = useCallback(
    (trade: TradeTick) => {
      setCurrentPrice(trade.price);
      setTrades((prev) => [trade, ...prev.slice(0, 79)]);

      if (trade.isWhale && soundEnabled) {
        audioAlerts.playAbsorptionAlert();
      }

      // Aggregate into current M1 candle footprint
      const tickSize = getTickSize(symbol);
      const qPrice = quantizePrice(trade.price, tickSize);

      setCandlesM1((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = { ...prev[lastIdx] };

        last.high = Math.max(last.high, trade.price);
        last.low = Math.min(last.low, trade.price);
        last.close = trade.price;
        last.volume += trade.size;
        last.tradeCount += 1;

        if (trade.side === 'BUY') {
          last.buyVolume = (last.buyVolume || 0) + trade.size;
          last.delta += trade.size;
        } else {
          last.sellVolume = (last.sellVolume || 0) + trade.size;
          last.delta -= trade.size;
        }

        // Update footprint map
        const fpMap: Map<number, FootprintPriceLevel> =
          last.footprint instanceof Map
            ? last.footprint
            : new Map<number, FootprintPriceLevel>();
        const existingLvl: FootprintPriceLevel = fpMap.get(qPrice) || {
          price: qPrice,
          bidVolume: 0,
          askVolume: 0,
          totalVolume: 0,
          delta: 0,
          isDiagonalBuyImbalance: false,
          isDiagonalSellImbalance: false,
          isStackedImbalance: false,
          isAbsorption: false,
          isExhaustion: false,
          isPOCLevel: false,
        };

        if (trade.side === 'BUY') {
          existingLvl.askVolume += trade.size;
        } else {
          existingLvl.bidVolume += trade.size;
        }
        existingLvl.totalVolume += trade.size;
        existingLvl.delta = existingLvl.askVolume - existingLvl.bidVolume;
        fpMap.set(qPrice, existingLvl);
        last.footprint = fpMap;

        const updated = [...prev];
        updated[lastIdx] = last;
        currentCandleRef.current = last;
        return updated;
      });
    },
    [symbol, soundEnabled]
  );

  // Initialize Historical Candlesticks on symbol change
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [m1, m5, m15, h1] = await Promise.all([
          fetchHistoricalKlines(symbol, '1m', 35),
          fetchHistoricalKlines(symbol, '5m', 25),
          fetchHistoricalKlines(symbol, '15m', 20),
          fetchHistoricalKlines(symbol, '1h', 15),
        ]);

        if (!isMounted) return;

        setCandlesM1(m1);
        setCandlesM5(m5);
        setCandlesM15(m15);
        setCandlesH1(h1);

        const lastPrice = m1[m1.length - 1]?.close || 64500;
        setCurrentPrice(lastPrice);

        // Calculate initial volume profile and signal
        const tickSize = getTickSize(symbol);
        const vp = calculateVolumeProfile(m1, tickSize);
        const q7 = evaluateSevenQuestions(symbol, m1, m5, m15, h1, vp, null);
        setSevenQuestions(q7);

        const sig = generateScalpingSignal(symbol, '15m', m1, m5, m15, h1, vp, null);
        setCurrentSignal(sig);
        setSignalHistory((prev) => [sig, ...prev.slice(0, 19)]);
      } catch (err) {
        console.error('Failed to load klines:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Real-Time Signal Position Tracking
  useEffect(() => {
    let handle: number;
    queueMicrotask(() => {
      setSignalHistory((prevHistory) => {
        if (prevHistory.length === 0) return prevHistory;

        let historyChanged = false;
        const updatedHistory = prevHistory.map((sig) => {
          if (sig.status === 'STOPPED' || sig.status === 'HIT_TP2' || sig.status === 'EXPIRED') {
            return sig; // terminal state
          }

          let newStatus: ScalpingSignal['status'] = sig.status;
          const entryPrice = sig.currentPrice;

          let newMaxFavorable = sig.maxFavorablePrice;
          if (sig.signal === 'BUY') {
            newMaxFavorable = Math.max(sig.maxFavorablePrice ?? entryPrice, currentPrice);
            if (currentPrice <= sig.stopLoss) newStatus = 'STOPPED';
            else if (currentPrice >= sig.takeProfit2) newStatus = 'HIT_TP2';
            else if (currentPrice >= sig.takeProfit1) newStatus = 'HIT_TP1';
          } else if (sig.signal === 'SELL') {
            newMaxFavorable =
              sig.maxFavorablePrice !== undefined ? Math.min(sig.maxFavorablePrice, currentPrice) : currentPrice;
            if (currentPrice >= sig.stopLoss) newStatus = 'STOPPED';
            else if (currentPrice <= sig.takeProfit2) newStatus = 'HIT_TP2';
            else if (currentPrice <= sig.takeProfit1) newStatus = 'HIT_TP1';
          } else {
            newMaxFavorable = entryPrice;
          }

          const favorablePriceDiff =
            sig.signal === 'BUY'
              ? Math.max(0, (newMaxFavorable ?? entryPrice) - entryPrice)
              : sig.signal === 'SELL'
              ? Math.max(0, entryPrice - (newMaxFavorable ?? entryPrice))
              : 0;

          const floatingPriceDiff =
            sig.signal === 'BUY'
              ? currentPrice - entryPrice
              : sig.signal === 'SELL'
              ? entryPrice - currentPrice
              : 0;

          // Real 100% exact math: Gold $0.01 = 1 Pip | $1.00 = 100 Pips
          // Position size: 0.01 Lot (1 oz Gold) => $1.00 price move = $1.00 USDT profit
          const pips = Number((favorablePriceDiff * 100).toFixed(1));
          const usdtProfit = Number((favorablePriceDiff * 1.0).toFixed(2));
          const floatPips = Number((floatingPriceDiff * 100).toFixed(1));
          const floatUsdt = Number((floatingPriceDiff * 1.0).toFixed(2));

          if (
            newStatus !== sig.status ||
            newMaxFavorable !== sig.maxFavorablePrice ||
            pips !== sig.maxFavorablePips ||
            usdtProfit !== sig.maxFavorableUsdt ||
            floatPips !== sig.floatingPips ||
            floatUsdt !== sig.floatingUsdt
          ) {
            historyChanged = true;
            return {
              ...sig,
              status: newStatus,
              maxFavorablePrice: newMaxFavorable,
              maxFavorablePips: pips,
              maxFavorableUsdt: usdtProfit,
              floatingPips: floatPips,
              floatingUsdt: floatUsdt,
            };
          }
          return sig;
        });

        if (!historyChanged) return prevHistory;

        // Also sync current signal if it matches the first element
        setCurrentSignal((prevSig) => {
          if (prevSig && prevSig.id === updatedHistory[0].id) {
            return updatedHistory[0];
          }
          return prevSig;
        });

        return updatedHistory;
      });
    });
  }, [currentPrice]);

  // Connect Real-Time Live WebSocket Feed
  useEffect(() => {
    feedRef.current?.disconnect();

    feedRef.current = new LiveMarketFeed(symbol, {
      onTrade: handleTrade,
      onDOM: (newDom) => setDOM(newDom),
      onCandleUpdate: (newCandle, tf) => {
        if (tf === '1m') {
          setCandlesM1((prev) => {
            const existingIdx = prev.findIndex((c) => c.time === newCandle.time);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = { ...prev[existingIdx], ...newCandle };
              return updated;
            }
            return [...prev.slice(-34), newCandle];
          });
        } else if (tf === '5m') {
          setCandlesM5((prev) => [...prev.slice(-24), newCandle]);
        } else if (tf === '15m') {
          setCandlesM15((prev) => [...prev.slice(-19), newCandle]);
        }
      },
      onHealthUpdate: (health) => setFeedHealth(health),
      onDerivativesUpdate: (d) => setDerivatives(d),
    });

    return () => {
      feedRef.current?.disconnect();
    };
  }, [symbol, handleTrade]);

  // 24/7 Automated 5-Minute Signal Generator & Countdown based on DOM, Order Flow, Delta & MMXM
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const next5 = 5 - (minutes % 5);
      const remSec = 60 - seconds;
      const minLeft = next5 === 5 && seconds === 0 ? 0 : next5 - 1;
      const secLeft = remSec === 60 ? 0 : remSec;

      setNext5mCountdown(
        `${String(minLeft).padStart(2, '0')}:${String(secLeft).padStart(2, '0')}`
      );

      // Trigger automatic 5-min recalculation when boundary rolls over
      if (minutes % 5 === 0 && seconds < 2 && candlesM1.length > 0) {
        const tickSize = getTickSize(symbol);
        const vp = calculateVolumeProfile(candlesM1, tickSize);
        const sig = generateScalpingSignal(symbol, '5m', candlesM1, candlesM5, candlesM15, candlesH1, vp, dom);
        setCurrentSignal(sig);
        const q7 = evaluateSevenQuestions(symbol, candlesM1, candlesM5, candlesM15, candlesH1, vp, dom);
        setSevenQuestions(q7);
        setSignalHistory((prev) => [sig, ...prev.slice(0, 19)]);

        if (sig.signal !== 'WAIT' && soundEnabled) {
          audioAlerts.playSignalAlert(sig.signal === 'BUY');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [symbol, candlesM1, candlesM5, candlesM15, candlesH1, dom, soundEnabled]);

  // Trigger manual evaluation
  const handleManualEvaluation = useCallback(() => {
    if (candlesM1.length === 0) return;
    const tickSize = getTickSize(symbol);
    const vp = calculateVolumeProfile(candlesM1, tickSize);
    const q7 = evaluateSevenQuestions(symbol, candlesM1, candlesM5, candlesM15, candlesH1, vp, dom);
    setSevenQuestions(q7);
    const sig = generateScalpingSignal(symbol, timeframe === '15m' ? '15m' : '1m', candlesM1, candlesM5, candlesM15, candlesH1, vp, dom);
    setCurrentSignal(sig);
    setSignalHistory((prev) => [sig, ...prev.slice(0, 19)]);

    if (sig.signal !== 'WAIT' && soundEnabled) {
      audioAlerts.playSignalAlert(sig.signal === 'BUY');
    }
  }, [symbol, timeframe, candlesM1, candlesM5, candlesM15, candlesH1, dom, soundEnabled]);

  // Call Server-Side Gemini API for Institutional Deep Reasoning
  const handleRefreshAiReasoning = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          currentPrice,
          volumeProfile,
          sevenQuestions,
          domSummary: dom ? `Imbalance: ${dom.imbalanceRatio.toFixed(2)}, Bids: ${dom.totalBidLiquidity.toFixed(1)}, Asks: ${dom.totalAskLiquidity.toFixed(1)}` : 'Balanced Book',
          footprintSummary: `POC: ${volumeProfile.poc}, VAH: ${volumeProfile.vah}, VAL: ${volumeProfile.val}`,
        }),
      });
      const data = await res.json();
      if (data.reasoning) {
        setAiReasoningText(data.reasoning);
      }
    } catch (err) {
      console.error('Error in AI reasoning:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const [activeMobileTab, setActiveMobileTab] = useState<'all' | 'charts' | 'signal' | 'dom' | 'heatmap'>('all');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <HeaderNav
        symbol={symbol}
        setSymbol={setSymbol}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        feedHealth={feedHealth}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onTriggerManualSignal={handleManualEvaluation}
        next5mCountdown={next5mCountdown}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-3 gap-3 overflow-y-auto">
        {/* Multi-Timeframe Alignment Matrix Bar */}
        <MTFMatrix
          symbol={symbol}
          candlesM1={candlesM1}
          candlesM5={candlesM5}
          candlesM15={candlesM15}
          candlesH1={candlesH1}
          currentPrice={currentPrice}
        />

        {/* Mobile View Selector Bar (visible on mobile / small screens) */}
        <div className="flex lg:hidden items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveMobileTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap ${
              activeMobileTab === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Panels
          </button>
          <button
            onClick={() => setActiveMobileTab('charts')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap ${
              activeMobileTab === 'charts'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Footprint & Delta
          </button>
          <button
            onClick={() => setActiveMobileTab('signal')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap ${
              activeMobileTab === 'signal'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MMXM Signal
          </button>
          <button
            onClick={() => setActiveMobileTab('dom')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap ${
              activeMobileTab === 'dom'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DOM & Profile
          </button>
          <button
            onClick={() => setActiveMobileTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold whitespace-nowrap ${
              activeMobileTab === 'heatmap'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DOM Heatmap
          </button>
        </div>

        {/* Responsive Trading Suite Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[600px]">
          {/* Left / Center Column (7 Cols): Footprint Cluster Chart & Cumulative Delta */}
          <div
            className={`lg:col-span-7 flex-col gap-3 h-full ${
              activeMobileTab === 'all' || activeMobileTab === 'charts' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Footprint Chart (70% Height) */}
            <div className="flex-[3] min-h-[380px] sm:min-h-[440px]">
              <FootprintChart
                symbol={symbol}
                timeframe={timeframe}
                candles={candlesM1}
                volumeProfile={volumeProfile}
                currentPrice={currentPrice}
              />
            </div>

            {/* Delta & CVD Divergence Panel (30% Height) */}
            <div className="flex-[1.2] min-h-[180px] sm:min-h-[200px]">
              <DeltaPanel symbol={symbol} candles={candlesM1} />
            </div>
          </div>

          {/* Right Column (5 Cols): DOM Depth Ladder, Volume Profile, Time & Sales, and MMXM Signal Engine */}
          <div
            className={`lg:col-span-5 flex-col gap-3 h-full ${
              activeMobileTab === 'all' || activeMobileTab === 'signal' || activeMobileTab === 'dom'
                ? 'flex'
                : 'hidden lg:flex'
            }`}
          >
            {/* Top Row of Right Column: Signal Engine Card */}
            <div
              className={`flex-[2] min-h-[340px] sm:min-h-[360px] ${
                activeMobileTab === 'all' || activeMobileTab === 'signal' ? 'block' : 'hidden lg:block'
              }`}
            >
              <SignalEngineCard
                symbol={symbol}
                currentSignal={currentSignal}
                sevenQuestions={sevenQuestions}
                signalHistory={signalHistory}
                volumeProfile={volumeProfile}
                domSnapshot={dom}
                onRefreshAiReasoning={handleRefreshAiReasoning}
                onManualAnalyze={handleManualEvaluation}
                isAiLoading={isAiLoading}
                aiReasoningText={aiReasoningText}
              />
            </div>

            {/* Bottom Row of Right Column: Tabbed DOM / Volume Profile / Time & Sales */}
            <div
              className={`flex-[1.5] min-h-[280px] grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                activeMobileTab === 'all' || activeMobileTab === 'dom' ? 'grid' : 'hidden lg:grid'
              }`}
            >
              {/* DOM Ladder */}
              <div className="h-full">
                <DOMLadder symbol={symbol} dom={dom} currentPrice={currentPrice} />
              </div>

              {/* Time & Sales or Volume Profile */}
              <div className="h-full">
                <VolumeProfileMatrix symbol={symbol} volumeProfile={volumeProfile} currentPrice={currentPrice} />
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Bottom Row: DOM Heatmap & Coinglass Macro */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[220px] ${
            activeMobileTab === 'all' || activeMobileTab === 'heatmap' ? 'grid' : 'hidden lg:grid'
          }`}
        >
          <div className="lg:col-span-8 h-[220px]">
            <DOMHeatmap symbol={symbol} dom={dom} currentPrice={currentPrice} />
          </div>
          <div className="lg:col-span-4 h-[220px]">
            <CoinglassDerivativesPanel symbol={symbol} data={derivatives} />
          </div>
        </div>
      </div>
    </main>
  );
}
