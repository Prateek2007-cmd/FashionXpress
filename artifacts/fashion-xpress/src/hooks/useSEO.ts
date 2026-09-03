/**
 * useSEO — lightweight per-page head manager.
 *
 * Mutates document.title, <meta name="description">, canonical, og:title,
 * og:description, og:url, twitter:title, twitter:description.
 * Zero visual impact; restored to defaults on unmount.
 */
import { useEffect } from 'react';

const SITE   = 'https://www.thefashionxpress.com';
const DEF_TITLE = 'The Fashion Xpress (TFX) — Premium Home Fashion Visits';
const DEF_DESC  = 'The Fashion Xpress brings designer fashion to your doorstep. Book a personal home visit and try premium outfits before you buy.';

function setMeta(name: string, value: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

interface SEOProps {
  title: string;
  description: string;
  path: string;          // e.g. '/book-visit'  (no trailing slash)
}

export function useSEO({ title, description, path }: SEOProps) {
  useEffect(() => {
    const canonicalUrl = `${SITE}${path === '/' ? '' : path}`;

    document.title = title;
    setMeta('description', description);
    setCanonical(canonicalUrl);
    setMeta('og:title',       title,          'property');
    setMeta('og:description', description,    'property');
    setMeta('og:url',         canonicalUrl,   'property');
    setMeta('twitter:title',       title,       'name');
    setMeta('twitter:description', description, 'name');

    // Restore on unmount
    return () => {
      document.title = DEF_TITLE;
      setMeta('description', DEF_DESC);
      setCanonical(SITE);
      setMeta('og:title',       DEF_TITLE, 'property');
      setMeta('og:description', DEF_DESC,  'property');
      setMeta('og:url',         SITE,      'property');
      setMeta('twitter:title',       DEF_TITLE, 'name');
      setMeta('twitter:description', DEF_DESC,  'name');
    };
  }, [title, description, path]);
}
