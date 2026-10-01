import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const RETRIEVAL_DATA_STAGES=Object.freeze({
 'embedding-choice-asymmetry':rows([
  ['工程を区分','前処理・埋め込み・検索基盤と、検索全体を分ける。','この記事は埋め込みモデルの選定・評価・運用を扱います。図は実ベクトルや製品の順位を生成しません。'],
  ['近さの意味','モデルとタスクで、何を近いとするかが変わる。','同じ文でも用途や学習条件が違います。類似度の高さを、回答根拠の正しさや閲覧権限へ変換しません。'],
  ['五つの選定軸','言語・ドメイン・入力長・次元・提供形態を照合する。','英語の公開順位から日本語の自社検索を即採用せず、質問と正解チャンクで比較します。'],
  ['次元の条件','表現と保存・計算・メモリの費用を、同じ評価で比べる。','先頭N次元を使える設計は一部のモデルです。未対応モデルの任意切詰めや、必ず高次元が高精度という判定はしません。'],
  ['クエリと文書','短い質問と長い文書の役割を、公式の前処理へ結ぶ。','prefixや指示の対応はモデルごとに確認します。自己流の追加が常に効くとは扱いません。']
 ]),
 'embedding-chunk-deploy':rows([
  ['実入力を数える','指示・prefix込みの入力を、対応tokenizerと上限へ照合する。','複数話題と上限超過を区分します。APIの拒否と明示的切詰めを、無条件の末尾脱落へ一般化しません。'],
  ['微調整の前','汎用モデル・非対称前処理・チャンクを先に評価する。','特殊語彙の近い／近くない教師ペアと保守費用を、モデル変更の費用と比較します。図は学習を実行しません。'],
  ['自社で比較','質問と正解チャンクの対応から、recall@k・順位・費用を比べる。','公開ベンチマークは候補選定の入口です。自社の言語・ドメインと異なる条件の順位を、そのまま転用しません。'],
  ['更新と移行','新インデックスを別に構築し、評価して切替と復帰を準備する。','旧モデルと新モデルのベクトル空間を混ぜません。モデル版・退役告知・再埋込みの費用と時間を記録します。']
 ]),
 'vector-choice-approximation':rows([
  ['必要な基盤','専用DBを置く前に、現在の要件と既存資産を見る。','製品名のカタログや将来規模だけで採用しません。図は基盤を契約・構築しません。'],
  ['四つの類型','専用・DB拡張・managed検索・組込みを、条件で比べる。','規模は件数・QPS・更新頻度、チームは人数と運用スキル、既存資産は運用対象を増やさない価値を含みます。'],
  ['厳密と近似','総当たりの厳密探索と、取りこぼし得るANNを区分する。','ANNは真の上位kを完全に保証しません。図に架空の再現率や速度を置きません。'],
  ['方式と調整','再現率・速度・メモリ・更新のしやすさで比較する。','グラフ・クラスタ・量子化の得手不得手を見ます。既定値から、自社評価で必要な調整を確認します。']
 ]),
 'vector-filter-operations':rows([
  ['検索前の権限','部署・期間・ACLを検索段で反映する。','生成後の除外では、すでに文脈へ入った権限外情報を消せません。テナント分離の実装は専用記事の条件へ照合します。'],
  ['併用の責任','vectorとBM25の候補・融合を、基盤とアプリへ割り当てる。','フィルタ込みの実クエリ形で確認します。検索速度だけで権限反映や併用の対応を推測しません。'],
  ['費用と規模','件数・次元・更新頻度と、メモリ／ディスクを合わせる。','原文の積は費用へ効く要因の模式表現です。実価格の式とせず、量子化の再現率も評価します。'],
  ['復旧と監視','原本と索引の復旧、別索引の切替と監視を決める。','再生成できることと、短時間で復旧できることは別です。検索時間・再現率・サイズを観察します。'],
  ['小さく検証','現在の単純解が要件を満たすか確認し、成長signalで移行する。','原文の数万件程度は検討の目安で、全環境の性能保証ではありません。件数・QPS・レイテンシを実測します。']
 ]),
 'preprocess-extraction-quality':rows([
  ['取り込みの上流','抽出とデータ品質を、チャンキング以降の前提へ置く。','壊れた抽出や重複した版を、後段の検索だけで解決したとは扱いません。'],
  ['再実行する工程','原本から抽出・清掃・重複排除・メタデータへ渡す。','原本・抽出器・モデル・規則の版を残します。冪等な保存と、同じ入力で同じ出力になる決定性を区分します。'],
  ['形式の難所','HTML・Office・テキストPDF・画像PDFの構造を点検する。','スキャンのOCRと複雑なレイアウトは専門処理が要ります。全形式が同じ抽出器で正確に読めるとはしません。'],
  ['構造を保つ','見出し・表・段落を、次の分割で使える形へ残す。','段組み・結合セル・脚注・ページ跨ぎを点検します。plain textへの変換だけで構造を保存したとは扱いません。'],
  ['清掃の副作用','非本文や文字化けを除き、数値・記号・コードの保持を照合する。','清掃を強くするほど情報も失い得ます。完全一致検索と意味のある改行・表が悪化しないか評価します。']
 ]),
 'preprocess-metadata-lineage':rows([
  ['重複と版','完全重複・準重複・同文書の版違いを区分する。','似た別文書を消し過ぎず、有効期間と質問時点で対象版を選びます。完全重複の検出と、似た別文書の削除判断は別です。'],
  ['取り込み時の対応','出典・更新日・権限・オーナーと原本ID・版を残す。','削除や版更新後には取り込み時点を復元できない場合があります。後から正確に付け直せるとは保証しません。'],
  ['派生物の境界','chunk・vector・要約にも、原本のACLと対応を引き継ぐ。','重複排除で別テナント・権限・有効期間を無条件に統合しません。図の条件は実認可を実行しません。'],
  ['更新と削除','原本の更新・削除を、古い派生物へ伝播する。','原本だけ消して検索に残す状態を完了にしません。変更文書の増分取り込みと古いchunkの置換を追います。'],
  ['再処理と評価','原本と版を保持し、規則改善を再適用して検索で比較する。','確率的な抽出の差も評価します。冪等な保存だけで出力や検索品質が同一になるとは扱いません。']
 ])
})
export function retrievalDataFrame(diagram,phase){const stages=RETRIEVAL_DATA_STAGES[diagram];if(!stages)throw TypeError('Unknown retrieval data diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
export function embeddingInput({counted,overLimit,truncateExplicit,omissionRecorded}){if([counted,overLimit,truncateExplicit,omissionRecorded].some(v=>typeof v!=='boolean'))throw TypeError('Explicit input state required');return {next:!counted?'count':!overLimit?'candidate':truncateExplicit&&omissionRecorded?'evaluate-truncation':'split',apiExecuted:false}}
export function derivedSearch({sameTenant,aclInherited,versionApplies,deletedSource,derivativesDeleted}){if([sameTenant,aclInherited,versionApplies,deletedSource,derivativesDeleted].some(v=>typeof v!=='boolean'))throw TypeError('Explicit lineage required');return {searchCandidate:!deletedSource&&sameTenant&&aclInherited&&versionApplies,deletionComplete:deletedSource&&derivativesDeleted,authorizationExecuted:false}}
