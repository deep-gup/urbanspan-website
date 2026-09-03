import React from 'react';
import { MapPin, Phone, Mail, Send, Clock, CheckCircle2, Navigation, ExternalLink } from 'lucide-react';
import DynamicForm from './DynamicForm';
import SEO from './SEO';

export default function ContactUs({ customerUser }) {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Urbanspan Infrastructure Private Limited",
    "image": "https://urbanspaninfra.co.in/urbanspan-logo-large.png",
    "telephone": "+91-94259-22225",
    "email": "support@urbanspaninfra.co.in",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "115 Scheme 97, Vanijyak Mandi",
      "addressLocality": "Indore",
      "addressRegion": "Madhya Pradesh",
      "postalCode": "452009",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 22.6640369,
      "longitude": 75.8212843
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "19:00"
      }
    ],
    "url": "https://urbanspaninfra.co.in/contact"
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Contact Us & Corporate Office | Scheme 97, Indore, MP"
        description="Contact Urbanspan Infrastructure Private Limited at 115 Scheme 97, Vanijyak Mandi, Indore, MP 452009. Phone: 094259 22225. Primary steel distribution, Fe-550D TMT, and direct mill supply."
        keywords="contact Urbanspan, steel distributor Indore phone, Scheme 97 Vanijyak Mandi steel yard, Fe 550D suppliers contact, steel price quote Indore"
        url="https://urbanspaninfra.co.in/contact"
        structuredData={localBusinessSchema}
      />

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold mb-4 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Google Business Profile
        </div>
        <h1 className="font-heading text-4xl font-bold text-brand-navy mb-4">
          Contact Urbanspan Infrastructure | Indore Corporate Office &amp; Warehousing Hub
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Have a project inquiry, bulk tonnage requirement, or need a custom rate quote? Reach out to our sales engineering desk in Indore.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info and Map */}
        <div className="flex flex-col gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-2xl font-bold text-brand-navy">Contact Information</h3>
              <span className="text-xs px-2.5 py-1 bg-brand-steel/10 text-brand-steel font-bold rounded-lg">Indore HQ</span>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-steel/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-brand-steel" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Corporate Office &amp; Warehouse</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Urbanspan Infrastructure Pvt. Ltd.<br/>
                    115 Scheme 97, Vanijyak Mandi<br/>
                    Indore, Madhya Pradesh 452009, India
                  </p>
                  <a
                    href="https://maps.app.goo.gl/Nh5C821QtJ6M79589"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-steel hover:text-brand-steel-dark mt-2"
                  >
                    <Navigation className="w-3.5 h-3.5" /> View on Google Maps / Get Directions <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-steel/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-brand-steel" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Phone</h4>
                  <a href="tel:+919425922225" className="text-slate-600 hover:text-brand-steel font-medium transition-colors">
                    094259 22225 / +91 94259 22225
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-steel/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-brand-steel" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Email</h4>
                  <a href="mailto:support@urbanspaninfra.co.in" className="text-slate-600 hover:text-brand-steel font-medium transition-colors">
                    support@urbanspaninfra.co.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-steel/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-brand-steel" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Working Hours</h4>
                  <p className="text-slate-600 text-sm">
                    Monday – Saturday: 09:00 AM – 07:00 PM IST<br/>
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm h-[320px] overflow-hidden">
             {/* Verified Google Business Profile Embedded Map */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3681.725072693629!2d75.8212843!3d22.6640369!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa94fbce798dfc901%3A0xa266d7435bd641c0!2sURBANSPAN%20INFRASTRUCTURE%20PVT.%20LTD.!5e0!3m2!1sen!2sin!4v1788363879860!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0, borderRadius: '12px' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="URBANSPAN INFRASTRUCTURE PVT. LTD. Official Google Business Profile Location"
            ></iframe>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
           <DynamicForm 
              formName="contact_us" 
              title="Send us a Message" 
              subtitle="Fill out the form below and we will contact you." 
              icon={Send}
              defaultValues={customerUser ? { name: customerUser.name, email: customerUser.email, company: customerUser.company } : {}}
              customerUser={customerUser}
            />
        </div>
      </div>
    </div>
  );
}
