const stage = (label, title, formula, detail) => ({ label, title, formula, detail })

export const BLOCK_STAGES = [
  stage('射影', '同じ入力から、ヘッドごとに射影する', 'headᵢ = Attention(XWᵢQ, XWᵢK, XWᵢV)', '各ヘッドは全幅dのXを読み、専用の重みで幅d/hのQ・K・Vを作ります。'),
  stage('連結', '細い出力を連結し、幅dへまとめる', 'Concat(head₁, …, headₕ) Wᴼ', 'ヘッドの出力幅はそれぞれd/h。連結後はdとなり、出力射影を経て残差へ加わります。'),
  stage('FFN', '各位置で広げ、変換し、元の幅へ戻す', 'σ(xW₁ + b₁)W₂ + b₂', '位置間は混ぜません。同じW₁・W₂を各位置に使い、d → d_ff → dと変換します。'),
  stage('ゲート', '2つの枝を要素ごとに掛ける', '(Swish(xW₁) ⊙ (xW₃)) W₂', 'SwiGLUは連続値どうしの積です。3つの行列を持ち、二値の開閉や確率を表しません。'),
  stage('残差', '副層の結果を、元の流れに足す', 'x + Sublayer(Norm(x))', 'AttentionとFFNのそれぞれに加算点があります。元の幅dの流れを上書き・連結しません。'),
  stage('RMS', 'RMSで割り、成分ごとに再スケール', 'x / √(mean(x²) + ε) ⊙ g', 'RMSNormは平均を引きません。εを含む尺度で割り、学習するgを掛けます。単位長への変換ではありません。'),
  stage('配置', 'Normを置く場所だけを比べる', 'Pre: x + F(Norm(x))\nPost: Norm(x + F(x))', 'Normの種類と配置は別の選択です。Preは副層の前、Postは残差の加算後に置きます。'),
  stage('1層', '同じ重みを、1層の個数として数える', '4d² + 8d² = 12d²', '基本2層MLP・d_ff = 4dの概算です。Q/K/V/Oは全ヘッドを合わせた重みで、hをもう一度掛けません。'),
  stage('全体', 'L層と、語彙の重みを分けて数える', 'N ≈ 12Ld² + Vd（共有時）', '本体は層数Lに比例し、幅dの二乗で増えます。共有なしなら入出力に2Vdを加えます。')
]

export const BLOCK_HEADS = ['1', 'i', 'h']
const assertChoice = (value, values, name) => { if (!values.includes(value)) throw new RangeError(`Unknown ${name}: ${value}`) }

export function blockWeights(gated = false, counting = false) {
  const counted = counting && !gated
  return [
    ...['Q', 'K', 'V', 'O'].map(symbol => ({ id: symbol, label: `W${symbol}`, rows: 'd', columns: 'd', coefficient: 1, family: 'attention' })),
    { id: '1', label: 'W₁', rows: 'd', columns: counted ? '4d' : 'd_ff', coefficient: counted ? 4 : null, family: 'ffn' },
    { id: '2', label: 'W₂', rows: counted ? '4d' : 'd_ff', columns: 'd', coefficient: counted ? 4 : null, family: 'ffn' },
    ...(gated ? [{ id: '3', label: 'W₃', rows: 'd', columns: 'd_ff', coefficient: null, family: 'ffn' }] : [])
  ]
}

export function parameterTerms(tying = 'tied') {
  assertChoice(tying, ['tied', 'untied'], 'tying')
  const weights = blockWeights(false, true)
  const attention = weights.filter(item => item.family === 'attention').reduce((sum, item) => sum + item.coefficient, 0)
  const ffn = weights.filter(item => item.family === 'ffn').reduce((sum, item) => sum + item.coefficient, 0)
  return { attention, ffn, layer: attention + ffn, vocabulary: tying === 'tied' ? 1 : 2, approximate: true, assumptions: '基本2層MLP・d_ff = 4d', omitted: 'バイアス・Norm等の小さい項は省略' }
}

export function residualPaths(placement = 'pre') {
  assertChoice(placement, ['pre', 'post'], 'placement')
  return ['Attention', 'FFN'].map(sublayer => ({
    sublayer,
    branch: placement === 'pre' ? ['input', 'Norm', sublayer, 'add'] : ['input', sublayer, 'add'],
    residual: ['input', 'add'],
    output: placement === 'post' ? ['add', 'Norm', 'output'] : ['add', 'output']
  }))
}

export function blockFrame(index, { head = 'i', placement = 'pre', tying = 'tied' } = {}) {
  if (!Number.isInteger(index) || index < 0 || index >= BLOCK_STAGES.length) throw new RangeError('Invalid block stage')
  assertChoice(head, BLOCK_HEADS, 'head')
  assertChoice(placement, ['pre', 'post'], 'placement')
  assertChoice(tying, ['tied', 'untied'], 'tying')
  const gated = index === 3
  const effectivePlacement = index === 6 ? placement : 'pre'
  return {
    stage: index, ...BLOCK_STAGES[index], head, gated, placement: effectivePlacement, tying,
    projection: { inputWidth: 'd', headWidth: 'd/h', headCount: 'h', concatenatedWidth: 'd', source: 'full-X' },
    ffn: { mixesPositions: false, sharesWeightsAcrossPositions: true, inputWidth: 'd', middleWidth: 'd_ff', outputWidth: 'd', product: gated ? 'elementwise-real' : null },
    weights: blockWeights(gated, index >= 7), residual: residualPaths(effectivePlacement), parameters: parameterTerms(tying)
  }
}
