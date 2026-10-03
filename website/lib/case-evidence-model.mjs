import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=v=>Object.freeze(v.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CASE_EVIDENCE_STAGES=Object.freeze({
 'support-scope-gates':rows([
 ['範囲を絞る','定型質問の下書きから始め、送信判断を人に置く。','構成事例の4割・60%・50件は実測や自社基準ではありません。'],
 ['要件と基準','入力・出力・自律度・人・data・失敗時を合意する。','原文の表は8項目のうち主要6項目。ベースラインと成功基準は自社で測ります。'],
 ['PoCの問い','代表評価で検索と生成を分け、使える下書きか調べる。','よい数件のdemoだけで採用しない。知識源の鮮度が保てない請求関連は範囲外にします。'],
 ['本番の関門','認証・権限検索・容量・会話dataの四観点を照合する。','機能が動くことを本番化完了へ変換しません。図は実認証やデプロイをしません。'],
 ['容量と責任','非同期受付とprovider枠、queue範囲とvaultを結ぶ。','workerを増やすだけでrate limitが増えるとは扱わない。原文のサービスアカウントを保持。'],
 ['合意へ戻す','要件と評価・本番化の残課題を、次の判断へ渡す。','構成事例の成果を実案件の成功や安全の実証にしません。']
 ]),
 'support-rollout-return':rows([
 ['shadowの比較','人の回答と比較し、下書きは担当者へまだ提示しない。','作用を持たない構成を確かめる。外部作用を許したままshadowと呼びません。'],
 ['限定の提示','一部の担当者と定型質問だけへ、下書きを提示する。','採用率・修正距離・時間・費用を新旧で比べ、条件を越えたら広げません。'],
 ['失敗から改善','検索・口調などを分け、原因に対応する構成と評価へ戻す。','利用者信号を品質の確定にしない。改善後の代表ケースを回帰へ加えます。'],
 ['純削減を測る','生成で浮いた時間から、reviewと引取り時間を差し引く。','当初の試算を実績で更新する。図は新しい実測値を作りません。'],
 ['段階を広げる','範囲・自律度を別の軸にし、合意と測定に基づいて広げる。','抜き取りへ移る条件と将来計画を事前に書く。カテゴリ合格を全問い合わせへ転用しません。']
 ]),
 'analysis-error-context':rows([
 ['動くが誤る','SQLが実行できても、集計の意味は誤り得る。','架空事例の構成の変化です。実測の改善効果や網羅的な誤り一覧ではありません。'],
 ['静かな三誤り','取消・単位・一対多の結合の三つを対応づける。','エラーがないことや綺麗なグラフを、数字の正しさへ変換しません。'],
 ['意味を渡す','スキーマへ業務の意味と単位を添え、分析用ビューへ絞る。','取消の除外・結合・税抜税込の定義を、文脈とdata側で確認します。'],
 ['指標を一元化','検証済みSQL断片で、売上・粗利をその場で再定義させない。','意味を整えても誤りゼロを保証しない。追加の実行検証が必要です。'],
 ['次の検証へ','v1の実行とv2の文脈を、v3の意味照合へつなぐ。','modelを変える前に与えるものを確認し、重要数値の独立検証へ進みます。']
 ]),
 'analysis-validation-return':rows([
 ['二つの照合','既知値と、意味を独立に確かめた別経路集計を使う。','SQL表現だけを変えて同じ誤定義を共有すると一致しても誤ります。'],
 ['根拠を見せる','SQL・対象期間・filterを必ず併記して、確認できる下書きにする。','グラフだけでは何を数えたか検証できません。'],
 ['判断を保留','確度や前提が不足するときは、無理に数値を断定しない。','条件の照合は実queryの検証ではありません。図はdataやSQLを実行しません。'],
 ['利用者と回帰','重要判断の確認を伝え、現場の誤りを正解つき評価へ還流する。','利用者の理解だけに頼らず、変更時の回帰を検知する構造を保ちます。'],
 ['教訓を戻す','文脈・独立検証・根拠・保留を、毎回の分析に戻す。','事例の誤りパターンは網羅ではない。自社の取消・単位・結合条件を確認します。']
 ]),
 'mail-capability-path':rows([
 ['要約の依頼','ユーザーは要約を依頼し、外部メールは未信頼dataとして入る。','架空の漏えい事例です。ユーザーが攻撃を要求したとは扱いません。'],
 ['最初の入口','外部メールの要約で、未信頼コンテンツへ接触する。','単体機能だけで全安全を判断せず、構成変更で信頼境界を見直します。'],
 ['私的dataを追加','横断検索の追加で、非公開メール・社内文書へ届く。','未信頼入力と非公開dataが同じ処理へ入る点を追います。'],
 ['送信能力を追加','送信toolと外部画像の自動取得が、外部通信の経路になる。','toolに承認があっても、UIの応答表示経路は別に点検が必要です。'],
 ['指示の誤解釈','外部メールの指示をタスクへ昇格し、私的dataが応答へ流れる。','攻撃文面を再生・実行せず、境界とdataの流れを記号で示します。'],
 ['表示から送信へ','UIが外部資源を取得すると、URLに含むdataも相手へ届く。','画像proxyだけでpath/queryのdataは隠れない。承認tool以外の経路を含めます。']
 ]),
 'mail-containment-return':rows([
 ['検知の二経路','外部通信・検索の異常と、利用者の報告を照合する。','観測は影響調査の入口。alertの存在だけで封じ込め完了とは扱いません。'],
 ['送信を先に止める','外部画像と通信を遮断し、進行中のsessionを停止する。','読み取りmodeや検索停止だけでは、既存履歴からの漏えい経路が残ります。'],
 ['限定で再開','遮断を確認した後、旧履歴を使わない限定の要約へ戻す。','安全な通信制限を確認できない機能は停止を保つ。図は実再開を行いません。'],
 ['構造から直す','自動取得禁止と処理の分離、承認と回帰を組み合わせる。','分離・要約だけを無害化へ、proxyをURL内容の保護へ変換しません。'],
 ['影響と回帰','構成版とtraceから影響範囲を調べ、持ち出し防止を回帰へ残す。','停止は既送信の取消ではない。全影響を特定できたかは実調査で確認します。'],
 ['変更で再点検','単体機能の便利さから、組み合わせと実送信経路へ戻る。','攻撃文面の一例を弾くだけで安全とは扱わない。図は攻撃・通信を実行しません。']
 ])
})
export function caseEvidenceFrame(diagram,phase){const stages=CASE_EVIDENCE_STAGES[diagram];if(!stages)throw TypeError('Unknown case diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
export function supportGate({identity,authorizedRetrieval,capacity,dataAgreement}){const v=[identity,authorizedRetrieval,capacity,dataAgreement];bools(v);return {reviewCandidate:v.every(Boolean),deployed:false}}
export function supportRelease(mode){if(!['shadow','canary','expanded'].includes(mode))throw TypeError('Unknown release mode');return {draftVisible:mode!=='shadow',humanSendDecision:true,allInquiriesCovered:false,actualRelease:false}}
export function analysisValidation({knownValueMatched,independentMeaningChecked,conditionsShown,assumptionsClear,regressionCovered}){const v=[knownValueMatched,independentMeaningChecked,conditionsShown,assumptionsClear,regressionCovered];bools(v);return {reviewCandidate:v.every(Boolean),queryVerified:false,allErrorsPrevented:false}}
export function mailCapabilities(month){if(!Number.isInteger(month)||month<0||month>2)throw TypeError('Only three original addition stages');return {untrustedContent:true,privateData:month>=1,externalChannel:month>=2,trifecta:month>=2,safe:false}}
export function mailEgress({externalFetchAllowed,sensitiveUrl,proxy}){bools([externalFetchAllowed,sensitiveUrl,proxy]);return {illustratedLeakPath:externalFetchAllowed&&sensitiveUrl,proxyHidesData:false,requestSent:false}}
export function mailContainment({imageFetchBlocked,egressBlocked,sessionsStopped,controlsVerified,freshHistory}){const v=[imageFetchBlocked,egressBlocked,sessionsStopped,controlsVerified,freshHistory];bools(v);return {limitedRestartCandidate:v.every(Boolean),priorSendsUndone:false,restarted:false}}
