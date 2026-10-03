import { publicUrl } from '../lib/page-metadata.mjs'

export const dynamic = 'force-static'
export default function robots() {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: publicUrl('/sitemap.xml') }
}
