'use client';

import { DOMSnapshot, TradingSymbol } from '@/types/trading';
import { getTickSize } from '@/lib/orderflow-engine';
import { Layers } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface DOMHeatmapProps {
  symbol: TradingSymbol;
  dom: DOMSnapshot | null;
  currentPrice: number;
}

export const DOMHeatmap: React.FC<DOMHeatmapProps> = ({ symbol, dom, currentPrice }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Keep history of DOM states
  const historyRef = useRef<{ timestamp: number; bids: Map<number, number>; asks: Map<number, number>; price: number }[]>([]);
  
  const currentPriceRef = useRef(currentPrice);

  useEffect(() => {
    currentPriceRef.current = currentPrice;
  }, [currentPrice]);

  const drawHeatmap = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match container exactly
    const rect = container.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const history = historyRef.current;
    if (history.length === 0) return;

    const tickSize = getTickSize(symbol);
    
    // Determine price range for Y axis
    let minPrice = currentPriceRef.current * 0.9995;
    let maxPrice = currentPriceRef.current * 1.0005;
    
    // Scan history to find max liquidity for color scaling
    let maxQty = 1;
    history.forEach(h => {
      h.bids.forEach(q => { if (q > maxQty) maxQty = q; });
      h.asks.forEach(q => { if (q > maxQty) maxQty = q; });
    });

    const priceRange = maxPrice - minPrice;
    const colWidth = Math.max(2, canvas.width / 150);

    // Draw Heatmap Cells
    history.forEach((h, colIdx) => {
      const x = canvas.width - (history.length - colIdx) * colWidth;
      
      // Bids (Green scale)
      h.bids.forEach((qty, price) => {
        if (price >= minPrice && price <= maxPrice) {
          const y = canvas.height - ((price - minPrice) / priceRange) * canvas.height;
          const intensity = Math.min(1, qty / maxQty);
          // Flowsurface-style heat map: dark background, bright for high liquidity
          ctx.fillStyle = `rgba(16, 185, 129, ${intensity})`; // Emerald
          ctx.fillRect(x, y - 2, colWidth + 0.5, 4);
        }
      });
      
      // Asks (Red scale)
      h.asks.forEach((qty, price) => {
        if (price >= minPrice && price <= maxPrice) {
          const y = canvas.height - ((price - minPrice) / priceRange) * canvas.height;
          const intensity = Math.min(1, qty / maxQty);
          ctx.fillStyle = `rgba(244, 63, 94, ${intensity})`; // Rose
          ctx.fillRect(x, y - 2, colWidth + 0.5, 4);
        }
      });
    });

    // Draw Price Line (Last Traded Price path)
    ctx.beginPath();
    ctx.strokeStyle = '#22d3ee'; // Cyan
    ctx.lineWidth = 1.5;
    
    history.forEach((h, colIdx) => {
      const x = canvas.width - (history.length - colIdx) * colWidth + (colWidth / 2);
      const y = canvas.height - ((h.price - minPrice) / priceRange) * canvas.height;
      if (colIdx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw current price glow dot
    if (history.length > 0) {
      const last = history[history.length - 1];
      const x = canvas.width - (colWidth / 2);
      const y = canvas.height - ((last.price - minPrice) / priceRange) * canvas.height;
      
      ctx.beginPath();
      ctx.fillStyle = '#22d3ee';
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [symbol]);

  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => drawHeatmap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawHeatmap]);

  useEffect(() => {
    if (!dom) return;
    
    // Store current state in history
    const bidsMap = new Map<number, number>();
    const asksMap = new Map<number, number>();
    
    dom.bids.forEach(([p, q]) => bidsMap.set(p, q));
    dom.asks.forEach(([p, q]) => asksMap.set(p, q));
    
    // Only push if timestamp is different to avoid duplicate entries for the exact same DOM snapshot
    const lastHistory = historyRef.current[historyRef.current.length - 1];
    if (lastHistory && lastHistory.timestamp === dom.timestamp) return;

    historyRef.current.push({
      timestamp: dom.timestamp,
      bids: bidsMap,
      asks: asksMap,
      price: currentPriceRef.current
    });
    
    // Keep last 150 points for visualization
    if (historyRef.current.length > 150) {
      historyRef.current.shift();
    }
    
    drawHeatmap();
  }, [dom, drawHeatmap]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 font-mono text-xs flex items-center gap-1.5 text-slate-200 font-bold">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>FLOWSURFACE: LIMIT ORDER BOOK HEATMAP</span>
      </div>
      
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 block w-full h-full"
        />
        
        {/* Overlay Current Price */}
        <div className="absolute left-2 top-2 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-cyan-400 font-bold shadow">
          {currentPrice.toFixed(getTickSize(symbol) < 0.1 ? 2 : 1)}
        </div>
      </div>
    </div>
  );
};
