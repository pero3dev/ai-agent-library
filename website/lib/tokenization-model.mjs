export const TOKENIZATION_TEXT = 'tokenizer'

export const TOKENIZATION_STAGES = Object.freeze([
  { label: '単位', title: 'コスト・予算・生成を、同じ単位で読む。', formula: '文字数と、トークン数は別', detail: 'トークンは入出力を数える単位です。コスト、コンテキストに入る量、生成する長さを考える出発点になります。図から実価格や実速度は計算しません。' },
  { label: '変換', title: 'テキストと、語彙内のID列を対応させる。', formula: 'tokenizer ↔ token | izer ↔ [12, 27]', detail: '説明用の語彙Aでは、tokenとizerに分け、それぞれID 12と27で表します。IDから語片を戻してつなぐと、同じtokenizerになります。IDの大小は意味の近さを表しません。' },
  { label: '境界', title: '文字・語・語片の境界を比べる。', formula: '同じ9文字でも、区切る単位が違う', detail: '文字ごとの9個、語としての1個、説明用の語彙Aによる2トークンを比較します。文字や語の個数を、そのままモデルのトークン数とは扱いません。' },
  { label: '条件', title: '言語や内容で、分け方は変わる。', formula: '言語・内容・語彙 → 分割と個数', detail: '学習データや語彙、空白・改行・記号・IDなどの内容が分割に関係します。どの条件を見るかを強調する図であり、言語間の倍率、品質や料金の優劣を測っていません。採用モデルで代表的な入力を数えます。' },
  { label: '語彙', title: '元の文字列を保ち、語彙を切り替える。', formula: '説明用の語彙A: 2個 ／ 語彙B: 4個', detail: 'tokenizerを、語彙Aはtokenとizer、語彙Bはtok、en、i、zerに分けます。どちらも元の文字列へ戻ります。IDはそれぞれの語彙内だけで有効です。実モデル間の効率比較ではありません。' },
  { label: '計測', title: '事前に数え、実行後のusageを記録する。', formula: '公式のカウント手段 → 実行結果のusage', detail: '見積りには採用先の公式のカウント手段を使い、実行後はusageを記録します。今回の入力には以前の入力と出力も含まれます。この図はAPIを呼ばず、実測値や請求額を表示しません。' },
  { label: '履歴', title: '以前の履歴も、今回の入力になる。', formula: '以前の入力＋出力 ＋ 今回の入力', detail: '会話を続けると、以前の入力と出力が今回の入力へ含まれます。履歴の再送という包含関係を示しています。通信形式、隠れたトークン、キャッシュ課金の量は計算していません。' }
].map(Object.freeze))

export const TOKEN_VOCABULARIES = Object.freeze([
  { id: 'a', label: '説明用の語彙A', entries: [{ piece: 'token', id: 12 }, { piece: 'izer', id: 27 }] },
  { id: 'b', label: '説明用の語彙B', entries: [{ piece: 'tok', id: 31 }, { piece: 'en', id: 8 }, { piece: 'i', id: 5 }, { piece: 'zer', id: 42 }] }
].map(vocabulary => Object.freeze({ ...vocabulary, entries: Object.freeze(vocabulary.entries.map(Object.freeze)) })))

export const TOKEN_BOUNDARIES = Object.freeze([
  { id: 'character', label: '文字ごと', unit: '文字' },
  { id: 'word', label: '語の境界', unit: '語' },
  { id: 'subword', label: '語片の境界', unit: 'トークン' }
].map(Object.freeze))

export const TOKEN_DEPENDENCIES = Object.freeze([
  { id: 'language', label: '言語と語彙', detail: '学習データ・語彙' },
  { id: 'content', label: '文字列の内容', detail: '空白・改行・記号・ID' }
].map(Object.freeze))

export const TOKEN_MEASUREMENTS = Object.freeze([
  { id: 'estimate', label: '事前の見積り' },
  { id: 'usage', label: '実行後の記録' },
  { id: 'history', label: '履歴の再送' }
].map(Object.freeze))

export const TOKENIZATION_GEOMETRY = Object.freeze({
  textX: 80, textWidth: 480, characterWidth: 480 / 9,
  sourceY: 62, sourceHeight: 58, pieceY: 162, pieceHeight: 76
})

