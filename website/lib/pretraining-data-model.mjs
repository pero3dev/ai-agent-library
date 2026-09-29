import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const PRETRAINING_DATA_STAGES = Object.freeze([
  { label: '量と中身', title: '処理した量と、データの中身を分ける。', detail: 'Dは学習で処理したトークン数です。同じ資料を繰り返し読む分も含みます。処理量を、元資料の数や独立な情報量と同じ数として扱いません。図のA〜Dは数え方を示す説明用の資料です。' },
  { label: '再利用', title: '資料は4件のまま、6回読む。', detail: '手動で確認する補助段階です。各2位置を持つ資料A・B・C・Dを、A B C D A Bの順に読みます。処理出現は12、元資料内の位置は8です。再使用でも資料IDと元位置は変えず、処理出現に別のIDを付けます。8は語彙の種類数ではありません。' },
  { label: '設計観点', title: '品質・配合・再利用・評価混入を一緒に見る。', detail: '品質と重複、Web・書籍・コード・多言語の配合、繰り返し、評価データの混入を同時に確認します。再利用で処理量は増えても、追加価値は一定ではありません。過学習の可能性を確認し、学習と評価を分離します。選択は強調だけを変えます。' },
  { label: 'データ制約', title: 'モデル規模に見合う、良質なデータを確保する。', detail: 'モデルの規模Nだけを増やしても、必要なデータ条件は満たせません。量と中身の両方が制約になります。この図はデータ投資の可否、最適な配合、能力の改善量を判定しません。' }
].map(Object.freeze))

export const DATA_FOCI = Object.freeze(['quality', 'mixture', 'reuse', 'contamination'])
const documentIds = Object.freeze(['A', 'B', 'C', 'D'])
const readOrder = Object.freeze(['A', 'B', 'C', 'D', 'A', 'B'])
const aspects = [
  { id: 'quality', label: '品質・重複', lines: ['選別・重複除去', '中身を確かめる'] },
  { id: 'mixture', label: '配合', lines: ['Web・書籍・コード', '多言語も確認'] },
  { id: 'reuse', label: '再利用', lines: ['処理量は増える', '追加価値は一定でない'] },
  { id: 'contamination', label: '評価データ混入', lines: ['学習と評価を分離', '漏れを点検'] }
]

/** Fixed source identities and separate processing occurrences; no learning-effect estimate. */
export function pretrainingDataFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('settings must be an object')
  const { dataFocus = 'quality' } = options
  if (!DATA_FOCI.includes(dataFocus)) throw new RangeError('Unknown data focus')
  const normalized = clampPhase(phase, PRETRAINING_DATA_STAGES.length), stage = stageForPhase(normalized, PRETRAINING_DATA_STAGES.length)
  const documents = documentIds.map(id => ({ id, positions: [0, 1].map(index => ({ id: `${id}${index}`, documentId: id, index })) }))
  const reads = readOrder.map((documentId, index) => ({
    id: `read-${index}`, index, documentId,
    occurrences: documents.find(document => document.id === documentId).positions.map(position => ({
      id: `read-${index}-${position.id}`, readIndex: index, documentId, sourcePositionId: position.id
    }))
  }))
  return {
    phase: normalized, stage, ...PRETRAINING_DATA_STAGES[stage],
    dataFocus: stage === 2 ? dataFocus : null, documents, reads,
    readCount: reads.length, sourceDocumentCount: documents.length,
    processedTokenOccurrences: reads.reduce((sum, read) => sum + read.occurrences.length, 0),
    sourceTokenPositions: documents.reduce((sum, document) => sum + document.positions.length, 0),
    aspects: aspects.map(aspect => ({ ...aspect, lines: [...aspect.lines], emphasized: stage === 2 && aspect.id === dataFocus })),
    uniqueVocabularyCount: null, independentInformation: null, qualityScores: null,
    optimalMixture: null, overfittingStart: null, learningEffect: null, investmentDecision: null,
    reuseIncreasesProcessedCount: true, additionalValueIsConstant: false, evaluationMustBeSeparated: true
  }
}
