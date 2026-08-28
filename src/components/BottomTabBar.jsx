import React from 'react';
import { Link } from 'react-router-dom';
import { Home, PackageSearch, FileText, User, MessageSquare, Newspaper } from 'lucide-react';

export default function BottomTabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'products', icon: PackageSearch, label: 'Products' },
    { id: 'rfq', icon: FileText, label: 'Quote' },
    { id: 'news', icon: Newspaper, label: 'News' },
    { id: 'portal', icon: User, label: 'Portal' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          const path = tab.id === 'home' ? '/' : `/${tab.id}`;
          return (
            <Link
              key={tab.id}
              to={path}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:bg-slate-100 transition-colors ${
                isActive ? 'text-brand-steel' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
