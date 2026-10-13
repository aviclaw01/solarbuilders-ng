import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // `?_rsc=` URLs are Next.js router prefetch payloads, not pages. Googlebot
      // was spending ~87% of its crawl on them (Search Console crawl stats,
      // Oct 2026) while 107 real pages sat in "Discovered - currently not
      // indexed". The HTML already carries the RSC data the renderer needs.
      disallow: ['/api/', '/admin/', '/*?_rsc=', '/*&_rsc='],
    },
    sitemap: 'https://solarbuildersng.com/sitemap.xml',
  };
}
