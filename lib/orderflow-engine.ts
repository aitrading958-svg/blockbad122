// High-Performance Numerical Order Flow, Footprint, Volume Profile & MMXM Engine
import {
  Candle,
  DOMLevel,
  DOMSnapshot,
  FootprintPriceLevel,
  MMXMPhase,
  MarketState,
  ScalpingSignal,
  SevenQuestionsEvaluation,
  TradingSymbol,
  VolumeProfileData,
  VolumeProfileLevel,
} from '@/types/trading';

export function getPriceDecimals(symbol: TradingSymbol): number {
  if (symbol === 'XAUTUSDT') return 2;
  return 2;
}

export function getTickSize(symbol: TradingSymbol): number {
  if (symbol === 'XAUTUSDT') return 0.1;
  return 0.2;
}

export function formatPrice(price: number, symbol: TradingSymbol): string {
  const dec = getPriceDecimals(symbol);
  return price.toFixed(dec);
}

// Convert raw trade to price cluster tick bucket
export function quantizePrice(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize;
}

// Calculate Footprint with diagonal imbalances & stacked imbalances
export function computeFootprintMetrics(
  footprintMap: Map<number, { bidVolume: number; askVolume: number }>,
  imbalanceRatio = 3.0
): FootprintPriceLevel[] {
  const prices = Array.from(footprintMap.keys()).sort((a, b) => b - a);
  const result: FootprintPriceLevel[] = [];

  let maxVol = 0;
  let pocPrice = prices[0] || 0;

  // First pass: totals & find POC
  for (const price of prices) {
    const data = footprintMap.get(price)!;
    const total = data.bidVolume + data.askVolume;
    if (total > maxVol) {
      maxVol = total;
      pocPrice = price;
    }
  }

  // Second pass: diagonal imbalances (Ask at price P vs Bid at price P - 1)
  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    const data = footprintMap.get(p)!;
    const totalVolume = data.bidVolume + data.askVolume;
    const delta = data.askVolume - data.bidVolume;

    // Diagonal Buy Imbalance: Ask[i] vs Bid[i+1] (lower price level)
    let isDiagonalBuyImbalance = false;
    let isDiagonalSellImbalance = false;

    if (i < prices.length - 1) {
      const lowerData = footprintMap.get(prices[i + 1]);
      if (lowerData && lowerData.bidVolume > 0 && data.askVolume / lowerData.bidVolume >= imbalanceRatio && data.askVolume > 0.05) {
        isDiagonalBuyImbalance = true;
      }
    }

    // Diagonal Sell Imbalance: Bid[i] vs Ask[i-1] (higher price level)
    if (i > 0) {
      const higherData = footprintMap.get(prices[i - 1]);
      if (higherData && higherData.askVolume > 0 && data.bidVolume / higherData.askVolume >= imbalanceRatio && data.bidVolume > 0.05) {
        isDiagonalSellImbalance = true;
      }
    }

    result.push({
      price: p,
      bidVolume: Number(data.bidVolume.toFixed(2)),
      askVolume: Number(data.askVolume.toFixed(2)),
      totalVolume: Number(totalVolume.toFixed(2)),
      delta: Number(delta.toFixed(2)),
      isDiagonalBuyImbalance,
      isDiagonalSellImbalance,
      isStackedImbalance: false, // Calculated next
      isAbsorption: false,
      isExhaustion: false,
      isPOCLevel: p === pocPrice,
    });
  }

  // Detect stacked imbalances (3 or more consecutive diagonal imbalances)
  let buyStackCount = 0;
  for (let i = 0; i < result.length; i++) {
    if (result[i].isDiagonalBuyImbalance) {
      buyStackCount++;
    } else {
      if (buyStackCount >= 3) {
        for (let j = i - buyStackCount; j < i; j++) {
          result[j].isStackedImbalance = true;
        }
      }
      buyStackCount = 0;
    }
  }
  if (buyStackCount >= 3) {
    for (let j = result.length - buyStackCount; j < result.length; j++) {
      result[j].isStackedImbalance = true;
    }
  }

  let sellStackCount = 0;
  for (let i = 0; i < result.length; i++) {
    if (result[i].isDiagonalSellImbalance) {
      sellStackCount++;
    } else {
      if (sellStackCount >= 3) {
        for (let j = i - sellStackCount; j < i; j++) {
          result[j].isStackedImbalance = true;
        }
      }
      sellStackCount = 0;
    }
  }
  if (sellStackCount >= 3) {
    for (let j = result.length - sellStackCount; j < result.length; j++) {
      result[j].isStackedImbalance = true;
    }
  }

  // Detect absorption at candle extremes
  if (result.length >= 2) {
    const topLevel = result[0];
    if (topLevel.askVolume > topLevel.bidVolume * 2.5 && topLevel.totalVolume > maxVol * 0.4) {
      topLevel.isAbsorption = true; // Buyers absorbed at high
    }
    const bottomLevel = result[result.length - 1];
    if (bottomLevel.bidVolume > bottomLevel.askVolume * 2.5 && bottomLevel.totalVolume > maxVol * 0.4) {
      bottomLevel.isAbsorption = true; // Sellers absorbed at low
    }
  }

  return result;
}

