import { extractSteps } from './markdown'
import { APP_STORE_URL, MAIN_SITE, PLAY_STORE_URL, SITE_URL } from './site'
import type { Post, Version } from './types'

const CTX = 'https://schema.org'
const LOGO = { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
const ORG = { '@type': 'Organization', name: 'Lyrio', url: MAIN_SITE, logo: LOGO }

export function siteJsonLd(): object[] {
  return [
    { '@context': CTX, ...ORG, sameAs: [APP_STORE_URL, PLAY_STORE_URL] },
    {
      '@context': CTX, '@type': 'MobileApplication', name: 'Lyrio', operatingSystem: 'iOS, Android',
      applicationCategory: 'HealthApplication', url: MAIN_SITE, publisher: ORG,
      sameAs: [APP_STORE_URL, PLAY_STORE_URL, MAIN_SITE],
    },
  ]
}

export function articleJsonLd(a: { post: Post; version: Version; url: string; homeUrl: string; homeName: string }): object[] {
  const { post, version: v, url } = a
  const out: object[] = [
    {
      '@context': CTX, '@type': 'BlogPosting', headline: v.title, description: v.metaDescription || v.summary,
      abstract: v.summary, inLanguage: v.locale, url, mainEntityOfPage: url,
      image: post.coverUrl ?? `${url}/opengraph-image`,
      datePublished: (post.publishedAt ?? post.createdAt).toISOString(), dateModified: v.updatedAt.toISOString(),
      author: ORG, publisher: ORG,
    },
    {
      '@context': CTX, '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: a.homeName, item: a.homeUrl },
        { '@type': 'ListItem', position: 2, name: v.title, item: url },
      ],
    },
  ]
  if (v.faq.length) {
    out.push({
      '@context': CTX, '@type': 'FAQPage', inLanguage: v.locale,
      mainEntity: v.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    })
  }
  const steps = post.type === 'tutorial' ? extractSteps(v.bodyMd) : []
  if (steps.length) {
    out.push({
      '@context': CTX, '@type': 'HowTo', name: v.title, inLanguage: v.locale,
      step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text || s.name })),
    })
  }
  return out
}

export function jsonLdString(x: unknown): string {
  return JSON.stringify(x).replace(/</g, '\\u003c')
}
