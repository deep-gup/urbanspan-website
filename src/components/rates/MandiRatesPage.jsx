import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, RefreshCw, BarChart3, LineChart, 
  CandlestickChart, Download, ArrowRight, MapPin, 
  Layers, Clock, Sparkles, Building2, Flame
} from 'lucide-react';
import SEO from '../SEO';
import MarketChart from './MarketChart';
import LiveRateTicker from './LiveRateTicker';
import { 
  fetchMarketRatesData, 
  getLatestSpotRates, 
  getChartSeriesData, 
  getMandiComparisonMatrix 
} from '../../services/marketRatesApi';

const COMMODITIES = [
  { key: 'Ingot', label: 'Steel Ingot', icon: Layers, desc: 'Induction furnace raw ingot' },
  { key: 'Billet', label: 'MS Billet', icon: Layers, desc: '100x100mm & 125x125mm rolling grade' },
  { key: 'TMT 550D', label: 'TMT Rebar (Fe-550D)', icon: Building2, desc: 'BIS Certified Primary/Secondary Rebars' },
  { key: 'Melting Scrap', label: 'Melting Scrap', icon: RefreshCw, desc: 'HMS 1/2 foundry melting stock' },
  { key: 'Coking Coal', label: 'Coking Coal', icon: Flame, desc: 'Imported Australian Prime Hard Coking' },
  { key: 'Structural Steel', label: 'Structural Steel', icon: Building2, desc: 'Beams, Channels, Angles, Plates' }
];

const MANDIS = ['Raipur', 'Mandi Gobindgarh', 'Durgapur', 'Jalna', 'Indore'];
const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

