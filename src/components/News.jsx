import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import { Clock, User, ArrowRight, Newspaper, Loader2, RefreshCw } from 'lucide-react';
import SEO from './SEO';

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch the CSV URL from environment variables
      const csvUrl = import.meta.env.VITE_NEWS_CSV_URL;
      
      if (!csvUrl) {
        throw new Error('News data source not configured. Please add VITE_NEWS_CSV_URL to your .env file.');
      }

      const response = await fetch(csvUrl, { cache: 'no-store' });
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Sort by Date descending
          const sortedData = results.data.sort((a, b) => {
            return new Date(b.Date || 0) - new Date(a.Date || 0);
          });
          setArticles(sortedData);
          setLoading(false);
        },
        error: (error) => {
          setError(error.message);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
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
    if (article.ID) return article.ID;
    return encodeURIComponent(article.Title.replace(/\s+/g, '-').toLowerCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Industry Insights & News" description="Stay updated with the latest announcements, industry insights, and updates from Urbanspan Infrastructure." />
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h2 className="font-heading text-4xl font-bold text-brand-navy flex items-center gap-3">
            <Newspaper className="w-10 h-10 text-brand-steel" />
            Industry Insights
          </h2>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Stay updated with the latest announcements, industry insights, and updates from Urbanspan Infrastructure.
          </p>
        </div>
        <button 
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-brand-steel" />
          <p>Loading latest news...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center justify-center py-12">
          <p className="font-medium mb-2">Unable to load news at this time.</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Newspaper className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No news published yet</h3>
          <p className="text-slate-500">Check back soon for the latest updates from our team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <Link to={`/news/${getArticleSlug(article)}`} key={article.ID || idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group cursor-pointer">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs font-semibold text-brand-steel mb-4 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(article.Date)}</span>
                </div>
                
                <h3 className="font-heading text-xl font-bold text-brand-navy mb-3 line-clamp-2 group-hover:text-brand-steel transition-colors">
                  {article.Title}
                </h3>
                
                <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                  {article.Content}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    {article.Author}
                  </div>
                  <span className="text-brand-steel group-hover:text-brand-navy font-bold text-sm flex items-center gap-1 transition-colors">
                    Read More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