function choice(items, id, name) {
  const item = items.find(candidate => candidate.id === id)
  if (!item) throw new RangeError(`Unknown ${name}`)
  return item
}

/** A hand-defined, fully covered fixture; not an implementation of BPE. */
export function fixtureTokens(vocabulary = 'a', occurrencePrefix = 'example') {
  const selected = choice(TOKEN_VOCABULARIES, vocabulary, 'vocabulary')
  if (typeof occurrencePrefix !== 'string' || !occurrencePrefix.length) throw new TypeError('Occurrence prefix must be a nonempty string')
  let offset = 0
  return selected.entries.map(({ piece, id }, index) => {
    const start = offset
    offset += piece.length
    return { vocabulary, tokenId: id, occurrenceId: `${occurrencePrefix}:${index}`, piece, start, end: offset }
  })
}

export function decodeFixture(vocabulary, tokenIds) {
  const selected = choice(TOKEN_VOCABULARIES, vocabulary, 'vocabulary')
  if (!Array.isArray(tokenIds)) throw new TypeError('Token IDs must be an array')
  return tokenIds.map(id => {
    const entry = selected.entries.find(item => item.id === id)
    if (!entry) throw new RangeError('Token ID does not belong to this vocabulary')
    return entry.piece
  }).join('')
}

function boundarySegments(boundary, tokens) {
  if (boundary === 'subword') return tokens.map(token => ({ ...token, kind: 'token' }))
  const pieces = boundary === 'word' ? [TOKENIZATION_TEXT] : [...TOKENIZATION_TEXT]
  let offset = 0
  return pieces.map((piece, index) => {
    const start = offset
    offset += piece.length
    return { kind: boundary, piece, start, end: offset, occurrenceId: `${boundary}:${index}`, tokenId: null, vocabulary: null }
  })
}

/** The shared ReadingFigure clock supplies the stage; phase never changes data. */
export function tokenizationFrame(stage, options = {}) {
  if (!Number.isInteger(stage) || stage < 0 || stage >= TOKENIZATION_STAGES.length) throw new RangeError('Unknown tokenization stage')
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object')
  const { vocabulary = 'a', boundary = 'subword', dependency = 'language', measurement = 'estimate' } = options
  choice(TOKEN_VOCABULARIES, vocabulary, 'vocabulary')
  choice(TOKEN_BOUNDARIES, boundary, 'boundary')
  choice(TOKEN_DEPENDENCIES, dependency, 'dependency')
  choice(TOKEN_MEASUREMENTS, measurement, 'measurement')
  // Controls affect only their own comparison; later scenes return to the base fixture.
  const currentVocabulary = stage === 4 ? vocabulary : 'a'
  const currentBoundary = stage === 2 ? boundary : 'subword'
  const tokens = fixtureTokens(currentVocabulary)
  const { textX, characterWidth, pieceY, pieceHeight } = TOKENIZATION_GEOMETRY
  const segments = boundarySegments(currentBoundary, tokens).map(segment => ({ ...segment,
    x: textX + characterWidth * segment.start + 3, y: pieceY,
    width: characterWidth * (segment.end - segment.start) - 6, height: pieceHeight,
    center: textX + characterWidth * (segment.start + segment.end) / 2
  }))
  const label = choice(TOKEN_BOUNDARIES, currentBoundary, 'boundary').unit
  return {
    ...TOKENIZATION_STAGES[stage], stage, text: TOKENIZATION_TEXT,
    vocabulary: currentVocabulary, vocabularyLabel: currentVocabulary === 'a' ? '語彙A' : '語彙B',
    boundary: currentBoundary, dependency: stage === 3 ? dependency : null,
    measurement: stage === 5 ? measurement : null,
    tokens, tokenCount: tokens.length, encoded: tokens.map(token => token.tokenId),
    reconstructed: decodeFixture(currentVocabulary, tokens.map(token => token.tokenId)),
    characters: [...TOKENIZATION_TEXT].map((value, index) => ({ value, index, x: textX + characterWidth * (index + .5) })),
    segments, segmentCount: segments.length, segmentUnit: label,
    showTokenIds: currentBoundary === 'subword',
    history: { visible: stage >= 5, includesPastInput: true, includesPastOutput: true,
      includesCurrentInput: true, measuredTokenCount: null },
    measuredUsage: null, languageRatio: null, price: null, qualityJudgment: null
  }
}
