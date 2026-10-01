import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CATALOGUE_OSS_LOCAL_STAGES=Object.freeze({
 'catalogue-common-map':rows([
  ['地図と時点','モデル名より先に、比較する軸と確認時点を見る。','カタログは確認時点の地図です。提供経路の実行確認や現在の推奨順位を図へ追加しません。'],
  ['役割とtier','上位・主力・軽量の役割と、思考の深さを分ける。','tierと推論設定は別の軸です。同名の設定が全モデルで使えるとは扱いません。'],
  ['文脈とmodal','入力できる量と形式を、必要なタスクへ照合する。','入力窓に収まることと、必要な情報を正しく使うことは別です。画像入力を音声・動画・生成へ一般化しません。'],
  ['費用と経路','入出力・cache・実行モードと、提供経路を別々に確認する。','本文の具体価格と確認日を保持します。旧モデルの料金や保持条件を新しい配布物へ転用しません。']
 ]),
 'catalogue-provider-boundaries':rows([
  ['Claudeの地図','Claudeの各役割を、確認日のファミリーへ対応させる。','本文は2026-09-10確認です。上位・主力・軽量・難関の区分を、全タスクの成績順位にしません。'],
  ['Claudeの条件','長文・cache・保持・token化の条件をモデルごとに読む。','旧世代のキャッシュ単価や同じ文章のtoken数を引き継いで計算しません。ZDRと保持期間の適用を別途照合します。'],
  ['GPTの地図','Astra・Sol・Lunaを、難関・主力・定型の候補として読む。','本文の2026-09-28部分確認を保持します。GPT-6掲載を前世代の提供終了に変換せず、自己タスクで評価します。'],
  ['GPTの条件','effort・長文料金・APIとCodexの経路・対象IDの予定を分ける。','同じ設定や退役日をファミリー全体へ転用しません。終了予定は実停止の確認ではなく、利用するIDの行へ照合します。'],
  ['Geminiの地図','主力Flashと軽量Flash-Lite、previewと安定版を区分する。','本文の個別仕様未確認と確認時点を保持します。前モデルの導入価格・終了告知を新モデルへ転用しません。']
 ]),
 'catalogue-openweight-licenses':rows([
  ['総量と稼働量','公開重みの規模を、メモリと計算の負担へ分けて読む。','MoEの稼働パラメータが少ないことを、小さな総メモリで動く保証にしません。図はGPU枚数や速度を新たに算出しません。'],
  ['重みとAPI','重みの公開、ホストAPIの条件、採用する配布物を区分する。','同じ系列でも公開経路・料金・ライセンスは異なります。ダウンロードできることを商用再提供の許諾にしません。'],
  ['配布物別の条件','対象事業・集計主体・期間・例外・表示義務を配布物ごとに読む。','元記事の具体しきい値を保持し、別の配布物へ条件を足しません。内部利用の例外を全条項の免除に拡張しません。'],
  ['早見表の使い方','用途から評価する開始候補を選び、公式条件へ戻る。','早見表は採用の決定ではありません。GA・preview・提供経路・料金・退役・LICENSEを再確認します。'],
  ['採用前に照合','仕様・条件・時点を、利用するモデルIDと配布物へ結ぶ。','図は法的適合・品質・提供終了を判定しません。原文のTODOと未確認を、採用時に照合する入口として保ちます。']
 ]),
 'oss-layers-permission':rows([
  ['四つの接点','ハブ・ツール・ローカル実行・標準を、採用する資産へ結ぶ。','単一のモデルだけでエコシステムを完成扱いしません。ハブの規約と資産そのものの許諾を区分します。'],
  ['層を区分','配布とカード、接着・推論、端末実行、標準の役割を見る。','同じOSSという語で役割・保守責任を一括りにしません。ハブ本体規約と禁止事項の別紙も確認します。'],
  ['許諾の三類型','寛容型・用途制限・独自規模条件を、確認する論点へ分ける。','寛容型にも表示等の義務があります。類型ラベルを契約全文の代わりにしません。'],
  ['公開とOSAID','公開重みと、四つの自由・変更に必要なアクセスを区分する。','OSAID 1.0は利用・研究・改変・共有とデータ情報・コード・パラメータを要求します。ダウンロード可能だけで適合へ昇格しません。']
 ]),
 'oss-provenance-maintenance':rows([
  ['カードを読む','想定用途・限界・データ・評価・license・base_modelを確認する。','カードが薄いことを安全へ変換せず、メタデータの宣言だけで許諾全文の確認を済ませません。'],
  ['系譜と受入','基盤・作成者・データ・派生工程をたどり、元の許諾を照合する。','FT・マージ・量子化や蒸留による派生でも条件を点検します。出所確認と受入は別の仕事です。'],
  ['保守と関与','保守者・更新・組織移管を見て、利用・貢献・公開の範囲を決める。','企業の関与は判断です。図から外部へ貢献・送信・公開せず、自社の配布でも取り込んだ資産の義務を確認します。'],
  ['同じ系列でも別','世代・配布物のLICENSEを、旧条件を流用せず読む。','原文のGemmaの世代差を保持します。条文の日付を適用開始日と推測せず、重みの許諾とOSAID適合も区分します。'],
  ['採用の確認','用途・対象版・系譜・保守を合わせ、未確認を残す。','図の状態は受入を検討する候補です。法的判定・安全認証・本番採用を実行しません。']
 ]),
 'local-runtime-selection':rows([
  ['端末と要件','ローカル・端末実行とサーバー側のセルフホストを区分する。','端末でのオフラインや外部送信の要件から始めます。実行場所だけで品質・安全を保証しません。'],
  ['得る価値と負担','オフライン・プライバシー・遅延・API課金と、端末の負担を比べる。','1回ごとのAPI課金がないことを、端末・電力・保守・配布も無料である総費用ゼロへ変換しません。'],
  ['三つの実行場所','端末・edge・ブラウザを、配置とハード制約へ対応させる。','インストール不要でもメモリ・性能の制約は残ります。edgeと端末内を同じデータ境界と扱いません。'],
  ['モデルと実行系','モデル・量子化形式・runtimeの対応を版ごとに確認する。','原文の2026-07の代表例を保持します。OpenAI互換APIは全機能互換や本番適合の保証ではありません。']
 ]),
 'local-quality-deployment':rows([
  ['品質の差を測る','量子化を含め、同じ実タスクでクラウドとの差を測る。','小型モデルの苦手領域と、入力分布の変化を確認します。図は精度の崖や遅延を架空の曲線にしません。'],
  ['昇格の条件','ローカルの品質不足と、クラウドを使える条件を合わせる。','低確信だけで機密を外部へ送信しません。ネットワークと外部送信の条件がない場合は、品質不足を残したまま停止・確認します。'],
  ['配布と互換','初回サイズ・保存容量・モデル形式とruntime版を管理する。','端末に配布できたことだけで、動作・品質の確認を完了しません。図はファイルを配布しません。'],
  ['端末ごとの更新','更新・切替・旧版・互換性を、端末ごとに確認する。','サーバーの一斉更新と同じとは扱いません。更新後も同じ実タスクで品質と戻せる経路を確認します。']
 ])
})
export function catalogueOssLocalFrame(diagram,phase){const stages=CATALOGUE_OSS_LOCAL_STAGES[diagram];if(!stages)throw TypeError('Unknown catalogue OSS local diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
export function assetAcceptance({versionVerified,useCompared,provenanceKnown,maintenanceAssessed}){const values=[versionVerified,useCompared,provenanceKnown,maintenanceAssessed];if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit asset state required');return {reviewCandidate:values.every(Boolean),legalComplianceGuaranteed:false,deploymentExecuted:false}}
export function localCloudRoute({localQualityAccepted,networkAvailable,externalUseAllowed}){const values=[localQualityAccepted,networkAvailable,externalUseAllowed];if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit local route state required');return {next:localQualityAccepted?'local':networkAvailable&&externalUseAllowed?'confirm-cloud-route':'hold-and-confirm',externalTransmissionExecuted:false,qualityGuaranteed:false}}
