import React from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import DynamicForm from './DynamicForm';

export default function ContactUs({ customerUser }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="font-heading text-4xl font-bold text-brand-navy mb-4">Get In Touch</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Have a question or need a custom quote? Reach out to our team of steel experts and we'll get back to you promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info and Map */}
        <div className="flex flex-col gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-heading text-2xl font-bold text-brand-navy mb-6">Contact Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-steel/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-brand-steel" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Corporate Office</h4>
                  <p className="text-slate-600">Urbanspan Infrastructure Pvt. Ltd.<br/>115 Scheme 97, Vanijyak Mandi<br/>Indore, Madhya Pradesh 452009</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-steel/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-brand-steel" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Phone</h4>
                  <p className="text-slate-600">094259 22225</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-steel/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-brand-steel" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Email</h4>
                  <p className="text-slate-600">urbanspaninfra@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm h-[300px] overflow-hidden">
             {/* Embedded Google Map */}
            <iframe 
              src="https://maps.google.com/maps?q=22.663998,75.821283&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0, borderRadius: '12px' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Office Location"
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
