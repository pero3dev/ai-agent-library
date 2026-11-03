import routes from '../generated/routes.json'
import pagesData from '../generated/pages.json'
import type { PagesMetadata } from '../lib/content-types'
import type { MetadataRoute } from 'next'
import { publicUrl } from '../lib/page-metadata.mjs'

export const dynamic = 'force-static'
const pages: PagesMetadata = pagesData
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(route => {
    const updated = pages[route]?.last_updated
    return { url: publicUrl(route), ...(updated ? { lastModified: updated } : {}) }
  })
}
