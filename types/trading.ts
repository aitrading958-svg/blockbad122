// Trading Types & Interfaces for Klustra Order Flow & MMXM Scalping Engine

export type TradingSymbol = 'XAUTUSDT';

export type Timeframe = '1m' | '5m' | '15m' | '1h';

export type FeedStatus = 'LIVE' | 'STALE' | 'MISSING' | 'DISCONNECTED' | 'INVALID';

export interface FeedHealth {
  status: FeedStatus;
  source: string;
  lastUpdated: number;
  dataAgeMs: number;
  latencyMs: number;
  ticksPerSecond: number;
  totalTradesReceived: number;
  sequenceId?: number;
}

export interface TradeTick {
  id: string;
  timestamp: number;
  price: number;
  size: number;
  side: 'BUY' | 'SELL'; // Aggressor side (BUY = hit Ask, SELL = hit Bid)
  isWhale?: boolean;
}

export interface DOMLevel {
  price: number;
  bidQty: number;
  askQty: number;
  totalQty: number;
  bidRatio: number;
  askRatio: number;
  isRefill?: boolean;
  refillCount?: number;
  isPulling?: boolean;
  isStacking?: boolean;
}

export interface DOMSnapshot {
  timestamp: number;
  bids: [number, number][]; // [price, qty]
  asks: [number, number][]; // [price, qty]
  bestBid: number;
  bestAsk: number;
  spread: number;
  totalBidLiquidity: number;
  totalAskLiquidity: number;
  imbalanceRatio: number; // >1 = bid heavy, <1 = ask heavy
  refillsDetected: { price: number; side: 'BID' | 'ASK'; count: number }[];
}

export interface FootprintPriceLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  delta: number;
  isDiagonalBuyImbalance: boolean;
  isDiagonalSellImbalance: boolean;
  isStackedImbalance: boolean;
  isAbsorption: boolean;
  isExhaustion: boolean;
  isPOCLevel: boolean;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  delta: number;
  cvd: number;
  tradeCount: number;
  buyVolume: number;
  sellVolume: number;
  footprint: Map<number, FootprintPriceLevel> | Record<number, FootprintPriceLevel>;
  vwap?: number;
  isUnfinishedHigh?: boolean;
  isUnfinishedLow?: boolean;
  isAbsorptionHigh?: boolean;
  isAbsorptionLow?: boolean;
  hasSweptLiquidity?: boolean;
  sweptLevel?: string;
  isFVG?: boolean;
  isOrderBlock?: boolean;
}

export interface VolumeProfileLevel {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  percentage: number;
  isPOC: boolean;
  isVAH: boolean;
  isVAL: boolean;
  isHVN: boolean;
  isLVN: boolean;
}

export interface VolumeProfileData {
  poc: number;
  vah: number;
  val: number;
  totalVolume: number;
  valueAreaVolume: number;
  levels: VolumeProfileLevel[];
  hvnPrices: number[];
  lvnPrices: number[];
  developingPOC: number;
  developingVAH: number;
  developingVAL: number;
}

export type MarketState =
  | 'TREND_UP'
  | 'TREND_DOWN'
  | 'BALANCE'
  | 'ACCUMULATION'
  | 'DISTRIBUTION'
  | 'BREAKOUT'
  | 'FAILED_BREAKOUT'
  | 'PULLBACK'
  | 'REVERSAL'
  | 'LIQUIDITY_SWEEP'
  | 'ABSORPTION'
  | 'EXHAUSTION'
  | 'COMPRESSION'
  | 'EXPANSION';

export type MMXMPhase =
  | 'ACCUMULATION'
  | 'MANIPULATION'
  | 'EXPANSION'
  | 'REPRICING'
  | 'CONTINUATION'
  | 'PULLBACK'
  | 'REVERSAL'
  | 'RANGE'
  | 'BREAKOUT'
  | 'BREAKDOWN'
  | 'UNCERTAIN';

export type SignalAction = 'BUY' | 'SELL' | 'WAIT';

