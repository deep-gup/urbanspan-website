import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { useParams, Link } from 'react-router-dom';
import { Clock, User, ArrowLeft, Loader2, Factory, Languages } from 'lucide-react';
import SEO from './SEO';

export default function NewsArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHindi, setShowHindi] = useState(false);
  const [hindiTranslation, setHindiTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const csvUrl = import.meta.env.VITE_NEWS_CSV_URL;
        if (!csvUrl) throw new Error('News data source not configured.');

        const response = await fetch(csvUrl, { cache: 'no-store' });
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const found = results.data.find(a => 
              (a.ID && a.ID === id) || 
              (!a.ID && encodeURIComponent(a.Title.replace(/\s+/g, '-').toLowerCase()) === id)
            );
            
            if (found) {
              setArticle(found);
            } else {
              setError('Article not found.');
            }
            setLoading(false);
          },
          error: (err) => {
            setError(err.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const translateText = async (text, targetLang = 'hi') => {
    if (!text) return '';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      return data[0].map(item => item[0]).join('');
    } catch (e) {
      console.error(e);
      return text;
    }
  };

  const handleTranslateToggle = async () => {
    if (showHindi) {
      setShowHindi(false);
      return;
    }
    if (hindiTranslation) {
      setShowHindi(true);
      return;
    }
    setTranslating(true);
    try {
      const transTitle = await translateText(article.Title);
      const paragraphs = article.Content.split('\n').filter(p => p.trim());
      const transParagraphs = await Promise.all(paragraphs.map(p => translateText(p)));
      const transContent = transParagraphs.join('\n\n');
      setHindiTranslation({ Title: transTitle, Content: transContent });
      setShowHindi(true);
    } catch (err) {
      console.error("Translation failed", err);
    } finally {
      setTranslating(false);
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((paragraph, idx) => (
      paragraph.trim() ? <p key={idx} className="mb-4">{paragraph}</p> : null
    ));
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 flex flex-col items-center justify-center min-h-screen text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-brand-steel" />
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-100 max-w-md text-center">
          <p className="font-bold text-lg mb-2">Error</p>
          <p className="opacity-80 mb-6">{error || 'Article not found.'}</p>
          <Link to="/news" className="text-brand-steel hover:underline font-medium">← Back to News</Link>
        </div>
      </div>
    );
  }

  const currentTitle = showHindi && hindiTranslation ? hindiTranslation.Title : article.Title;
  const currentContent = showHindi && hindiTranslation ? hindiTranslation.Content : article.Content;

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <SEO 
        title={currentTitle} 
        description={currentContent.substring(0, 150) + '...'} 
        type="article"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/news" className="inline-flex items-center gap-2 text-brand-steel hover:text-brand-navy font-semibold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>
        
        <article className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-steel" /> {formatDate(article.Date)}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-brand-steel" /> {article.Author}</span>
              </div>
              <button 
                onClick={handleTranslateToggle}
                disabled={translating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${showHindi ? 'bg-brand-steel text-white hover:bg-brand-navy' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} disabled:opacity-50`}
              >
                {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                {showHindi ? 'View English' : 'Translate to Hindi'}
              </button>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-brand-navy mb-10 leading-tight">
              {currentTitle}
            </h1>
            
            <div className="prose prose-lg prose-slate prose-brand max-w-none text-slate-600 prose-p:leading-relaxed">
              {renderContent(currentContent)}
            </div>
          </div>
        </article>

        {/* CTA Section */}
        <div className="bg-brand-navy-dark rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-steel rounded-full blur-[100px] opacity-30 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Factory className="w-12 h-12 text-brand-steel mx-auto mb-6" />
            <h3 className="font-heading text-2xl sm:text-3xl font-bold mb-4">Ready to reinforce your next big project?</h3>
            <p className="text-slate-300 mb-8">Get instant bulk pricing on premium structural steel and TMT rebars.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/rfq" className="w-full sm:w-auto px-8 py-3 bg-brand-steel hover:bg-brand-steel-light text-white font-bold rounded-full transition-transform hover:scale-105">
                Request a Quote
              </Link>
              <Link to="/contact" className="w-full sm:w-auto px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full backdrop-blur-sm transition-colors border border-white/20">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
