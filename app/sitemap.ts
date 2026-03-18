import { MetadataRoute } from 'next';
import { BUILDERS } from '@/lib/mock-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://solarbuilders.ng';
  
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/calculator`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/for-builders`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    // Location pages
    { url: `${baseUrl}/solar/lagos`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/solar/abuja`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/solar/port-harcourt`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/solar/kano`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.80 },
    { url: `${baseUrl}/solar/enugu`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.80 },
    // Blog articles
    { url: `${baseUrl}/blog/solar-cost-nigeria-2026`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/blog/inverter-size-guide`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/blog/generator-vs-solar-lagos`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/blog/choose-solar-installer-lagos`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/blog/solar-maintenance-nigeria`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.70 },
    { url: `${baseUrl}/blog/solar-loans-nigeria`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.70 },
    { url: `${baseUrl}/blog/solar-calculator-nigeria`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/blog/solar-abuja-2026`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
  ];

  const builderPages = BUILDERS.map(builder => ({
    url: `${baseUrl}/builders/${builder.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...builderPages];
}
