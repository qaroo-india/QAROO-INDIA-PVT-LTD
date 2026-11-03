import { useEffect } from 'react';
import { SITE_URL } from '../data/site.js';

const DEFAULT_TITLE = 'Qaroo India Private Limited - Business Solutions & Career-Ready Learning';
const DEFAULT_DESC =
  'Qaroo India Private Limited builds digital solutions for businesses - CRM, marketing, design, software, strategy - and career-ready IT learning programs. Coimbatore & Chennai.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/logos/qaroo-logo.jpg`;

function setMeta(attrName, attrKey, content) {
  let el = document.head.querySelector(`meta[${attrName}="${attrKey}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrKey);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function Seo({ title, description, path, image, jsonLd, jsonLdId = 'page-schema' }) {
  useEffect(() => {
    const t = title || DEFAULT_TITLE;
    const d = description || DEFAULT_DESC;
    const url = `${SITE_URL}${path || '/'}`;
    const ogImage = image || DEFAULT_OG_IMAGE;

    document.title = t;
    setMeta('name', 'description', d);
    setMeta('property', 'og:title', t);
    setMeta('property', 'og:description', d);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', ogImage);
    setMeta('name', 'twitter:title', t);
    setMeta('name', 'twitter:description', d);
    setMeta('name', 'twitter:image', ogImage);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, path, image]);

  // Structured data. Injected as a real <script> in <head> because a script
  // element created through innerHTML is never executed, and removed on unmount
  // so a route change cannot leave another page's schema behind.
  useEffect(() => {
    if (!jsonLd) return undefined;
    const selector = `script[data-schema="${jsonLdId}"]`;
    document.head.querySelector(selector)?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', jsonLdId);
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.head.querySelector(selector)?.remove();
    };
  }, [jsonLd, jsonLdId]);

  return null;
}