export type SetupQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SevenQuestionsEvaluation {
  q1_priceLocation: {
    relativeToValue: 'ABOVE_VAH' | 'INSIDE_VALUE' | 'BELOW_VAL';
    distanceToPOC: number;
    distanceToVWAP: number;
    nearestHVN: number;
    nearestLVN: number;
    summary: string;
  };
  q2_marketAction: {
    primaryState: MarketState;
    mmxmPhase: MMXMPhase;
    m1Structure: 'BULLISH' | 'BEARISH' | 'RANGING';
    m5Context: 'BULLISH' | 'BEARISH' | 'RANGING';
    m15Trend: 'BULLISH' | 'BEARISH' | 'RANGING';
    h1Macro: 'BULLISH' | 'BEARISH' | 'RANGING';
    summary: string;
  };
  q3_aggression: {
    dominantSide: 'BUYERS' | 'SELLERS' | 'BALANCED';
    buyAggressionRatio: number;
    sellAggressionRatio: number;
    candleDelta: number;
    cvdDivergence: 'BULLISH_DIVERGENCE' | 'BEARISH_DIVERGENCE' | 'NONE';
    summary: string;
  };
  q4_priceResponse: {
    isDisplacing: boolean;
    isAbsorbing: boolean;
    absorptionType: 'BUYER_ABSORPTION' | 'SELLER_ABSORPTION' | 'NONE';
    efficiency: 'EFFECTIVE' | 'WEAK_INEFFECTIVE' | 'REJECTED';
    summary: string;
  };
  q5_liquidityTarget: {
    sweptSide: 'BUY_SIDE' | 'SELL_SIDE' | 'NONE';
    nextTargetObjective: string;
    restingDOMPool: string;
    summary: string;
  };
  q6_immediatePrecedingSequence: {
    sequence: string[];
    summary: string;
  };
  q7_nextProbableState: {
    continuationProbability: number;
    pullbackProbability: number;
    reversalProbability: number;
    balanceProbability: number;
    primaryHypothesis: 'CONTINUATION' | 'PULLBACK' | 'REVERSAL' | 'BALANCE';
    summary: string;
  };
  marketBehavior: {
    currentBehavior: string;
    orderFlowAction: string;
    priceResponse: string;
    mostLikelyNextBehavior: 'CONTINUATION' | 'PULLBACK' | 'ROTATION' | 'REVERSAL' | 'BREAKOUT' | 'FAILED_BREAKOUT';
    whyReasons: string[];
    confirmationRequired: string;
    invalidation: string;
    nextPriceArea: string;
    confidence: number;
    refillState: 'BUYER_REFILL' | 'SELLER_REFILL' | 'TWO_SIDED_REFILL' | 'NO_REFILL';
    absorptionState: 'BUY_ABSORPTION' | 'SELL_ABSORPTION' | 'FAILED_ABSORPTION' | 'ABSORPTION_BREAK' | 'NO_ABSORPTION';
  };
}

export interface ScalpingSignal {
  id: string;
  timestamp: number;
  symbol: TradingSymbol;
  timeframe: Timeframe;
  signal: SignalAction;
  setupName: string;
  confidence: number; // 0 - 100
  marketState: string;
  locationDesc: string;
  orderFlowDesc: string;
  deltaDesc: string;
  footprintDesc: string;
  domDesc: string;
  structureDesc: string;
  volumeProfileDesc: string;
  liquidityDesc: string;
  setupQuality: SetupQuality;
  currentPrice: number;
  entryZone: { min: number; max: number };
  takeProfit1: number;
  takeProfit2: number;
  stopLoss: number;
  riskRewardRatio: number;
  action: SignalAction;
  reason: string;
  invalidation: string;
  sevenQuestions: SevenQuestionsEvaluation;
  aiReasoning?: string;
  status: 'ACTIVE' | 'HIT_TP1' | 'HIT_TP2' | 'STOPPED' | 'EXPIRED';
  maxFavorablePrice?: number;
  maxFavorablePips?: number;
  maxFavorableUsdt?: number;
  floatingPips?: number;
  floatingUsdt?: number;
}

export interface Liquidation {
  id: string;
  side: 'LONG' | 'SHORT';
  price: number;
  size: number;
  time: number;
}

export interface DerivativesSnapshot {
  openInterest: number; // USD value
  oiChange24h: number; // Percentage
  longShortRatioGlobal: number;
  longShortRatioTop: number;
  whaleVsRetailDelta: number; // Positive = Whales buying, Negative = Retail buying
  liquidations: Liquidation[];
}

export interface SequenceMemoryStats {
  patternName: string;
  occurrences: number;
  continuationRate: number; // e.g. 74%
  reversalRate: number;
  pullbackRate: number;
  avgFavorableMovePts: number;
  avgAdverseMovePts: number;
  winRate: number;
}