// Compute dynamic Session Volume Profile (Value Area 70%)
export function calculateVolumeProfile(candles: Candle[], tickSize: number): VolumeProfileData {
  const profileMap = new Map<number, { volume: number; buyVolume: number; sellVolume: number }>();
  let totalVolume = 0;

  for (const c of candles) {
    if (!c.footprint) continue;
    const entries = c.footprint instanceof Map ? Array.from(c.footprint.entries()) : Object.entries(c.footprint);

    for (const [pStr, level] of entries) {
      const p = quantizePrice(Number(pStr), tickSize);
      const existing = profileMap.get(p) || { volume: 0, buyVolume: 0, sellVolume: 0 };
      const lvlTot = level.totalVolume || level.bidVolume + level.askVolume;
      existing.volume += lvlTot;
      existing.buyVolume += level.askVolume;
      existing.sellVolume += level.bidVolume;
      profileMap.set(p, existing);
      totalVolume += lvlTot;
    }
  }

  const sortedPrices = Array.from(profileMap.keys()).sort((a, b) => b - a);
  if (sortedPrices.length === 0 || totalVolume === 0) {
    const lastPrice = candles[candles.length - 1]?.close || 0;
    return {
      poc: lastPrice,
      vah: lastPrice,
      val: lastPrice,
      totalVolume: 0,
      valueAreaVolume: 0,
      levels: [],
      hvnPrices: [],
      lvnPrices: [],
      developingPOC: lastPrice,
      developingVAH: lastPrice,
      developingVAL: lastPrice,
    };
  }

  // Find POC
  let maxVol = 0;
  let pocIdx = 0;
  for (let i = 0; i < sortedPrices.length; i++) {
    const p = sortedPrices[i];
    const data = profileMap.get(p)!;
    if (data.volume > maxVol) {
      maxVol = data.volume;
      pocIdx = i;
    }
  }
  const pocPrice = sortedPrices[pocIdx];

  // 70% Value Area algorithm (dual-direction expansion from POC)
  const targetValueVolume = totalVolume * 0.7;
  let accumulatedVol = profileMap.get(pocPrice)!.volume;
  let upperIdx = pocIdx - 1;
  let lowerIdx = pocIdx + 1;

  while (accumulatedVol < targetValueVolume && (upperIdx >= 0 || lowerIdx < sortedPrices.length)) {
    const upperVol = upperIdx >= 0 ? profileMap.get(sortedPrices[upperIdx])!.volume : -1;
    const lowerVol = lowerIdx < sortedPrices.length ? profileMap.get(sortedPrices[lowerIdx])!.volume : -1;

    if (upperVol >= lowerVol && upperIdx >= 0) {
      accumulatedVol += upperVol;
      upperIdx--;
    } else if (lowerIdx < sortedPrices.length) {
      accumulatedVol += lowerVol;
      lowerIdx++;
    } else if (upperIdx >= 0) {
      accumulatedVol += upperVol;
      upperIdx--;
    } else {
      break;
    }
  }

  const vahPrice = sortedPrices[Math.max(0, upperIdx + 1)];
  const valPrice = sortedPrices[Math.min(sortedPrices.length - 1, lowerIdx - 1)];

  // HVN / LVN Detection using moving average volume comparison
  const hvnPrices: number[] = [];
  const lvnPrices: number[] = [];
  const avgLevelVol = totalVolume / sortedPrices.length;

  const levels: VolumeProfileLevel[] = [];
  for (let i = 0; i < sortedPrices.length; i++) {
    const p = sortedPrices[i];
    const d = profileMap.get(p)!;
    const isHVN = d.volume > avgLevelVol * 1.8;
    const isLVN = d.volume < avgLevelVol * 0.35 && d.volume > 0;

    if (isHVN) hvnPrices.push(p);
    if (isLVN) lvnPrices.push(p);

    levels.push({
      price: p,
      volume: Number(d.volume.toFixed(2)),
      buyVolume: Number(d.buyVolume.toFixed(2)),
      sellVolume: Number(d.sellVolume.toFixed(2)),
      delta: Number((d.buyVolume - d.sellVolume).toFixed(2)),
      percentage: Number(((d.volume / totalVolume) * 100).toFixed(1)),
      isPOC: p === pocPrice,
      isVAH: p === vahPrice,
      isVAL: p === valPrice,
      isHVN,
      isLVN,
    });
  }

  return {
    poc: pocPrice,
    vah: vahPrice,
    val: valPrice,
    totalVolume: Number(totalVolume.toFixed(2)),
    valueAreaVolume: Number(accumulatedVol.toFixed(2)),
    levels,
    hvnPrices,
    lvnPrices,
    developingPOC: pocPrice,
    developingVAH: vahPrice,
    developingVAL: valPrice,
  };
}

