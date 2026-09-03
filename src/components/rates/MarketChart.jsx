import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, AreaSeries, LineSeries } from 'lightweight-charts';

export default function MarketChart({ 
  data = [], 
  chartType = 'candlestick',
  commodityName = 'Ingot',
  mandiName = 'Raipur',
  height = 420 
}) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 12,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      },
      grid: {
        vertLines: { color: 'rgba(226, 232, 240, 0.6)' },
        horzLines: { color: 'rgba(226, 232, 240, 0.6)' }
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#002060',
          width: 1,
          style: 3,
          labelBackgroundColor: '#002060'
        },
        horzLine: {
          color: '#002060',
          width: 1,
          style: 3,
          labelBackgroundColor: '#002060'
        }
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1
        }
      },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: false
      }
    });

    chartInstanceRef.current = chart;

    if (chartType === 'candlestick') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444'
      });
      candleSeries.setData(data);
    } else if (chartType === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 32, 96, 0.35)',
        bottomColor: 'rgba(0, 32, 96, 0.02)',
        lineColor: '#002060',
        lineWidth: 2.5
      });
      areaSeries.setData(data);
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#002060',
        lineWidth: 2.5
      });
      lineSeries.setData(data);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [data, chartType, height]);

  return (
    <div className="w-full relative">
      <div ref={chartContainerRef} className="w-full rounded-2xl overflow-hidden" />
      {(!data || data.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 rounded-2xl text-xs font-semibold text-slate-500">
          No historical candle data recorded for {commodityName} ({mandiName})
        </div>
      )}
    </div>
  );
}
