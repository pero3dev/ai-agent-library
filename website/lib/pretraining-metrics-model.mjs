import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const PRETRAINING_METRICS_STAGES = Object.freeze([
  { label: '論争', title: '創発の報告と、指標への反論を並べる。', detail: '規模とともに能力が急に現れるという報告がある一方、測定方法が急な変化を作るという反論もあります。論争は決着していません。以後の固定スコアは測り方を示す説明例であり、実モデルの測定ではありません。' },
  { label: '同じ出力', title: '同じ6入力を、同じ横位置で比べる。', detail: '手動で確認する補助段階です。条件A〜Fの説明用スコア30・40・50・60・70・80を固定し、表示だけ100で割ります。実際のモデル規模や学習の途中を表す軸ではありません。連続値と、閾値0.60以上を1とする表示を並べます。' },
  { label: '測り方', title: '元の値はそのまま、二値化する閾値だけ変える。', detail: '同じ入力を上段の連続値と下段の二値で同時に表示します。整数スコアが閾値以上なら1、未満なら0。閾値と等しい点も1に含めます。測り方だけで見え方が変わる説明例であり、完全一致やBrierスコアの実装ではありません。' },
  { label: '併用', title: '複数の指標から読み、能力を単一値で断じない。', detail: '連続指標と閾値指標を併用し、どの測り方で変化が現れるか確認します。この説明例は、すべての創発が偽物だと証明するものではありません。実際の能力や創発の有無は判定せず、論争は未決着として残します。' }
].map(Object.freeze))

export const SCORE_THRESHOLDS = Object.freeze([50, 60, 70])
const scores = Object.freeze([30, 40, 50, 60, 70, 80])

/** Threshold comparison is integer >=. Coordinates and source scores never depend on the selector. */
export function pretrainingMetricsFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('settings must be an object')
  const { scoreThreshold = 60 } = options
  if (!SCORE_THRESHOLDS.includes(scoreThreshold)) throw new RangeError('Unknown score threshold')
  const normalized = clampPhase(phase, PRETRAINING_METRICS_STAGES.length), stage = stageForPhase(normalized, PRETRAINING_METRICS_STAGES.length)
  const threshold = stage === 2 ? scoreThreshold : 60
  return {
    phase: normalized, stage, ...PRETRAINING_METRICS_STAGES[stage], threshold, denominator: 100,
    thresholdDisplay: (threshold / 100).toFixed(2), thresholdY: 160 - threshold * .8,
    points: scores.map((numerator, index) => ({
      id: String.fromCharCode(65 + index), index, x: 148 + index * 80,
      numerator, denominator: 100, continuous: numerator / 100, display: (numerator / 100).toFixed(2),
      continuousY: 160 - numerator * .8, binary: numerator >= threshold ? 1 : 0,
      binaryY: numerator >= threshold ? 256 : 304
    })),
    views: ['continuous', 'binary'], comparisonOperator: '>=', empiricalMeasurement: false,
    exactMatchImplementation: false, brierImplementation: false,
    emergenceJudgment: null, abilityJudgment: null, allEmergenceIsArtifact: false
  }
}
