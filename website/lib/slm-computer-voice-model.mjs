import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SLM_COMPUTER_VOICE_STAGES=Object.freeze({
 'slm-quality-components':rows([
  ['戦略と環境','小型を活かす分担と、端末へ配置する話を区分する。','モデル戦略を図にします。モデル名・性能帯はカタログ、実行場所はローカル実装の正本へ戻ります。'],
  ['入力群の境界','タスクと入力群ごとに、品質基準を満たす範囲を測る。','小型という分類や全体の平均だけで適性を決めません。学習・推論・量子化と難しい入力の影響を含めます。'],
  ['小型を既定に','SLM-firstと上位への直行を、総費用と応答時間で比べる。','小型が常に安い・速いとは扱いません。二段の呼び出しとルーターを含めてp95/p99を測ります。'],
  ['部品と守り','定型部品の品質と、ガードレールの安全性を別に評価する。','分類精度だけで安全性を済ませません。危険な入力の通過、攻撃・言語・長文と権限制約を合わせます。']
 ]),
 'slm-routing-cost':rows([
  ['難易度の分岐','難しい入力は上位へ直行し、小型の試行を省く経路も持つ。','難易度推定・確信度取得・検証にも費用があります。図は実モデルの確信度や節約率を生成しません。'],
  ['出力の昇格','小型の品質不足・低確信・検証失敗を、上位への確認へ回す。','検証が通ったことを全タスクの品質保証にしません。どの入力を昇格するかを評価セットで確かめます。'],
  ['部品を切り出す','上位の判断と、固定手順の分類・抽出・整形を分ける。','上位モデルの頭脳と小型の部品を組み合わせる構成です。ガードレール移管には安全性の評価が別に要ります。'],
  ['学習の前に','プロンプトとルーティングを比較してから、FT・蒸留を検討する。','狭いタスクの改善を一般能力へ広げません。データ作成・維持と学習の条件はFTの正本へ戻ります。'],
  ['採用の条件','入力群の品質・総費用・tail latency・必要な安全性を合わせる。','架空の曲線や節約率を置きません。条件がそろった状態は採用を検討する候補で、本番への移管ではありません。']
 ]),
 'computer-observation-permission':rows([
  ['APIから検討','APIがある区間を切り出し、画面操作の範囲を減らす。','画面操作を選ぶ前にAPIを検討します。どちらの経路でも権限と副作用前の承認は保持します。'],
  ['観測と行動案','画面を観測し、対象と内容を持つ行動案を作る。','観測した画面の指示は実行権限になりません。作業状態を持ち、不要な周回と画像処理を減らします。'],
  ['副作用の前に','許可範囲・上限・必要な承認を、実行前に確認する。','承認は対象と内容に結びます。却下・未承認・期限切れや予算上限では実行せず停止・差し戻しです。'],
  ['変更で戻る','対象・送信内容・画面が変わったら再観測して承認を取り直す。','古い対象への承認を新しい操作へ転用しません。緊急停止が有効な場合も、操作候補を実行へ進めません。'],
  ['待機と検証','条件を待ち、画面と実データを検証して次の観測へ戻る。','それらしい画面だけで業務成功を確定しません。図はクリック・入力・送信・購入・削除を実行しません。']
 ]),
 'computer-stability-evidence':rows([
  ['要素と環境','DOM・アクセシビリティ・相対指定と環境固定を組み合わせる。','座標だけへの依存を下げます。画面のサイズ・zoom・言語を固定しても、変更への監視は残ります。'],
  ['条件を待つ','固定sleepより要素・遷移の条件を待ち、画面とデータを照合する。','待機の完了と業務結果の成功は別です。観測とデータ側の照会を組み合わせます。'],
  ['操作を減らす','API区間を切り出し、認証と入力を安定した経路へ寄せる。','原文の20手順・15手順・5手順は例です。専用アカウントや認証の事前準備を実行権限へ広げません。'],
  ['隔離と制限','専用環境・最小権限・許可リスト・承認・停止を組み合わせる。','GAや画面上の指示で許可範囲を広げません。外部コンテンツは間接インジェクションの入口になりえます。'],
  ['軌跡と実測','観測・決定・行動・結果をたどり、代表タスクを繰り返し測る。','1回の成功や公開順位を自タスクの品質にしません。UI変更と成功率の低下を監視します。'],
  ['toolsetの移行','旧形状からの移行と、操作列・uploadの境界を確認する。','まとめ実行でも、対象変更と副作用の前に操作列を分けます。uploadはopt-inと送信先を確認し、GAを許可にしません。']
 ]),
 'voice-architecture-latency':rows([
  ['音声の三つの差','沈黙・ターン・中間テキストが、制御と評価の位置を変える。','図は音声を生成・録音しません。会話が自然に続くことと、業務処理が正しく完了することを分けます。'],
  ['段を分ける','STT・テキスト処理・TTSの各段で検査し、部品を差し替える。','中間テキストでポリシーチェックや承認を組みます。全段ストリーミングでも検査と業務ルールは保持します。'],
  ['単一の音声モデル','音声・推論・ツールを一つのセッションへまとめる。','自然さと即応を評価し、中間テキストの制御点の違いを確認します。文字起こし・監査・業務結果の検証は残ります。'],
  ['別バックエンド','GPT-Liveの会話と、別の推論・ツール処理を並行させる。','2026-10-02の部分確認です。client／Responses delegationの双方でアプリが権限と業務記録を制御します。'],
  ['最初の音声まで','ユーザーの発話終了から実際の音声到達までを、段別・分布で測る。','原文の実測例を全構成の短縮率にしません。GPT-Liveでは会話とバックエンドの処理時間を分けます。'],
  ['接続と資産','接続・会話要件・既存資産・制御点から構成を比較する。','元記事の接続方式と確認時点を保持します。提供経路を決めただけで遅延や業務適合は保証しません。']
 ]),
 'voice-interruption-tools':rows([
  ['ターンの判定','早すぎる割込みと遅い応答を測り、VADか手動制御を選ぶ。','騒音・考えながらの発話を含めて調整します。模式図の選択はAPIのVAD設定を変更しません。'],
  ['生成と再生を止める','話し始めを検出したら、進行中の生成と音声再生を止める。','生成済みと再生済みは別です。停止を業務ツールの既実行結果の取消に変換しません。'],
  ['届いた範囲へ','未再生の音声を履歴から除き、実際に届いた範囲と合わせる。','区間は模式的な音声の範囲です。音声と文字の精密な対応を保証せず、切り詰めを完全な文字起こしの復元にしません。'],
  ['ツール中の会話','つなぎの発話と、対応する非同期処理で沈黙を減らす。','音声での確認とツールの実結果を区分します。処理中の会話継続を処理完了の通知へ読み替えません。'],
  ['長い処理の出口','長い処理は折り返しの経路と、残る業務状態を設計する。','会話を閉じたことをタスク成功にしません。実処理・結果の確認・通知は耐久実行の正本へ接続します。'],
  ['高リスクの確認','復唱と別チャネル、現在の対象を合わせて確認する。','音声の「はい」だけで不可逆操作を実行しません。図の条件がそろっても、業務操作は実行しません。']
 ]),
 'voice-evaluation-providers':rows([
  ['評価の四つの軸','タスク・認識と了解性・音声応答・会話制御を別々に測る。','会話の自然さだけで成功を確定しません。トランスクリプトと最終状態を照合します。'],
  ['記録と実状態','音声の記録と業務状態を、同じタスクの結果へ結ぶ。','speech-to-speechでも評価・監査の記録を残します。音声の確認文と業務データの結果が一致するか確かめます。'],
  ['実環境と人手','騒音・言い直し・方言・電話品質を含め、人手でも確認する。','平均だけでなく分布と誤割込みを見ます。環境がきれいな音声だけで実利用の品質を決めません。'],
  ['更新を区分','STT・対話・地域・モデルIDの提供状態と終了予定を別々に追う。','元記事の確認日と予定を保持します。STTのGAをLive全体へ、旧IDのEOLを後継モデルへ拡張しません。']
 ])
})
export function slmComputerVoiceFrame(diagram,phase){const stages=SLM_COMPUTER_VOICE_STAGES[diagram];if(!stages)throw TypeError('Unknown SLM computer voice diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit decision state required')}
export function slmRoute({difficultInput,qualityAccepted,verifierPassed}){explicit([difficultInput,qualityAccepted,verifierPassed]);return {next:difficultInput?'upper-direct':qualityAccepted&&verifierPassed?'slm-candidate':'confirm-escalation',modelCalled:false,qualityGuaranteed:false}}
export function slmAdoption({groupQualityCompared,totalCostCompared,tailLatencyCompared,guardrailTask,safetyCompared}){explicit([groupQualityCompared,totalCostCompared,tailLatencyCompared,guardrailTask,safetyCompared]);return {reviewCandidate:groupQualityCompared&&totalCostCompared&&tailLatencyCompared&&(!guardrailTask||safetyCompared),deploymentExecuted:false}}
export function computerAction({scopeAllowed,budgetAvailable,targetChanged,approvalRequired,approved,stopped}){explicit([scopeAllowed,budgetAvailable,targetChanged,approvalRequired,approved,stopped]);return {next:stopped||!scopeAllowed||!budgetAvailable?'stop':targetChanged?'reobserve':approvalRequired&&!approved?'wait-approval':'action-candidate',operationExecuted:false}}
export function voiceHeardHistory({generatedSegments,playedSegments}){if(!Number.isInteger(generatedSegments)||!Number.isInteger(playedSegments)||generatedSegments<0||playedSegments<0||playedSegments>generatedSegments)throw TypeError('Valid generated and played ranges required');return {retainedSegments:playedSegments,unplayedSegments:generatedSegments-playedSegments,exactTranscriptGuaranteed:false}}
export function voiceRiskGate({repeatConfirmed,otherChannelApproved,currentTarget}){explicit([repeatConfirmed,otherChannelApproved,currentTarget]);return {reviewCandidate:repeatConfirmed&&otherChannelApproved&&currentTarget,operationExecuted:false}}
