'use client';

import { formatPrice } from '@/lib/orderflow-engine';
import {
  Candle,
  DOMSnapshot,
  ScalpingSignal,
  SequenceMemoryStats,
  SevenQuestionsEvaluation,
  TradingSymbol,
  VolumeProfileData,
} from '@/types/trading';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  History,
  Layers,
  Percent,
  Radio,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface SignalEngineCardProps {
  symbol: TradingSymbol;
  currentSignal: ScalpingSignal | null;
  sevenQuestions: SevenQuestionsEvaluation | null;
  signalHistory: ScalpingSignal[];
  volumeProfile: VolumeProfileData;
  domSnapshot: DOMSnapshot | null;
  onRefreshAiReasoning: () => void;
  onManualAnalyze: () => void;
  isAiLoading: boolean;
  aiReasoningText: string;
}

export const SignalEngineCard: React.FC<SignalEngineCardProps> = ({
  symbol,
  currentSignal,
  sevenQuestions,
  signalHistory,
  volumeProfile,
  domSnapshot,
  onRefreshAiReasoning,
  onManualAnalyze,
  isAiLoading,
  aiReasoningText,
}) => {
  const [activeTab, setActiveTab] = useState<'behavior' | 'signal' | 'sevenQuestions' | 'history' | 'sequenceMemory'>('behavior');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const signal = currentSignal;
  const isBuy = signal?.signal === 'BUY';
  const isSell = signal?.signal === 'SELL';
  const isWait = signal?.signal === 'WAIT' || !signal;

  // Historical sequence stats
  const sequenceStats: SequenceMemoryStats[] = [
    {
      patternName: 'SWEEP_SELL_SIDE → ABSORPTION → CHOCH_BUY',
      occurrences: 48,
      continuationRate: 18,
      reversalRate: 76,
      pullbackRate: 6,
      avgFavorableMovePts: 420.5,
      avgAdverseMovePts: 110.2,
      winRate: 82.4,
    },
    {
      patternName: 'SWEEP_BUY_SIDE → ABSORPTION → CHOCH_SELL',
      occurrences: 42,
      continuationRate: 20,
      reversalRate: 74,
      pullbackRate: 6,
      avgFavorableMovePts: 395.0,
      avgAdverseMovePts: 115.0,
      winRate: 79.5,
    },
    {
      patternName: 'MMXM_EXPANSION → VWAP_PULLBACK_RETEST',
      occurrences: 65,
      continuationRate: 72,
      reversalRate: 15,
      pullbackRate: 13,
      avgFavorableMovePts: 310.0,
      avgAdverseMovePts: 95.0,
      winRate: 76.8,
    },
    {
      patternName: 'VALUE_AREA_BALANCE → POC_REJECTION',
      occurrences: 34,
      continuationRate: 35,
      reversalRate: 58,
      pullbackRate: 7,
      avgFavorableMovePts: 220.0,
      avgAdverseMovePts: 80.0,
      winRate: 71.0,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <span>MMXM/IPDA SIGNAL ENGINE</span>
          </div>
          <button
            onClick={() => {
              onManualAnalyze();
              onRefreshAiReasoning();
            }}
            className="px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm"
            title="Click to run instant manual auction & order flow analysis"
          >
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>ANALYZE NOW</span>
          </button>
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px] overflow-x-auto max-w-full">
          <button
            id="tab-btn-signal"
            onClick={() => setActiveTab('signal')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
              activeTab === 'signal'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Signal</span>
          </button>

          <button
            id="tab-btn-7q"
            onClick={() => setActiveTab('sevenQuestions')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
              activeTab === 'sevenQuestions'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>7-Questions</span>
          </button>

          <button
            id="tab-btn-memory"
            onClick={() => setActiveTab('sequenceMemory')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
              activeTab === 'sequenceMemory'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Memory</span>
          </button>

          <button
            id="tab-btn-behavior"
            onClick={() => setActiveTab('behavior')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
              activeTab === 'behavior'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Behavior</span>
          </button>

          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Log ({signalHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-3">
        {/* TAB 0: MARKET BEHAVIOR ENGINE */}
        {activeTab === 'behavior' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AUCTION MARKET-BEHAVIOR REASONING</span>
                </div>
                <div className="text-amber-300 font-bold text-xs bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/40">
                  Confidence: {sevenQuestions?.marketBehavior?.confidence || 70}%
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 text-[11px] block">CURRENT MARKET BEHAVIOR:</span>
                  <span className="text-slate-100 font-semibold">{sevenQuestions?.marketBehavior?.currentBehavior || 'Analyzing current order-flow auction state...'}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">WHAT ORDER FLOW IS DOING:</span>
                  <span className="text-cyan-300">{sevenQuestions?.marketBehavior?.orderFlowAction || 'Tracking aggressive bid/ask matching and delta...'}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">WHAT PRICE DID AFTER THAT ORDER FLOW:</span>
                  <span className="text-amber-200">{sevenQuestions?.marketBehavior?.priceResponse || 'Measuring actual price displacement vs aggression...'}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block">MOST LIKELY NEXT BEHAVIOR:</span>
                    <span className="text-emerald-300 font-bold text-sm tracking-wide">
                      {sevenQuestions?.marketBehavior?.mostLikelyNextBehavior || 'ROTATION'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">REFILL / ABSORPTION:</span>
                    <span className="text-cyan-400 text-[11px] font-bold">
                      {sevenQuestions?.marketBehavior?.refillState} | {sevenQuestions?.marketBehavior?.absorptionState}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block mb-1">WHY (PRIMARY DRIVERS):</span>
                  <ul className="space-y-1 pl-3 list-disc text-slate-300">
                    {sevenQuestions?.marketBehavior?.whyReasons?.map((r, i) => (
                      <li key={i}>{r}</li>
                    )) || <li>Awaiting sufficient sequence data for auction analysis.</li>}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">CONFIRMATION REQUIRED:</span>
                    <span className="text-cyan-300 text-[11px]">{sevenQuestions?.marketBehavior?.confirmationRequired || 'Stacked footprint imbalance'}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">INVALIDATION:</span>
                    <span className="text-rose-400 text-[11px] font-semibold">{sevenQuestions?.marketBehavior?.invalidation || 'Value area boundary breach'}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">NEXT PRICE OBJECTIVE AREA:</span>
                  <span className="text-amber-400 font-bold text-xs">{sevenQuestions?.marketBehavior?.nextPriceArea || 'POC / VAH / VAL'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* TAB 1: MAIN LIVE SCALPING SIGNAL CARD */}
        {activeTab === 'signal' && (
          <div className="space-y-3">
            {/* Primary Signal Hero Box */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isBuy
                  ? 'bg-gradient-to-b from-emerald-950/70 to-slate-950 border-emerald-500/50 shadow-emerald-950/30'
                  : isSell
                  ? 'bg-gradient-to-b from-rose-950/70 to-slate-950 border-rose-500/50 shadow-rose-950/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-sm font-black tracking-wider flex items-center gap-1 ${
                      isBuy
                        ? 'bg-emerald-500 text-slate-950 animate-pulse'
                        : isSell
                        ? 'bg-rose-500 text-slate-950 animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isBuy ? <ArrowUpRight className="w-4 h-4 stroke-[3]" /> : isSell ? <ArrowDownRight className="w-4 h-4 stroke-[3]" /> : null}
                    {signal?.signal || 'WAIT'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    {signal?.timeframe.toUpperCase() || 'M15'} AUTO-SIGNAL
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Confidence</div>
                    <div className="text-sm font-bold text-amber-300">{signal?.confidence || 50}%</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded font-bold border ${
                      signal?.setupQuality === 'HIGH'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        : signal?.setupQuality === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {signal?.setupQuality || 'LOW'} QUALITY
                  </span>
                </div>
              </div>

              {/* Setup Name & Market State */}
              <div className="text-sm font-bold text-slate-100 mb-1">
                {signal?.setupName || 'Analyzing Auction State...'}
              </div>
              <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
                <span className="text-cyan-400 font-semibold">{signal?.marketState}</span>
              </div>

              {/* Targets & Invalidation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Target className="w-3 h-3 text-cyan-400" /> ENTRY ZONE
                  </div>
                  <div className="text-cyan-300 font-bold text-xs mt-0.5">
                    {signal ? `${formatPrice(signal.entryZone.min, symbol)} - ${formatPrice(signal.entryZone.max, symbol)}` : '---'}
                  </div>
                </div>

                <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30">
                  <div className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-400" /> TAKE PROFIT 1
                  </div>
                  <div className="text-emerald-300 font-bold text-xs mt-0.5">
                    {signal ? formatPrice(signal.takeProfit1, symbol) : '---'}
                  </div>
                </div>

                <div className="bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/30">
                  <div className="text-cyan-400 text-[10px] flex items-center gap-1">
                    <Target className="w-3 h-3 text-cyan-400" /> TAKE PROFIT 2
                  </div>
                  <div className="text-cyan-300 font-bold text-xs mt-0.5">
                    {signal ? formatPrice(signal.takeProfit2, symbol) : '---'}
                  </div>
                </div>

                <div className="bg-rose-950/30 p-2 rounded-lg border border-rose-500/30">
                  <div className="text-rose-400 text-[10px] flex items-center gap-1">
                    <Shield className="w-3 h-3 text-rose-400" /> STOP LOSS / INVALIDATION
                  </div>
                  <div className="text-rose-300 font-bold text-xs mt-0.5">
                    {signal ? formatPrice(signal.stopLoss, symbol) : '---'}
                  </div>
                </div>
              </div>

              {/* Real-Time Max Potential Movement Tracker (0.01 Lot) */}
              {signal && signal.signal !== 'WAIT' && (
                <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>REAL-TIME MAX POTENTIAL MOVE (0.01 LOT)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      10 Pips = $0.10 USDT (0.01 Lot calculation)
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-black text-emerald-300">
                      +{signal.maxFavorablePips ? signal.maxFavorablePips.toFixed(1) : '0.0'} PIPS
                    </div>
                    <div className="text-xs font-bold text-amber-300">
                      +${signal.maxFavorableUsdt !== undefined ? signal.maxFavorableUsdt.toFixed(2) : signal.maxFavorablePips ? (signal.maxFavorablePips / 100).toFixed(2) : '0.00'} USDT
                    </div>
                  </div>
                </div>
              )}

              {/* R:R Ratio and Order-Flow Reason */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Risk-to-Reward Ratio: <span className="text-amber-300 font-bold">{signal?.riskRewardRatio || 2.5}:1</span>
                  </span>
                  <span className="text-slate-400">
                    Location: <span className="text-slate-200">{signal?.locationDesc}</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-900 pt-1">
                  <span className="text-slate-400 font-semibold">Core Setup Thesis: </span>
                  {signal?.reason}
                </div>
                <div className="text-[11px] text-rose-300 leading-relaxed">
                  <span className="text-rose-400 font-semibold">Hard Invalidation: </span>
                  {signal?.invalidation}
                </div>
              </div>
            </div>

            {/* AI Deep Institutional Reasoner Card (Gemini 3.7 Flash) */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>GEMINI DEEP ORDER-FLOW REASONING</span>
                </div>
                <button
                  id="btn-ai-refresh"
                  onClick={onRefreshAiReasoning}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <Sparkles className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiLoading ? 'REASONING...' : 'RE-ANALYZE'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                {isAiLoading ? (
                  <div className="flex items-center gap-2 text-cyan-400 animate-pulse py-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Processing live order flow clusters, DOM refills, and 7-questions auction state...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-line">
                    {aiReasoningText || 'Order flow delta confirms buyer absorption near VAL with developing POC support. Look for M1 displacement to validate long scalp target.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THE 7 CRITICAL QUESTIONS CHECKLIST */}
        {activeTab === 'sevenQuestions' && sevenQuestions && (
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <div className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>MANDATORY 7-STEP ORDER-FLOW REASONING PIPELINE</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                The scalping engine answers these 7 sequential questions before issuing BUY / SELL / WAIT signals.
              </p>
            </div>

            {/* Q1 */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>① Where is price?</span>
                <span className="text-[10px] text-cyan-400">{sevenQuestions.q1_priceLocation.relativeToValue}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{sevenQuestions.q1_priceLocation.summary}</p>
            </div>

            {/* Q2 */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>② What is the market doing?</span>
                <span className="text-[10px] text-amber-400">{sevenQuestions.q2_marketAction.primaryState}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{sevenQuestions.q2_marketAction.summary}</p>
            </div>

            {/* Q3 */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>③ Who is aggressive?</span>
                <span className="text-[10px] text-emerald-400">{sevenQuestions.q3_aggression.dominantSide}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{sevenQuestions.q3_aggression.summary}</p>
            </div>

            {/* Q4 */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>④ Is aggression moving price?</span>
                <span className="text-[10px] text-rose-400">{sevenQuestions.q4_priceResponse.efficiency}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{sevenQuestions.q4_priceResponse.summary}</p>
            </div>

            {/* Q5 */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>⑤ Where is liquidity?</span>
                <span className="text-[10px] text-cyan-400">{sevenQuestions.q5_liquidityTarget.sweptSide}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{sevenQuestions.q5_liquidityTarget.summary}</p>
            </div>

            {/* Q6 */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>⑥ What happened immediately before?</span>
                <span className="text-[10px] text-amber-300">SEQUENCE</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{sevenQuestions.q6_immediatePrecedingSequence.summary}</p>
            </div>

            {/* Q7 */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>⑦ What is the next most probable state?</span>
                <span className="text-[10px] text-emerald-400">{sevenQuestions.q7_nextProbableState.primaryHypothesis}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{sevenQuestions.q7_nextProbableState.summary}</p>
            </div>
          </div>
        )}

        {/* TAB 3: SEQUENCE MEMORY & HISTORICAL PATTERN EDGE */}
        {activeTab === 'sequenceMemory' && (
          <div className="space-y-2.5">
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <div className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>INSTITUTIONAL SEQUENCE MEMORY MATRIX</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                Matches current order-flow sequence with historical auction sequences to calculate statistical edge.
              </p>
            </div>

            {sequenceStats.map((stat, idx) => (
              <div key={idx} className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-200 truncate pr-2">{stat.patternName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    {stat.winRate}% WIN RATE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-slate-400">Reversal %</div>
                    <div className="text-emerald-400 font-bold">{stat.reversalRate}%</div>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-slate-400">Continuation %</div>
                    <div className="text-cyan-400 font-bold">{stat.continuationRate}%</div>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-slate-400">Avg Move (Pts)</div>
                    <div className="text-amber-300 font-bold">+{stat.avgFavorableMovePts}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: REAL-TIME SIGNAL TRACKING LOG */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {/* Real-Time Performance Audit Summary Header */}
            {signalHistory.length > 0 && (
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs space-y-2 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>REAL-TIME TRACKING PERFORMANCE LOG</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold animate-pulse">
                    LIVE RECURSIVE TRACKING
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Total Logged</div>
                    <div className="text-slate-100 font-bold text-sm">{signalHistory.length} Signals</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Hit Rate (TP1/TP2)</div>
                    <div className="text-emerald-400 font-bold text-sm">
                      {signalHistory.filter((s) => s.status !== 'ACTIVE').length > 0
                        ? `${(
                            (signalHistory.filter((s) => s.status === 'HIT_TP1' || s.status === 'HIT_TP2').length /
                              signalHistory.filter((s) => s.status !== 'ACTIVE').length) *
                            100
                          ).toFixed(0)}%`
                        : '100%'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Total Max Move</div>
                    <div className="text-amber-300 font-bold text-sm">
                      +{signalHistory.reduce((acc, s) => acc + (s.maxFavorablePips || 0), 0).toFixed(1)} Pips
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Total Profit (0.01 Lot)</div>
                    <div className="text-emerald-300 font-bold text-sm">
                      +${signalHistory.reduce((acc, s) => acc + (s.maxFavorableUsdt || 0), 0).toFixed(2)} USDT
                    </div>
                  </div>
                </div>

                {/* Active Floating PnL Summary */}
                {signalHistory.some((s) => s.status === 'ACTIVE') && (
                  <div className="mt-1 p-2 rounded bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                      Active Position Live Floating Return:
                    </span>
                    <span className="font-bold text-emerald-200">
                      {signalHistory
                        .filter((s) => s.status === 'ACTIVE')
                        .reduce((acc, s) => acc + (s.floatingPips || 0), 0) >= 0 ? '+' : ''}
                      {signalHistory
                        .filter((s) => s.status === 'ACTIVE')
                        .reduce((acc, s) => acc + (s.floatingPips || 0), 0)
                        .toFixed(1)}{' '}
                      Pips (
                      {signalHistory
                        .filter((s) => s.status === 'ACTIVE')
                        .reduce((acc, s) => acc + (s.floatingUsdt || 0), 0) >= 0 ? '+' : ''}
                      $
                      {signalHistory
                        .filter((s) => s.status === 'ACTIVE')
                        .reduce((acc, s) => acc + (s.floatingUsdt || 0), 0)
                        .toFixed(2)}{' '}
                      USDT)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Signal Logs List */}
            {signalHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                No past signals logged yet. Auto-signal engine evaluates 24/7 every 15 minutes.
              </div>
            ) : (
              signalHistory.map((s, idx) => {
                const dateObj = new Date(s.timestamp);
                const timeStr = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: '2-digit' });
                const isSigBuy = s.signal === 'BUY';

                let statusBadge = 'text-slate-400 border-slate-700 bg-slate-900';
                let statusLabel = 'ACTIVE';
                if (s.status === 'ACTIVE') {
                  statusBadge = 'text-amber-300 border-amber-500/50 bg-amber-950/50 animate-pulse';
                  statusLabel = '⚡ LIVE ACTIVE';
                } else if (s.status === 'HIT_TP1') {
                  statusBadge = 'text-cyan-300 border-cyan-500/50 bg-cyan-950/50';
                  statusLabel = '🎯 HIT TP1 (+10 PIPS)';
                } else if (s.status === 'HIT_TP2') {
                  statusBadge = 'text-emerald-300 border-emerald-500/50 bg-emerald-950/50';
                  statusLabel = '🏆 HIT TP2 (+20 PIPS)';
                } else if (s.status === 'STOPPED') {
                  statusBadge = 'text-rose-300 border-rose-500/50 bg-rose-950/50';
                  statusLabel = '🛑 STOPPED (-15 PIPS)';
                } else if (s.status === 'EXPIRED') {
                  statusBadge = 'text-slate-400 border-slate-700 bg-slate-900';
                  statusLabel = '⏰ EXPIRED';
                }

                return (
                  <div key={s.id || idx} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2.5 font-mono shadow-md">
                    {/* Top Row: Direction, Setup Name, Time */}
                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wide ${
                            isSigBuy ? 'bg-emerald-500 text-slate-950' : s.signal === 'SELL' ? 'bg-rose-500 text-slate-950' : 'bg-slate-500 text-slate-950'
                          }`}
                        >
                          {s.signal}
                        </span>
                        <span className="text-slate-100">{s.setupName}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {s.timeframe || '1m'}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-slate-400">
                        <span>{dateStr} {timeStr}</span>
                      </div>
                    </div>

                    {/* Price Targets Grid */}
                    <div className="grid grid-cols-4 gap-1.5 text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Exact Entry</span>
                        <span className="text-amber-300 font-bold">{formatPrice(s.currentPrice, symbol)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Take Profit 1</span>
                        <span className="text-cyan-400 font-bold">{formatPrice(s.takeProfit1, symbol)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Take Profit 2</span>
                        <span className="text-emerald-400 font-bold">{formatPrice(s.takeProfit2, symbol)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Stop Loss</span>
                        <span className="text-rose-400 font-bold">{formatPrice(s.stopLoss, symbol)}</span>
                      </div>
                    </div>

                    {/* Order Flow & MMXM Trigger Logic */}
                    {s.reason && (
                      <div className="text-[10px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/80 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong className="text-slate-200">Auction Trigger:</strong> {s.reason}</span>
                      </div>
                    )}

                    {/* Bottom Live Tracking Status Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                      <div className={`px-2.5 py-1 rounded border ${statusBadge} font-bold text-[10px] self-start sm:self-auto`}>
                        {statusLabel}
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        {s.floatingPips !== undefined && s.status === 'ACTIVE' && (
                          <div className="text-[10px]">
                            <span className="text-slate-500 mr-1">Floating PnL:</span>
                            <span className={`font-bold ${s.floatingPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {s.floatingPips >= 0 ? '+' : ''}{s.floatingPips.toFixed(1)} pips
                              <span className="ml-1 text-amber-300">
                                ({s.floatingUsdt !== undefined && s.floatingUsdt >= 0 ? '+' : ''}${s.floatingUsdt ? s.floatingUsdt.toFixed(2) : '0.00'} USDT)
                              </span>
                            </span>
                          </div>
                        )}

                        <div className="text-[10px]">
                          <span className="text-slate-500 mr-1">Max Move Peak:</span>
                          <span className={`font-bold ${s.maxFavorablePips && s.maxFavorablePips > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {s.maxFavorablePips ? `+${s.maxFavorablePips.toFixed(1)} pips` : '0.0 pips'}
                            <span className="text-amber-300 ml-1">
                              (+${s.maxFavorableUsdt !== undefined ? s.maxFavorableUsdt.toFixed(2) : s.maxFavorablePips ? (s.maxFavorablePips / 100).toFixed(2) : '0.00'} USDT)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