// Calculate Session VWAP
export function calculateVWAP(candles: Candle[]): number[] {
  let cumulativeTypicalVol = 0;
  let cumulativeVol = 0;
  const vwaps: number[] = [];

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;
    cumulativeTypicalVol += typicalPrice * vol;
    cumulativeVol += vol;
    vwaps.push(cumulativeTypicalVol / cumulativeVol);
  }
  return vwaps;
}

// Detect Delta Divergences
export function detectDeltaDivergence(candles: Candle[], lookback = 10): 'BULLISH_DIVERGENCE' | 'BEARISH_DIVERGENCE' | 'NONE' {
  if (candles.length < lookback) return 'NONE';

  const recent = candles.slice(-lookback);
  const current = recent[recent.length - 1];
  const priorMinPriceIdx = recent.slice(0, -1).reduce((minIdx, c, idx, arr) => (c.low < arr[minIdx].low ? idx : minIdx), 0);
  const priorMaxPriceIdx = recent.slice(0, -1).reduce((maxIdx, c, idx, arr) => (c.high > arr[maxIdx].high ? idx : maxIdx), 0);

  const priorMin = recent[priorMinPriceIdx];
  const priorMax = recent[priorMaxPriceIdx];

  // Bullish: Price lower low or equal low, but CVD higher low (sellers absorbed)
  if (current.low <= priorMin.low && current.cvd > priorMin.cvd + (Math.abs(current.cvd) * 0.05)) {
    return 'BULLISH_DIVERGENCE';
  }

  // Bearish: Price higher high or equal high, but CVD lower high (buyers absorbed / exhausted)
  if (current.high >= priorMax.high && current.cvd < priorMax.cvd - (Math.abs(current.cvd) * 0.05)) {
    return 'BEARISH_DIVERGENCE';
  }

  return 'NONE';
}