export default function MandiRatesPage({ embedded = false }) {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [latestRates, setLatestRates] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('Ingot');
  const [selectedMandi, setSelectedMandi] = useState('Raipur');
  const [chartType, setChartType] = useState('candlestick');
  const [timeframe, setTimeframe] = useState('1M');
  const [matrixData, setMatrixData] = useState({ mandis: [], commodities: [], matrix: [] });

  const loadData = async () => {
    setLoading(true);
    try {
      const { raw } = await fetchMarketRatesData();
      setRawData(raw);
      setLatestRates(getLatestSpotRates(raw));
      setMatrixData(getMandiComparisonMatrix(raw));
    } catch (err) {
      console.error('Failed to load market rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 180000);
    return () => clearInterval(timer);
  }, []);

  const chartSeries = React.useMemo(() => {
    return getChartSeriesData(rawData, selectedCommodity, selectedMandi, timeframe);
  }, [rawData, selectedCommodity, selectedMandi, timeframe]);

  const activeSpotRate = latestRates.find(r => 
    (r.Commodity || '').toLowerCase().trim() === selectedCommodity.toLowerCase().trim() && 
    (r.Mandi || '').toLowerCase().trim() === selectedMandi.toLowerCase().trim()
  );

  const isUp = !activeSpotRate?.Change_Amt || activeSpotRate?.Change_Amt >= 0;

  const handleExportCSV = () => {
    if (!rawData || rawData.length === 0) return;
    const headers = ['Timestamp', 'Date', 'Time_Slot', 'Commodity', 'Mandi', 'Price', 'Prev_Close', 'Change_Amt', 'Change_Pct', 'High_Session', 'Low_Session', 'Unit', 'Tax_Basis', 'Remarks'];
    const csvRows = [headers.join(',')];

    rawData.forEach(r => {
      const row = headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `urbanspan_steel_mandi_rates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={embedded ? "bg-slate-50 pb-20 pt-4" : "min-h-screen bg-slate-50 pt-24 pb-20"}>
      <SEO 
        title="Live Steel Mandi Rates & Candlestick Charts | Raipur, Gobindgarh, Indore"
        description="Track live steel mandi spot rates for Ingot, Billet, TMT Rebars, Scrap, and Coal across Raipur, Mandi Gobindgarh, Durgapur, Jalna & Indore with interactive candlestick and line charts."
      />

      <LiveRateTicker rates={latestRates} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-steel/10 text-brand-navy border border-brand-steel/20 text-xs font-bold uppercase tracking-wider mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-brand-steel" /> Official Indian Steel Mandi Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Live Mandi Rates & Financial Charts
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time daily spot price indices for primary & secondary steel across India's premier production mandis. Updated 5x daily during active trading sessions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-brand-steel text-slate-700 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-steel' : ''}`} />
              <span>Refresh Feed</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/rfq"
              className="px-4 py-2 rounded-xl bg-gradient-primary text-slate-900 font-extrabold text-xs shadow-md shadow-brand-steel/20 hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inquire at Spot Rate</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 my-6">
          {COMMODITIES.map((c) => {
            const match = latestRates.find(r => 
              (r.Commodity || '').toLowerCase().trim() === c.key.toLowerCase().trim() && 
              (r.Mandi || '').toLowerCase().trim() === selectedMandi.toLowerCase().trim()
            ) || latestRates.find(r => (r.Commodity || '').toLowerCase().trim() === c.key.toLowerCase().trim());
            const isSelected = selectedCommodity.toLowerCase() === c.key.toLowerCase();
            const changeIsUp = !match?.Change_Amt || match?.Change_Amt >= 0;

            return (
              <div
                key={c.key}
                onClick={() => setSelectedCommodity(c.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-navy text-white border-brand-navy shadow-md scale-[1.02]' 
                    : 'bg-white text-slate-800 border-slate-200 hover:border-brand-steel hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {c.label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {match?.Mandi || selectedMandi}
                  </span>
                </div>

                <div className="text-lg font-black tracking-tight mt-1">
                  {match?.Price ? `₹${Number(match.Price).toLocaleString('en-IN')}` : '₹--'}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold mt-1.5">
                  <span className={changeIsUp ? (isSelected ? 'text-emerald-300' : 'text-emerald-600') : (isSelected ? 'text-rose-300' : 'text-rose-600')}>
                    {changeIsUp ? '+' : ''}{match?.Change_Amt || 0} ({match?.Change_Pct || '0.0%'})
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedCommodity} — {selectedMandi} Mandi
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-brand-navy border border-blue-200">
                    Live Spot Benchmark
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-black text-brand-navy">
                    {activeSpotRate?.Price ? `₹${Number(activeSpotRate.Price).toLocaleString('en-IN')}` : '₹--'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">/ MT (Ex-Plant + 18% GST)</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    isUp ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isUp ? '+' : ''}{activeSpotRate?.Change_Amt || 0} ({activeSpotRate?.Change_Pct || '+0.0%'})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {MANDIS.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMandi(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedMandi === m
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setChartType('candlestick')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    chartType === 'candlestick'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CandlestickChart className="w-3.5 h-3.5 text-brand-navy" />
                  <span>Candlestick</span>
                </button>

                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    chartType === 'area'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5 text-brand-navy" />
                  <span>Area Line</span>
                </button>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {TIMEFRAMES.slice(0, 5).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      timeframe === tf
                        ? 'bg-brand-navy text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <MarketChart 
              data={chartType === 'candlestick' ? chartSeries.ohlc : chartSeries.line}
              chartType={chartType}
              commodityName={selectedCommodity}
              mandiName={selectedMandi}
              height={440}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-steel" />
              <span>
                Last Session: <b className="text-slate-800">{activeSpotRate?.Time_Slot || '06:00 PM Closing'}</b> • Session High: <b className="text-slate-800">₹{activeSpotRate?.High_Session?.toLocaleString('en-IN') || activeSpotRate?.Price?.toLocaleString('en-IN')}</b> • Low: <b className="text-slate-800">₹{activeSpotRate?.Low_Session?.toLocaleString('en-IN') || activeSpotRate?.Price?.toLocaleString('en-IN')}</b>
              </span>
            </div>
            <div>
              Sentiment: <b className="text-slate-800">{activeSpotRate?.Remarks || 'Order book balanced'}</b>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-steel" /> National Mandi Rate Arbitrage Matrix
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Cross-mandi price differentials across key secondary & primary hubs in ₹ per metric ton.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Commodity</th>
                  {matrixData.mandis.map(m => (
                    <th key={m} className="py-3.5 px-4">{m}</th>
                  ))}
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.matrix.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {row.commodity}
                    </td>
                    {matrixData.mandis.map(m => {
                      const price = row[m];
                      return (
                        <td key={m} className="py-3.5 px-4 font-bold text-slate-800">
                          {price ? (
                            <div>
                              <span>₹{Number(price).toLocaleString('en-IN')}</span>
                              {row[`${m}_change`] && (
                                <span className={`block text-[10px] ${row[`${m}_change`] >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {row[`${m}_change`] >= 0 ? '+' : ''}{row[`${m}_change`]}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 font-normal">--</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/rfq"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-2xs transition-all"
                      >
                        <span>Inquire</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-brand-navy to-brand-navy-dark rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/10 text-brand-steel-light border border-white/20 text-xs font-bold uppercase tracking-wider inline-block mb-2">
              Commercial Price Protection
            </span>
            <h3 className="text-2xl font-black tracking-tight">
              Lock in Bulk Steel Procurement at Today's Mandi Benchmarks
            </h3>
            <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
              Our Central Indore Warehousing Hub & Direct Mill dispatch network enables multi-tonnage infrastructure orders at verified mill rates with complete BIS Test Certificates.
            </p>
          </div>

          <Link
            to="/rfq"
            className="shrink-0 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <span>Request Commercial Quotation</span>
            <ArrowRight className="w-4 h-4 text-brand-navy" />
          </Link>
        </div>

      </div>
    </div>
  );
}
