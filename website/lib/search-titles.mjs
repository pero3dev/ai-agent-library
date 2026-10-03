const segmenter = new Intl.Segmenter('ja', { granularity: 'word' })

/** Pagefind の索引側にもブラウザーと同じ日本語分割の別名を与える。表示本文は変えない。 */
export function addTitleSearchAliases(html) {
  return html.replace(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi, (heading, attributes, body) => {
    const title = body.replace(/<[^>]*>/g, '').replace(/&(?:amp|quot|lt|gt|apos);/g, value => ({
      '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&apos;': "'"
    })[value]).replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(
      code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
    if (!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(title)) return heading
    const words = [...segmenter.segment(title)].filter(part => part.isWordLike).map(part => part.segment).join(' ')
    const escaped = words.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // index-attrs は検索だけに使う。元の HTML 出力・画面上のタイトルは変更しない。
    return `<h1${attributes} data-pagefind-index-attrs="data-search-words" data-search-words="${escaped}">${body}</h1>`
  })
}