// Full 7-Questions MMXM / IPDA Order Flow Evaluator
export function evaluateSevenQuestions(
  symbol: TradingSymbol,
  candlesM1: Candle[],
  candlesM5: Candle[],
  candlesM15: Candle[],
  candlesH1: Candle[],
  volumeProfile: VolumeProfileData,
  domSnapshot: DOMSnapshot | null
): SevenQuestionsEvaluation {
  const currentCandle = candlesM1[candlesM1.length - 1] || {
    close: volumeProfile.poc,
    high: volumeProfile.poc,
    low: volumeProfile.poc,
    open: volumeProfile.poc,
    delta: 0,
    cvd: 0,
    volume: 0,
  };
  const currentPrice = currentCandle.close;

  // Q1: Where is price?
  let relativeToValue: 'ABOVE_VAH' | 'INSIDE_VALUE' | 'BELOW_VAL' = 'INSIDE_VALUE';
  if (currentPrice > volumeProfile.vah) relativeToValue = 'ABOVE_VAH';
  else if (currentPrice < volumeProfile.val) relativeToValue = 'BELOW_VAL';

  const distanceToPOC = Math.abs(currentPrice - volumeProfile.poc);
  const vwapList = calculateVWAP(candlesM1);
  const currentVWAP = vwapList[vwapList.length - 1] || currentPrice;
  const distanceToVWAP = Math.abs(currentPrice - currentVWAP);

  const nearestHVN = volumeProfile.hvnPrices.reduce((closest, p) => (Math.abs(p - currentPrice) < Math.abs(closest - currentPrice) ? p : closest), volumeProfile.poc);
  const nearestLVN = volumeProfile.lvnPrices.reduce((closest, p) => (Math.abs(p - currentPrice) < Math.abs(closest - currentPrice) ? p : closest), volumeProfile.poc);

  const q1Summary = `${relativeToValue} | Dist POC: ${formatPrice(distanceToPOC, symbol)} | Dist VWAP: ${formatPrice(distanceToVWAP, symbol)}`;

  // Q2: What is the market doing?
  const m1Change = currentCandle.close - (candlesM1[Math.max(0, candlesM1.length - 5)]?.close || currentCandle.close);
  const m5Candle = candlesM5[candlesM5.length - 1];
  const m15Candle = candlesM15[candlesM15.length - 1];
  const h1Candle = candlesH1[candlesH1.length - 1];

  const m1Structure = m1Change > 0 ? 'BULLISH' : m1Change < 0 ? 'BEARISH' : 'RANGING';
  const m5Context = m5Candle && m5Candle.close >= m5Candle.open ? 'BULLISH' : 'BEARISH';
  const m15Trend = m15Candle && m15Candle.close >= m15Candle.open ? 'BULLISH' : 'BEARISH';
  const h1Macro = h1Candle && h1Candle.close >= h1Candle.open ? 'BULLISH' : 'BEARISH';

  let primaryState: MarketState = 'BALANCE';
  let mmxmPhase: MMXMPhase = 'RANGE';

  if (relativeToValue === 'BELOW_VAL' && currentCandle.delta > 0) {
    primaryState = 'ABSORPTION';
    mmxmPhase = 'ACCUMULATION';
  } else if (relativeToValue === 'ABOVE_VAH' && currentCandle.delta < 0) {
    primaryState = 'ABSORPTION';
    mmxmPhase = 'MANIPULATION';
  } else if (m1Structure === 'BULLISH' && m5Context === 'BULLISH') {
    primaryState = 'TREND_UP';
    mmxmPhase = 'EXPANSION';
  } else if (m1Structure === 'BEARISH' && m5Context === 'BEARISH') {
    primaryState = 'TREND_DOWN';
    mmxmPhase = 'REPRICING';
  }

  const q2Summary = `${primaryState} (${mmxmPhase}) | M1: ${m1Structure}, M5: ${m5Context}, M15: ${m15Trend}, H1: ${h1Macro}`;

  // Q3: Who is aggressive?
  const buyAggRatio = currentCandle.volume > 0 ? (currentCandle.buyVolume || (currentCandle.volume + currentCandle.delta) / 2) / currentCandle.volume : 0.5;
  const sellAggRatio = 1 - buyAggRatio;
  const dominantSide = buyAggRatio > 0.55 ? 'BUYERS' : sellAggRatio > 0.55 ? 'SELLERS' : 'BALANCED';
  const cvdDivergence = detectDeltaDivergence(candlesM1, 8);

  const q3Summary = `Aggression: ${dominantSide} (Buy: ${(buyAggRatio * 100).toFixed(0)}% / Sell: ${(sellAggRatio * 100).toFixed(0)}%) | Delta: ${currentCandle.delta.toFixed(2)} | Divergence: ${cvdDivergence}`;

  // Q4: Is aggression moving price? (Price Response Engine)
  const priceDisplacement = currentCandle.close - currentCandle.open;
  let isDisplacing = false;
  let isAbsorbing = false;
  let absorptionType: 'BUYER_ABSORPTION' | 'SELLER_ABSORPTION' | 'NONE' = 'NONE';
  let efficiency: 'EFFECTIVE' | 'WEAK_INEFFECTIVE' | 'REJECTED' = 'EFFECTIVE';

  if (dominantSide === 'BUYERS') {
    if (priceDisplacement > 0) {
      isDisplacing = true;
      efficiency = 'EFFECTIVE';
    } else {
      isAbsorbing = true;
      absorptionType = 'SELLER_ABSORPTION'; // Aggressive buyers hitting ceiling, sellers absorbing
      efficiency = 'REJECTED';
    }
  } else if (dominantSide === 'SELLERS') {
    if (priceDisplacement < 0) {
      isDisplacing = true;
      efficiency = 'EFFECTIVE';
    } else {
      isAbsorbing = true;
      absorptionType = 'BUYER_ABSORPTION'; // Aggressive sellers hitting floor, buyers absorbing
      efficiency = 'REJECTED';
    }
  }

  const q4Summary = isAbsorbing
    ? `⚠️ Absorption Detected: ${absorptionType} (Ineffective aggression)`
    : isDisplacing
    ? `✅ Effective Displacement in direction of aggression`
    : `Balanced / Minimal price displacement`;

  // Q5: Where is liquidity?
  const prevLow = Math.min(...candlesM1.slice(-10).map((c) => c.low));
  const prevHigh = Math.max(...candlesM1.slice(-10).map((c) => c.high));
  let sweptSide: 'BUY_SIDE' | 'SELL_SIDE' | 'NONE' = 'NONE';

  if (currentCandle.low < prevLow) sweptSide = 'SELL_SIDE';
  else if (currentCandle.high > prevHigh) sweptSide = 'BUY_SIDE';

  const nextTargetObjective = sweptSide === 'SELL_SIDE' ? `Buy-side Liquidity Pool @ ${formatPrice(volumeProfile.vah, symbol)}` : `Sell-side Liquidity Pool @ ${formatPrice(volumeProfile.val, symbol)}`;
  const restingDOMPool = domSnapshot
    ? domSnapshot.imbalanceRatio > 1.3
      ? `Heavy Bid Stacking (${domSnapshot.totalBidLiquidity.toFixed(1)} qty)`
      : `Heavy Ask Stacking (${domSnapshot.totalAskLiquidity.toFixed(1)} qty)`
    : `Resting Book Balanced`;

  const q5Summary = `Swept: ${sweptSide} | Next Objective: ${nextTargetObjective} | DOM: ${restingDOMPool}`;

  // Q6: What happened immediately before?
  const sequence: string[] = [];
  if (sweptSide !== 'NONE') sequence.push(`LIQUIDITY_SWEEP_${sweptSide}`);
  if (isAbsorbing) sequence.push(absorptionType);
  if (cvdDivergence !== 'NONE') sequence.push(cvdDivergence);
  if (isDisplacing) sequence.push('DISPLACEMENT');
  if (sequence.length === 0) sequence.push('BALANCE_AUCTION', 'ORDER_MATCHING');

  const q6Summary = sequence.join(' → ');

  // Q7: What is the next most probable state?
  let continuationProb = 35;
  let pullbackProb = 25;
  let reversalProb = 30;
  let balanceProb = 10;

  if (isAbsorbing || cvdDivergence !== 'NONE' || sweptSide !== 'NONE') {
    reversalProb = 65;
    continuationProb = 15;
    pullbackProb = 15;
    balanceProb = 5;
  } else if (isDisplacing && m1Structure === m5Context) {
    continuationProb = 65;
    pullbackProb = 20;
    reversalProb = 10;
    balanceProb = 5;
  }

  const primaryHypothesis: 'CONTINUATION' | 'PULLBACK' | 'REVERSAL' | 'BALANCE' =
    reversalProb >= continuationProb && reversalProb >= pullbackProb
      ? 'REVERSAL'
      : continuationProb >= pullbackProb
      ? 'CONTINUATION'
      : 'PULLBACK';

  const q7Summary = `Primary: ${primaryHypothesis} (${Math.max(continuationProb, reversalProb, pullbackProb)}%) | Cont: ${continuationProb}%, Rev: ${reversalProb}%, Pull: ${pullbackProb}%`;

  let refillState: 'BUYER_REFILL' | 'SELLER_REFILL' | 'TWO_SIDED_REFILL' | 'NO_REFILL' = 'NO_REFILL';
  if (domSnapshot && domSnapshot.refillsDetected.length > 0) {
    const hasBidRefill = domSnapshot.refillsDetected.some(r => r.side === 'BID');
    const hasAskRefill = domSnapshot.refillsDetected.some(r => r.side === 'ASK');
    if (hasBidRefill && hasAskRefill) refillState = 'TWO_SIDED_REFILL';
    else if (hasBidRefill) refillState = 'BUYER_REFILL';
    else if (hasAskRefill) refillState = 'SELLER_REFILL';
  } else if (dominantSide === 'BUYERS' && !isDisplacing) {
    refillState = 'SELLER_REFILL';
  } else if (dominantSide === 'SELLERS' && !isDisplacing) {
    refillState = 'BUYER_REFILL';
  }

  let absorptionState: 'BUY_ABSORPTION' | 'SELL_ABSORPTION' | 'FAILED_ABSORPTION' | 'ABSORPTION_BREAK' | 'NO_ABSORPTION' = 'NO_ABSORPTION';
  if (isAbsorbing) {
    if (absorptionType === 'BUYER_ABSORPTION') absorptionState = 'BUY_ABSORPTION';
    else if (absorptionType === 'SELLER_ABSORPTION') absorptionState = 'SELL_ABSORPTION';
  } else if (cvdDivergence !== 'NONE') {
    absorptionState = cvdDivergence === 'BULLISH_DIVERGENCE' ? 'BUY_ABSORPTION' : 'SELL_ABSORPTION';
  }

  let mostLikelyNextBehavior: 'CONTINUATION' | 'PULLBACK' | 'ROTATION' | 'REVERSAL' | 'BREAKOUT' | 'FAILED_BREAKOUT' = 'ROTATION';
  let currentBehavior = 'Balanced auction within value area with test of local liquidity pools.';
  let orderFlowAction = `Aggressive ${dominantSide.toLowerCase()} executing with delta ${currentCandle.delta.toFixed(2)}.`;
  let priceResponse = isDisplacing ? 'Strong price displacement in direction of aggression.' : isAbsorbing ? 'Aggression absorbed; price failed to progress.' : 'Minor price rotation.';
  let nextPriceArea = `${formatPrice(volumeProfile.poc, symbol)} (POC)`;
  let invalidation = `Price prints and sustains outside value area extremes (${formatPrice(volumeProfile.vah, symbol)} / ${formatPrice(volumeProfile.val, symbol)}).`;
  let confirmationRequired = 'Stacked footprint imbalance with aggressive volume expansion.';
  let confidence = 70;
  const whyReasons: string[] = [];

  if (absorptionState === 'BUY_ABSORPTION' || cvdDivergence === 'BULLISH_DIVERGENCE') {
    mostLikelyNextBehavior = 'REVERSAL';
    currentBehavior = 'Sell-side exhaustion / Buyer absorption at swing low / VAL support.';
    orderFlowAction = 'Heavy aggressive selling met with passive limit bid replenishment and failed downward displacement.';
    priceResponse = 'Price rejected lower; sellers trapped below support level.';
    nextPriceArea = `${formatPrice(volumeProfile.poc, symbol)} (POC)`;
    invalidation = `Break and close below sweep low at ${formatPrice(currentCandle.low - 0.5, symbol)}.`;
    confirmationRequired = 'M1 bullish candle close with positive delta and ask-side stacked imbalance.';
    confidence = 82;
    whyReasons.push('Negative delta or heavy selling produced zero downward price continuation (absorption).');
    whyReasons.push('Price tested value area low / sell-side liquidity pool and was aggressively defended.');
    whyReasons.push('CVD bullish divergence confirms passive accumulation.');
  } else if (absorptionState === 'SELL_ABSORPTION' || cvdDivergence === 'BEARISH_DIVERGENCE') {
    mostLikelyNextBehavior = 'REVERSAL';
    currentBehavior = 'Buy-side exhaustion / Seller absorption at swing high / VAH resistance.';
    orderFlowAction = 'Heavy aggressive buying met with passive limit ask replenishment and failed upward displacement.';
    priceResponse = 'Price rejected higher; buyers trapped above resistance level.';
    nextPriceArea = `${formatPrice(volumeProfile.poc, symbol)} (POC)`;
    invalidation = `Break and close above sweep high at ${formatPrice(currentCandle.high + 0.5, symbol)}.`;
    confirmationRequired = 'M1 bearish candle close with negative delta and bid-side stacked imbalance.';
    confidence = 80;
    whyReasons.push('Positive delta or heavy buying produced zero upward price expansion (seller absorption).');
    whyReasons.push('Price tested value area high / buy-side liquidity pool and met heavy passive limit selling.');
    whyReasons.push('CVD bearish divergence confirms passive distribution.');
  } else if (isDisplacing && m1Structure === m5Context) {
    mostLikelyNextBehavior = 'CONTINUATION';
    currentBehavior = `${m1Structure} MMXM expansion in progress with aligned order flow.`;
    orderFlowAction = `Aggressive ${dominantSide.toLowerCase()} consuming liquidity with positive price displacement.`;
    priceResponse = 'Clean price expansion away from developing POC / VWAP.';
    nextPriceArea = dominantSide === 'BUYERS' ? `${formatPrice(volumeProfile.vah, symbol)} (VAH)` : `${formatPrice(volumeProfile.val, symbol)} (VAL)`;
    invalidation = `Loss of developing POC / VWAP at ${formatPrice(currentVWAP, symbol)}.`;
    confirmationRequired = 'Continued aggressive volume and absence of counter-aggression.';
    confidence = 78;
    whyReasons.push(`M1 and M5 structures aligned in ${m1Structure} direction.`);
    whyReasons.push('Aggressive volume successfully displacing price without absorption.');
    whyReasons.push('Favorable location relative to volume profile value area.');
  } else {
    mostLikelyNextBehavior = 'ROTATION';
    currentBehavior = 'Value area rotation between VAH and VAL.';
    orderFlowAction = 'Two-sided order matching with balanced delta rotation.';
    priceResponse = 'Oscillation around Point of Control (POC).';
    nextPriceArea = `${formatPrice(volumeProfile.poc, symbol)} (POC)`;
    invalidation = 'Sudden volume spike breaking value area boundaries.';
    confirmationRequired = 'Liquidity sweep at session extremes.';
    confidence = 65;
    whyReasons.push('Price is trading within the 70% value area.');
    whyReasons.push('Order flow shows balanced two-sided auction with no clear dominant absorption.');
  }

  return {
    q1_priceLocation: {
      relativeToValue,
      distanceToPOC,
      distanceToVWAP,
      nearestHVN,
      nearestLVN,
      summary: q1Summary,
    },
    q2_marketAction: {
      primaryState,
      mmxmPhase,
      m1Structure,
      m5Context,
      m15Trend,
      h1Macro,
      summary: q2Summary,
    },
    q3_aggression: {
      dominantSide,
      buyAggressionRatio: Number(buyAggRatio.toFixed(2)),
      sellAggressionRatio: Number(sellAggRatio.toFixed(2)),
      candleDelta: Number(currentCandle.delta.toFixed(2)),
      cvdDivergence,
      summary: q3Summary,
    },
    q4_priceResponse: {
      isDisplacing,
      isAbsorbing,
      absorptionType,
      efficiency,
      summary: q4Summary,
    },
    q5_liquidityTarget: {
      sweptSide,
      nextTargetObjective,
      restingDOMPool,
      summary: q5Summary,
    },
    q6_immediatePrecedingSequence: {
      sequence,
      summary: q6Summary,
    },
    q7_nextProbableState: {
      continuationProbability: continuationProb,
      pullbackProbability: pullbackProb,
      reversalProbability: reversalProb,
      balanceProbability: balanceProb,
      primaryHypothesis,
      summary: q7Summary,
    },
    marketBehavior: {
      currentBehavior,
      orderFlowAction,
      priceResponse,
      mostLikelyNextBehavior,
      whyReasons,
      confirmationRequired,
      invalidation,
      nextPriceArea,
      confidence,
      refillState,
      absorptionState,
    },
  };
}

