import { publicUrl } from '../lib/page-metadata.mjs'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: publicUrl('/sitemap.xml') }
}
