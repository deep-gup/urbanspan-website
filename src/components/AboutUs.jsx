import React from 'react';
import { ShieldCheck, Award, Factory, Users, Target, Building, MapPin, TrendingUp, CheckCircle, Briefcase } from 'lucide-react';
import SEO from './SEO';

export default function AboutUs() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Urbanspan Infrastructure",
    "description": "45 years of legacy in primary steel sales and distribution across Central India. A Gupta & Sons enterprise delivering BIS certified steel products.",
    "mainEntity": {
      "@type": "Organization",
      "name": "Urbanspan Infrastructure Private Limited",
      "foundingDate": "1981",
      "founder": {
        "@type": "Person",
        "name": "Ashok Gupta"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "115 Scheme 97, Vanijyak Mandi",
        "addressLocality": "Indore",
        "addressRegion": "Madhya Pradesh",
        "postalCode": "452009",
        "addressCountry": "IN"
      }
    }
  };

  return (
    <div className="py-24 bg-slate-50">
      <SEO 
        title="About Us | 45+ Years of Primary Steel Distribution Legacy"
        description="Discover Urbanspan Infrastructure Pvt Ltd (A Gupta & Sons Enterprise). Over 45 years of steel excellence, supplying BIS-certified Fe-550D TMT rebars & structural steel across Central India."
        keywords="about Urbanspan Infrastructure, Gupta and Sons Indore, steel distributor history, primary steel Madhya Pradesh, Ashok Gupta steel"
        url="https://urbanspaninfra.co.in/about-us"
        structuredData={aboutSchema}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-steel/10 text-brand-steel text-sm font-bold mb-6">
            <Award className="w-4 h-4" /> A Gupta & Sons Enterprise
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-brand-navy mb-6">
            A Legacy of Steel Excellence
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            With 45 years of steadfast presence in the steel business, we have earned widespread recognition and respect throughout Central India and beyond. We are among the first movers in the sales and distribution of primary steel.
          </p>
        </div>

        {/* What We Do Section */}
        <div className="bg-white rounded-3xl p-10 lg:p-16 border border-slate-200 shadow-sm mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="font-heading text-3xl font-black text-brand-navy mb-6">What We Do</h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-brand-steel/10 p-2 rounded-lg">
                    <Factory className="w-5 h-5 text-brand-steel" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy">Premium Products</h4>
                    <p className="text-slate-600">We deliver the best quality rebars, pipes, and structural steel. We also deal in INGOTS and BILLETS.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-brand-steel/10 p-2 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-brand-steel" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy">Quality Assurance</h4>
                    <p className="text-slate-600">While we help you choose the best products, we also ensure every product strictly conforms to BIS standards.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 bg-brand-steel/10 p-2 rounded-lg">
                    <Target className="w-5 h-5 text-brand-steel" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy">Timely Delivery</h4>
                    <p className="text-slate-600">Our robust dealer network and logistics ensure timely product delivery and seamless supply chain management.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img src="/images/hero_banner.jpg" alt="Steel Production" className="rounded-2xl shadow-xl w-full object-cover h-[400px]" />
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-24">
          <h3 className="font-heading text-3xl font-black text-center text-brand-navy mb-12">Our Core Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "Integrity", desc: "We uphold the highest standards of honesty, transparency, and ethical conduct. Our word is our bond." },
              { icon: Award, title: "Quality Excellence", desc: "We believe in delivering nothing short of excellence, meeting stringent quality benchmarks." },
              { icon: Users, title: "Customer-Centric", desc: "Our customers are at the heart of everything we do. We tailor solutions to exceed expectations." },
              { icon: TrendingUp, title: "Innovation", desc: "We embrace change and continuously seek innovative ways to improve processes and products." },
              { icon: Briefcase, title: "Respect & Collaboration", desc: "We value diversity and treat everyone with respect. Collaborative teamwork fuels our growth." },
              { icon: MapPin, title: "Wide Presence", desc: "Strong presence across MP, Rajasthan, Gujarat, UP, and Maharashtra through faithful dealers." }
            ].map((value, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-steel/10 flex items-center justify-center mb-6">
                  <value.icon className="w-6 h-6 text-brand-steel" />
                </div>
                <h4 className="text-xl font-bold text-brand-navy mb-3">{value.title}</h4>
                <p className="text-slate-600 leading-relaxed text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Team */}
        <div className="bg-brand-navy-dark rounded-3xl p-10 lg:p-16 text-white mb-24 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-steel-dark/20 blur-[100px] rounded-full pointer-events-none"></div>
           <div className="relative z-10">
             <div className="text-center mb-16">
               <h3 className="font-heading text-3xl sm:text-4xl font-black mb-4">Leadership Team</h3>
               <p className="text-slate-300 max-w-2xl mx-auto">Our team embodies our commitment to quality, reliability, and continuous improvement.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl text-center">
                 <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                   <Users className="w-10 h-10 text-brand-steel-light" />
                 </div>
                 <h4 className="text-xl font-bold mb-1">Ashok Gupta</h4>
                 <p className="text-brand-steel-light text-sm font-medium mb-4">Director</p>
                 <p className="text-slate-300 text-sm">45 years of experience. The driving force behind our growth, building distribution networks from scratch.</p>
               </div>
               
               <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl text-center">
                 <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                   <Users className="w-10 h-10 text-brand-steel-light" />
                 </div>
                 <h4 className="text-xl font-bold mb-1">Hitesh Gupta</h4>
                 <p className="text-brand-steel-light text-sm font-medium mb-4">Director</p>
                 <p className="text-slate-300 text-sm">Two decades of industry wisdom. Unmatched expertise in primary steel with a vast network of relationships.</p>
               </div>
               
               <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl text-center">
                 <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                   <Users className="w-10 h-10 text-brand-steel-light" />
                 </div>
                 <h4 className="text-xl font-bold mb-1">Akash Gupta</h4>
                 <p className="text-brand-steel-light text-sm font-medium mb-4">Director</p>
                 <p className="text-slate-300 text-sm">15 years of experience in secondary steel and strategic marketing. His innovative approach expands our market presence.</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-3xl mx-auto">
               <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl text-center">
                 <h4 className="text-lg font-bold mb-1">Sourabh Khandelwal</h4>
                 <p className="text-brand-steel-light text-sm font-medium mb-2">Finance & Operations</p>
                 <p className="text-slate-300 text-xs">Over 10 years of experience in the steel industry, bringing deep expertise in both financial strategy and operational efficiency.</p>
               </div>
               <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl text-center">
                 <h4 className="text-lg font-bold mb-1">Deepesh Gupta</h4>
                 <p className="text-brand-steel-light text-sm font-medium mb-2">Director</p>
                 <p className="text-slate-300 text-xs">With 6 years of focused experience in the steel sector, driving our sales and marketing efforts to new heights.</p>
               </div>
             </div>
           </div>
        </div>

        {/* Growth Stats */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h3 className="font-heading text-3xl font-black text-brand-navy mb-12">A Steeled Path to Success</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-black text-brand-steel mb-2">1.5L+</div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Metric Tons Delivered</div>
              <p className="text-xs text-slate-400 mt-2">Over the past 5 years</p>
            </div>
            <div>
              <div className="text-4xl font-black text-brand-steel mb-2">45+</div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Years of Legacy</div>
              <p className="text-xs text-slate-400 mt-2">Steadfast presence in steel</p>
            </div>
            <div>
              <div className="text-4xl font-black text-brand-steel mb-2">5+</div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-500">States Covered</div>
              <p className="text-xs text-slate-400 mt-2">MP, RJ, GJ, UP, MH</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
