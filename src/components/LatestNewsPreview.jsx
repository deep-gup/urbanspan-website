import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Newspaper } from 'lucide-react';

export default function LatestNewsPreview() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const csvUrl = import.meta.env.VITE_NEWS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQtAw5mWnVAiJUNPPOLjHMCciLhcMf4feXQ9wH_ZmLIUvAWhRacvPHMY4bHyKZWusOCA4gGCymy7p9g/pub?output=csv';

        const response = await fetch(csvUrl, { cache: 'no-store' });
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const valid = (results.data || []).filter(a => 
              a?.Title && 
              a?.Content && 
              typeof a.Title === 'string' && 
              a.Title.trim().length > 0 && 
              !a.Title.includes('Page not found')
            );
            const sortedData = valid.sort((a, b) => {
              return new Date(b.Date || 0) - new Date(a.Date || 0);
            });
            setArticles(sortedData.slice(0, 3)); // Only take top 3
            setLoading(false);
          }
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getArticleSlug = (article) => {
    if (article?.ID) return String(article.ID);
    if (!article?.Title || typeof article.Title !== 'string') return 'news-article';
    return encodeURIComponent(article.Title.replace(/\s+/g, '-').toLowerCase());
  };

  if (loading || articles.length === 0) return null;

  return (
    <div className="bg-slate-50 py-16 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold text-brand-navy flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-brand-steel" />
              Latest Insights & Market News
            </h2>
            <p className="text-slate-600 mt-2 max-w-2xl text-sm">
              Stay ahead of the curve with real-time updates on steel trends and industry shifts.
            </p>
          </div>
          <Link to="/news" className="px-6 py-2.5 rounded-full bg-white border border-brand-navy text-brand-navy font-bold text-sm hover:bg-brand-navy hover:text-white transition-colors flex items-center gap-2">
            View All News <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <Link to={`/news/${getArticleSlug(article)}`} key={article.ID || idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-1">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-steel mb-3 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> {formatDate(article.Date)}
                </div>
                
                <h3 className="font-heading text-lg font-bold text-brand-navy mb-2 line-clamp-2 group-hover:text-brand-steel transition-colors">
                  {article.Title}
                </h3>
                
                <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                  {article.Content}
                </p>
                
                <div className="flex items-center justify-end mt-auto pt-4 border-t border-slate-50">
                  <span className="text-brand-steel group-hover:text-brand-navy font-bold text-sm flex items-center gap-1 transition-colors">
                    Read More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
