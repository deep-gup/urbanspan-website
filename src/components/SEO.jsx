import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, url, type = 'website' }) {
  const siteName = 'Urbanspan Infrastructure Pvt. Ltd.';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Primary Steel Distribution & Industrial Warehousing Network. Supplying structural steel, TMT Rebars, and heavy industrial metals.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={url || 'https://urbanspaninfra.co.in'} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={url || 'https://urbanspaninfra.co.in'} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
    </Helmet>
  );
}
