import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const RAG_MEMORY_GRAPH_STAGES=Object.freeze({
 'rag-ingestion-search':rows([
  ['四段へ切分け','取り込み・検索・生成・評価を分け、失敗箇所を探す。','必要な文書が候補へ来ていない状態を、生成プロンプトだけで解決したとは扱いません。'],
  ['分割の境界','固定長・構造・意味の分割を、文書と評価へ対応させる。','小さいchunkの文脈不足、大きいchunkのノイズを比べ、表・手順の途中を切らず、単体の意味と見出し・出典・権限を保持します。'],
  ['検索と版','意味の近さと語句の一致を組合せ、モデル版を記録する。','ハイブリッドは元記事の初期候補です。すべてのqueryの品質保証とせず、モデル変更時の全再索引と評価を保持します。'],
  ['二段の検索','一次検索の再現率と、並替え後の上位の質を分ける。','原文の50件・20件・5件は説明例です。既定値にせず、追加遅延・費用と自社評価で決めます。'],
  ['権限と上位k','権限をモデルが省略できない条件として、検索時に反映する。','後filterは候補補充と権限制限下のrecallで評価します。権限外候補は外部reranker・生成へ渡しません。']
 ]),
 'rag-agent-evidence':rows([
  ['固定と動的','複数操作があることと、モデルが経路を選ぶことを分ける。','query書換え・並列検索・計算は固定Workflowにも置けます。途中結果による検索先・再検索・次操作の動的選択を採用理由へ照合します。'],
  ['反復を止める','検索ツールの説明・入力・上限と、わからない条件を置く。','要約・抜粋を往復へ、全文を最終生成へ渡す構成を比較します。図は回数やtoken予算を新たな推奨値として置きません。'],
  ['引用と支持','安定chunk IDからアプリが出典を解決し、引用の支持を評価する。','リンクがあるだけでは忠実性を保証しません。hitなしは指示とコード側ガードで扱い、根拠を創作しません。'],
  ['運用と復帰','ACL・更新・旧版削除を、別索引の評価・切替・復帰へ結ぶ。','チャンキングやモデルの変更はデプロイです。検索品質と生成品質、全体と出典を分けて測ります。'],
  ['直す場所','検索の的中と、生成の忠実性を別の観測として読む。','図の選択は切分けの模式例です。実スコアを計測せず、最終回答だけから原因を確定しません。']
 ]),
 'memory-extract-store':rows([
  ['書く・捨てる','抽出・保存・想起・更新忘却を、会話へ戻る循環にする。','検索の再利用だけでは記憶の品質と削除を設計できません。全会話を一律保存する構成を完成扱いしません。'],
  ['入口の信頼度','本人の明示、オンライン抽出、バッチ振返りの出所を残す。','推論を本人の意思へ昇格しません。出所・日時・信頼度を、訂正・削除・説明へ使います。'],
  ['覚える基準','安定した事実・明示の好み・決定と理由を、除外基準と照合する。','一時状態・タスク文脈・弱い推測を除外します。機微情報は、会話に出たことを明示的同意に変換しません。'],
  ['保存の形','構造化profile・自由記述・vector・関係構造を比べる。','小さなprofileとmeta付きメモ検索を元記事の初手として示し、すべてをgraphへ移す推奨にしません。'],
  ['使う範囲','毎回効く少量の情報と、検索時に引く情報を分ける。','vectorは否定や完全一致に弱い場合があり、構造の選択だけで想起品質を保証しません。']
 ]),
 'memory-recall-forget':rows([
  ['想起の三経路','常時注入、固定検索、Agentが引くツールを比べる。','常時注入は文脈を消費し、動的な想起は遅延・費用を増やします。方式の自由さを品質保証にしません。'],
  ['該当なし','関連度の下限と、注入した記憶のtraceを用意する。','上位だから常に注入せず、該当なしを許します。関連度の数値や新たなしきい値の推奨を置きません。'],
  ['矛盾と訂正','上書き／有効期間付き履歴を、情報の種別へ対応させる。','応答だけ直して古い記憶を残しません。最終確認・参照日時で陳腐化を扱い、本人が確認・修正・削除できる経路を保ちます。'],
  ['分離と説明','ユーザー・テナントの境界を、ストアか強制queryへ置く。','想起時の任意filterだけで分離を保証しません。記憶機能の説明とopt-out、機微情報の基準を最初に設計します。'],
  ['削除の経路','記憶項目・vector・backup・派生要約まで削除経路を追う。','表示上の削除や記憶項目だけの削除を、全体の完全削除に変換しません。図は保存・認可・削除を実行しません。']
 ]),
 'graph-build-quality':rows([
  ['通常RAGから','通常の検索で失敗する質問を、導入の出発点にする。','グラフの構築維持は大きな費用を持ちます。強力そうという印象だけで全面graph化しません。'],
  ['三つ組とschema','entityと関係、許す型をネットワークとして読む。','原文の山田・営業部と参照関係を例に、意味の近い断片と関係をたどる構造を区分します。'],
  ['抽出と名寄せ','抽出した候補を正規化・照合し、分裂と混線を防ぐ。','営業部と営業本部は表記例です。同じ実体の裏付けがないまま統合せず、抽出の欠落と誤りも評価します。'],
  ['品質と更新','人手で重要部分を確認し、更新時の再抽出を設計する。','graphがあるだけで正しいとせず、文書更新・schema変更・名寄せのやり直しの費用を持ちます。']
 ]),
 'graph-types-investment':rows([
  ['三つの類型','entityから辿る、community要約、vectorとの併用を区分する。','通常RAGを土台に関係部分を補う構成を元記事の出発点として示し、全用途の最適解にしません。'],
  ['質問の型','単純な事実、関係、多段・集約の問いを実ログへ照合する。','関係や集約に向くことと、完全な列挙・正確な件数が保証されることは別です。'],
  ['投資の条件','通常RAGの失敗と、関係・集約の必要性、維持費用を合わせる。','hybrid・meta・chunkの改善とも比較します。実質問の割合や費用を図の架空数値で補いません。'],
  ['同じ質問で評価','通常RAGとのA/B、抽出品質の人手標本、費用と遅延を見る。','精度だけで採用せず、構築・維持の負担と効いた質問の範囲を確認します。'],
  ['運用へ戻す','新文書・関係・schemaの変更を、再構築と再評価へ戻す。','旧graphを放置せず、原文の手法・フレームワークの未確認を採用時に再確認します。']
 ])
})
export function ragMemoryGraphFrame(diagram,phase){const stages=RAG_MEMORY_GRAPH_STAGES[diagram];if(!stages)throw TypeError('Unknown RAG memory graph diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
export function ragEvidence({hit,authorized,supports}){if([hit,authorized,supports].some(v=>typeof v!=='boolean'))throw TypeError('Explicit evidence state required');return {next:!authorized?'block':!hit?'not-found':!supports?'verify-support':'candidate',answerExecuted:false}}
export function memoryExtraction({stable,sourceRecorded,sensitive,explicitConsent}){if([stable,sourceRecorded,sensitive,explicitConsent].some(v=>typeof v!=='boolean'))throw TypeError('Explicit memory state required');return {saveCandidate:stable&&sourceRecorded&&(!sensitive||explicitConsent),memoryWritten:false}}
export function memoryDeletion({itemRemoved,indexRemoved,backupHandled,derivativesRemoved}){if([itemRemoved,indexRemoved,backupHandled,derivativesRemoved].some(v=>typeof v!=='boolean'))throw TypeError('Explicit deletion state required');return {completeCandidate:itemRemoved&&indexRemoved&&backupHandled&&derivativesRemoved,deletionExecuted:false}}
export function graphInvestment({baselineFails,relationNeeded,maintenanceAccepted}){if([baselineFails,relationNeeded,maintenanceAccepted].some(v=>typeof v!=='boolean'))throw TypeError('Explicit graph state required');return {evaluationCandidate:baselineFails&&relationNeeded&&maintenanceAccepted,deploymentExecuted:false,qualityGuaranteed:false}}
