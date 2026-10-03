import routes from '../generated/routes.json'
import pages from '../generated/pages.json'
import { publicUrl } from '../lib/page-metadata.mjs'

export const dynamic = 'force-static'
export default function sitemap() {
  return routes.map(route => ({ url: publicUrl(route), ...(pages[route]?.last_updated ? { lastModified: pages[route].last_updated } : {}) }))
}