// Generate the authoritative 15-Minute / 1-Minute Scalping Signal with Auto TP & SL
export function generateScalpingSignal(
  symbol: TradingSymbol,
  timeframe: '1m' | '5m' | '15m',
  candlesM1: Candle[],
  candlesM5: Candle[],
  candlesM15: Candle[],
  candlesH1: Candle[],
  volumeProfile: VolumeProfileData,
  domSnapshot: DOMSnapshot | null
): ScalpingSignal {
  const sevenQ = evaluateSevenQuestions(symbol, candlesM1, candlesM5, candlesM15, candlesH1, volumeProfile, domSnapshot);
  const currentCandle = candlesM1[candlesM1.length - 1];
  const currentPrice = currentCandle?.close || volumeProfile.poc;
  const tickSize = getTickSize(symbol);

  // ATR & Local Extremes for Institutional SL / TP Anchor
  const recentCandles = candlesM1.slice(-15);
  const avgRange = recentCandles.length > 0 ? recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / recentCandles.length : tickSize * 20;
  const recentLow = recentCandles.length > 0 ? Math.min(...recentCandles.map((c) => c.low)) : currentPrice - tickSize * 15;
  const recentHigh = recentCandles.length > 0 ? Math.max(...recentCandles.map((c) => c.high)) : currentPrice + tickSize * 15;

  let signalAction: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
  let setupName = 'Market Balanced - Standing Aside (No High-Probability Setup)';
  let confidence = 50;
  let setupQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let reason = 'Price inside 70% Value Area without institutional sweep or absorption. Preserving capital until high-probability liquidity interaction occurs.';
  let invalidation = 'Price prints and sustains outside Value Area boundaries.';

  // High Confluence Criteria
  const hasSellSideSweep = sevenQ.q5_liquidityTarget.sweptSide === 'SELL_SIDE';
  const hasBuySideSweep = sevenQ.q5_liquidityTarget.sweptSide === 'BUY_SIDE';
  const hasBuyerAbsorption = sevenQ.q4_priceResponse.absorptionType === 'BUYER_ABSORPTION' || sevenQ.q3_aggression.cvdDivergence === 'BULLISH_DIVERGENCE';
  const hasSellerAbsorption = sevenQ.q4_priceResponse.absorptionType === 'SELLER_ABSORPTION' || sevenQ.q3_aggression.cvdDivergence === 'BEARISH_DIVERGENCE';

  const isBullishReversal =
    (hasSellSideSweep || sevenQ.q1_priceLocation.relativeToValue === 'BELOW_VAL') && hasBuyerAbsorption;

  const isBearishReversal =
    (hasBuySideSweep || sevenQ.q1_priceLocation.relativeToValue === 'ABOVE_VAH') && hasSellerAbsorption;

  const isBullishContinuation =
    sevenQ.q7_nextProbableState.primaryHypothesis === 'CONTINUATION' &&
    sevenQ.q2_marketAction.m1Structure === 'BULLISH' &&
    sevenQ.q2_marketAction.m5Context === 'BULLISH' &&
    sevenQ.q4_priceResponse.isDisplacing &&
    sevenQ.q3_aggression.dominantSide === 'BUYERS';

  const isBearishContinuation =
    sevenQ.q7_nextProbableState.primaryHypothesis === 'CONTINUATION' &&
    sevenQ.q2_marketAction.m1Structure === 'BEARISH' &&
    sevenQ.q2_marketAction.m5Context === 'BEARISH' &&
    sevenQ.q4_priceResponse.isDisplacing &&
    sevenQ.q3_aggression.dominantSide === 'SELLERS';

  let stopLoss = currentPrice;
  let takeProfit1 = currentPrice;
  let takeProfit2 = currentPrice;

  if (isBullishReversal) {
    signalAction = 'BUY';
    setupName = 'A+ Bullish Absorption & Sell-Side Liquidity Sweep Reversal';
    confidence = 89;
    setupQuality = 'HIGH';
    reason = `Sellers aggressive below VAL / swing low without downward displacement. Passive bid replenishment & buyer absorption confirmed with CVD bullish divergence.`;

    const slDist = Math.max(currentPrice - recentLow + tickSize * 10, avgRange * 1.5);
    stopLoss = currentPrice - slDist;
    takeProfit1 = Math.max(volumeProfile.poc > currentPrice ? volumeProfile.poc : currentPrice + slDist * 1.8, currentPrice + slDist * 1.5);
    takeProfit2 = Math.max(volumeProfile.vah > takeProfit1 ? volumeProfile.vah : currentPrice + slDist * 3.2, currentPrice + slDist * 2.8);
    invalidation = `Price closes 1-min candle below absorption low at ${formatPrice(stopLoss, symbol)}.`;

  } else if (isBearishReversal) {
    signalAction = 'SELL';
    setupName = 'A+ Bearish Absorption & Buy-Side Liquidity Sweep Reversal';
    confidence = 88;
    setupQuality = 'HIGH';
    reason = `Buyers aggressive above VAH / swing high without upward expansion. Passive ask replenishment & seller absorption confirmed with CVD bearish divergence.`;

    const slDist = Math.max(recentHigh - currentPrice + tickSize * 10, avgRange * 1.5);
    stopLoss = currentPrice + slDist;
    takeProfit1 = Math.min(volumeProfile.poc < currentPrice ? volumeProfile.poc : currentPrice - slDist * 1.8, currentPrice - slDist * 1.5);
    takeProfit2 = Math.min(volumeProfile.val < takeProfit1 ? volumeProfile.val : currentPrice - slDist * 3.2, currentPrice - slDist * 2.8);
    invalidation = `Price closes 1-min candle above absorption high at ${formatPrice(stopLoss, symbol)}.`;

  } else if (isBullishContinuation) {
    signalAction = 'BUY';
    setupName = 'A Bullish MMXM Expansion + Order Flow Alignment';
    confidence = 82;
    setupQuality = 'HIGH';
    reason = `M1/M5 bullish structure alignment with positive delta displacement and strong DOM bid support.`;

    const slDist = Math.max(avgRange * 1.5, tickSize * 15);
    stopLoss = currentPrice - slDist;
    takeProfit1 = currentPrice + slDist * 1.6;
    takeProfit2 = currentPrice + slDist * 3.0;
    invalidation = `Loss of developing VWAP support at ${formatPrice(stopLoss, symbol)}.`;

  } else if (isBearishContinuation) {
    signalAction = 'SELL';
    setupName = 'A Bearish MMXM Repricing + Order Flow Alignment';
    confidence = 81;
    setupQuality = 'HIGH';
    reason = `M1/M5 bearish structure alignment with negative delta displacement and heavy ask pressure.`;

    const slDist = Math.max(avgRange * 1.5, tickSize * 15);
    stopLoss = currentPrice + slDist;
    takeProfit1 = currentPrice - slDist * 1.6;
    takeProfit2 = currentPrice - slDist * 3.0;
    invalidation = `Acceptance back above developing VWAP at ${formatPrice(stopLoss, symbol)}.`;

  } else {
    // If no A or A+ setup exists, default strictly to WAIT to protect capital
    signalAction = 'WAIT';
    setupName = 'Market Balanced - Standing Aside (No High-Probability Setup)';
    confidence = 50;
    setupQuality = 'LOW';
    reason = 'Price oscillating inside 70% Value Area without institutional sweep or absorption. Preserving capital until high-probability liquidity interaction occurs.';
    invalidation = 'Break of Value Area boundaries (VAH/VAL) with displacement.';

    const defaultSlDist = Math.max(avgRange * 1.5, tickSize * 15);
    stopLoss = currentPrice - defaultSlDist;
    takeProfit1 = currentPrice + defaultSlDist * 1.5;
    takeProfit2 = currentPrice + defaultSlDist * 2.8;
  }

  const risk = Math.abs(currentPrice - stopLoss);
  const reward = Math.abs(takeProfit1 - currentPrice);
  const riskRewardRatio = Number((reward / (risk || 1)).toFixed(2));

  return {
    id: `sig_${symbol}_${timeframe}_${Date.now()}`,
    timestamp: Date.now(),
    symbol,
    timeframe,
    signal: signalAction,
    setupName,
    confidence,
    marketState: `${sevenQ.q2_marketAction.primaryState} (${sevenQ.q2_marketAction.mmxmPhase})`,
    locationDesc: sevenQ.q1_priceLocation.summary,
    orderFlowDesc: sevenQ.q3_aggression.summary,
    deltaDesc: `Candle Delta: ${currentCandle?.delta.toFixed(2)} | Divergence: ${sevenQ.q3_aggression.cvdDivergence}`,
    footprintDesc: `Stacked Imbalances & POC at ${formatPrice(volumeProfile.poc, symbol)}`,
    domDesc: sevenQ.q5_liquidityTarget.restingDOMPool,
    structureDesc: `M1: ${sevenQ.q2_marketAction.m1Structure} | M5: ${sevenQ.q2_marketAction.m5Context} | M15: ${sevenQ.q2_marketAction.m15Trend} | H1: ${sevenQ.q2_marketAction.h1Macro}`,
    volumeProfileDesc: `VAH: ${formatPrice(volumeProfile.vah, symbol)} | VAL: ${formatPrice(volumeProfile.val, symbol)} | POC: ${formatPrice(volumeProfile.poc, symbol)}`,
    liquidityDesc: sevenQ.q5_liquidityTarget.summary,
    setupQuality,
    currentPrice,
    entryZone: {
      min: Number(Math.min(currentPrice, currentPrice - tickSize * 3).toFixed(getPriceDecimals(symbol))),
      max: Number(Math.max(currentPrice, currentPrice + tickSize * 3).toFixed(getPriceDecimals(symbol))),
    },
    takeProfit1: Number(takeProfit1.toFixed(getPriceDecimals(symbol))),
    takeProfit2: Number(takeProfit2.toFixed(getPriceDecimals(symbol))),
    stopLoss: Number(stopLoss.toFixed(getPriceDecimals(symbol))),
    riskRewardRatio,
    action: signalAction,
    reason,
    invalidation,
    sevenQuestions: sevenQ,
    status: signalAction === 'WAIT' ? 'EXPIRED' : 'ACTIVE',
  };
}
