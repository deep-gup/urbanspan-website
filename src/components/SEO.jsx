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
      <title key="title">{fullTitle}</title>
      <meta key="meta-title" name="title" content={fullTitle} />
      <meta key="meta-description" name="description" content={description || defaultDescription} />
      {keywords && <meta key="meta-keywords" name="keywords" content={keywords} />}
      <link key="canonical" rel="canonical" href={pageUrl} />
      
      {/* Open Graph / WhatsApp / Facebook / LinkedIn */}
      <meta key="og-type" property="og:type" content={type} />
      <meta key="og-title" property="og:title" content={fullTitle} />
      <meta key="og-description" property="og:description" content={description || defaultDescription} />
      <meta key="og-url" property="og:url" content={pageUrl} />
      <meta key="og-site_name" property="og:site_name" content={siteName} />
      <meta key="og-image" property="og:image" content={ogImage} />
      <meta key="og-image-secure" property="og:image:secure_url" content={ogImage} />
      <meta key="og-image-alt" property="og:image:alt" content={fullTitle} />
      
      {/* Twitter Card */}
      <meta key="tw-card" name="twitter:card" content="summary_large_image" />
      <meta key="tw-title" name="twitter:title" content={fullTitle} />
      <meta key="tw-description" name="twitter:description" content={description || defaultDescription} />
      <meta key="tw-image" name="twitter:image" content={ogImage} />
      <meta key="tw-image-alt" name="twitter:image:alt" content={fullTitle} />

      {/* Structured Data (JSON-LD) for Search Engine Rich Snippets */}
      {structuredData && (
        <script key="schema-json-ld" type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
