import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  url, 
  image, 
  type = 'website',
  keywords,
  structuredData
}) {
  const siteName = 'Urbanspan Infrastructure Pvt. Ltd.';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Primary Steel Distribution & Industrial Warehousing Network. Supplying structural steel, TMT Rebars, and heavy industrial metals.';
  const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://urbanspaninfra.co.in');
  
  // Format image URL to absolute if relative
  let ogImage = image || 'https://urbanspaninfra.co.in/images/hero_banner.jpg';
  if (ogImage && ogImage.startsWith('/')) {
    ogImage = `https://urbanspaninfra.co.in${ogImage}`;
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={pageUrl} />
      
      {/* Open Graph / WhatsApp / Facebook / LinkedIn */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Structured Data (JSON-LD) for Search Engine Rich Snippets */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
