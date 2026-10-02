import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const HARDWARE_SERVING_STAGES=Object.freeze({
 'hardware-weights-runtime':rows([
 ['提供の場所','API・自ホスト・端末内の実行を、ハードの責任で読む。','APIを借りる判断とモデル提供層・端末の正本を分担します。図は購入を行いません。'],
 ['並列の計算','大量の行列積を、同じ計算の並列処理へ結ぶ。','CPUとの速度比は行列・精度・転送・実装が揃った実測が必要です。'],
 ['重みの容量','パラメータ数とbyte数から、重みの容量を概算する。','図は原文の7Bの算術例です。十進GBであり、実modelのピーク容量ではありません。'],
 ['精度と余裕','FP16・INT8・INT4の重みと、KV・作業領域を分ける。','量子化のmetadata・未量子化層もあり、重みだけで搭載を保証しません。'],
 ['載ると速い','複数GPUへの分割やCPU・diskへの退避と、実用速度を分ける。','退避の転送・同期負担を実測する。図は実modelをロードしません。'],
 ['品質の条件','量子化後の自社品質と、ピーク時の使用量を点検する。','低精度の容量だけで採用しません。想定文脈・同時実行も評価へ含めます。']
 ]),
 'hardware-bottleneck-purchase':rows([
 ['二つの律速','演算量と読み書きするbyte量から、限界を分ける。','FLOPSだけで速度を判断しません。実装や階層の影響もあります。'],
 ['処理段階','小batchの逐次生成と、入力一括・大batchの条件を比べる。','逐次生成は帯域が効きやすく、入力一括や大batchは演算の寄与が増えます。'],
 ['三つのハード','datacenter GPU・consumer GPU・端末アクセラレータを、用途で読む。','容量・帯域・消費電力・対応runtimeを照合する。最新製品の値を生成しません。'],
 ['調達と総費用','従量／予約・専有・購入を、稼働率とTCOで比べる。','電力・冷却・設置・保守・人件費・陳腐化も含む。図は実価格を算定しません。'],
 ['運用も保有','driver・故障・容量・電力・世代追従を、保有の仕事として読む。','要求品質を満たす処理件数あたりで比較する。買えば安いとは断定しません。']
 ]),
 'serving-engines-throughput':rows([
 ['提供層の分担','model提供層を、model選定とアプリ容量の設計から分ける。','自ホストと端末の実行を分担する。図は実serverを立てません。'],
 ['借りると持つ','主権・閉域・custom model・遅延と、稼働率込みの費用で判断する。','GPU費だけでなく人件費・冗長化・更新も含む。低稼働率を無視しません。'],
 ['engineの選定','高throughputと軽量の類型、hardware・互換・許諾・保守を照合する。','代表例は原文の2026-08時点。TGIのarchive等の旧観測を現在の推奨にしません。'],
 ['空き枠へ投入','開始・終了が揃わない要求を、空いたslotへ追加する。','連続batchingの模式時間です。実処理の速度・順序・完了を保証しません。'],
 ['KVとengine','KVを効率よく保持する機能と、成熟engineの利用を結ぶ。','再発明せず機能を選ぶ。長い文脈・多数同時のピーク容量を別に点検します。']
 ]),
 'serving-memory-rollout':rows([
 ['三つの容量','重み・KV・作業領域を、総VRAMの見積りへ含める。','重みが載っても同時実行で溢れ得ます。図は実allocatorを測りません。'],
 ['同時と文脈','同時実行と文脈長が増えると、KVの必要量が増える。','数値は無単位の模式入力です。実modelのhead・層・dtypeを含む算定ではありません。'],
 ['品質も評価','量子化で容量を減らすとき、levelごとに自社品質を確認する。','落ち方はmodel・task・手法で変わる。載るだけで本番へ進みません。'],
 ['提供層の監視','GPU・VRAM・throughput・queue・tailを、アプリtraceへ接続する。','throughput改善と混雑時の末尾遅延を両方観測します。'],
 ['配布と切替','大きい重みの配布・load時間と、新旧稼働・切戻しを設計する。','新旧の容量も必要です。図は実配布・切替を行いません。'],
 ['変更を連動','model更新を評価・キャッシュ無効化・版管理へ結ぶ。','weightファイルの入替えだけで更新完了にしません。各正本へ戻して確認します。']
 ]),
 'environment-scope-mechanisms':rows([
 ['二つの面','自分で動かす効率化と、測定・報告の備えを分ける。','費用・電力量・排出は別の量です。図は環境負荷を実測しません。'],
 ['減らす機構','計算量削減・稼働効率・電源の炭素強度を分けて読む。','batchの割引から計算や電力の削減率は推定できません。'],
 ['範囲を揃える','学習と推論、施設とIT、電力と水・炭素の境界を揃える。','1回の効率と使用回数・task構成を分けます。将来需要の単一値を生成しません。'],
 ['PUEの位置','施設付帯の比率と、電源の炭素強度を分ける。','低PUEだけで低排出とは言えません。図の電力と炭素の単位は模式入力です。'],
 ['八つの施策','施策ごとの作用と品質・前提を、費用以外の量へ対応づける。','履歴要約にも計算と情報欠落、cacheにも誤hitの制御が残ります。'],
 ['総使用量へ戻る','削減候補を自社品質と総使用量・同じ算定境界で測る。','regionや時間帯の移動は遅延・主権と両立する範囲で選びます。']
 ]),
 'environment-measure-report':rows([
 ['推計の前提','hardware・時間・立地と、実測／推計の範囲を明示する。','SCIの機能単位とAI lifecycleを読む。GSFのAI拡張をISO規格化済みにしません。'],
 ['開示の境界','scope・期間・算定法と第三者保証の範囲を揃える。','プロバイダーの自己申告をそのまま社間比較へ使いません。推計は前提で大きく動きます。'],
 ['後継の観測','AWS後継GAと旧CCFTの非推奨告知、実画面の停止を区別する。','原文09-21の確認範囲を保つ。アカウントの権限・移行確認は未実施です。'],
 ['版と配賦','infraと第三者ソフトの境界、方法論の版・公表年と実績年を記録する。','月次サービスの推計を個別AI要求の実測にしません。旧データ再計算も考慮します。'],
 ['報告の確認先','義務と自主開示、取引先照会を区分し、専門担当へ照合する。','原文の制度の時点・適用未確認を保持する。図は法律の解釈や自社適用を判定しません。']
 ]),
 'environment-honest-claims':rows([
 ['主張を分ける','実削減と、相殺・証書・水補充・将来目標を分ける。','net zeroやnegativeの言葉だけで実消費の削減とは扱いません。'],
 ['年間と瞬間','年間証書のmatchingを、使用時点の低炭素電力にしない。','24/7 CFEは年間matchingと異なる主張です。図は供給の実績を測りません。'],
 ['実施した施策','right-sizing・cache・空回り抑制を、実施内容として説明する。','施策の名前だけで成果を確定せず、品質と総使用量を測ります。'],
 ['誠実な計測','出典・確認日・前提とrange、比較した境界を伴って示す。','単一の断定値や境界が異なる社間順位を生成しません。'],
 ['照会に備える','平時の自社使用分と前提を、説明できる状態へ戻す。','報告の義務・適用は法務とsustainability担当へ確認する。図は実提出しません。']
 ])
})
export function hardwareServingFrame(diagram,phase){const stages=HARDWARE_SERVING_STAGES[diagram];if(!stages)throw TypeError('Unknown hardware serving diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
const integer=v=>{if(v.some(n=>!Number.isInteger(n)||n<0||n>200))throw TypeError('Bounded toy quantities required')}
export function weightBytes(precision){if(!['fp16','int8','int4'].includes(precision))throw TypeError('Known precision required');return {weightsGB:7*({fp16:2,int8:1,int4:.5}[precision]),decimalGB:true,peakMeasured:false}}
export function precisionReview({qualityChecked,peakChecked,runtimeSupported}){const v=[qualityChecked,peakChecked,runtimeSupported];bools(v);return {reviewCandidate:v.every(Boolean),adopted:false}}
export function toyOwnershipCost(requests){integer([requests]);const api=3*requests,self=120+requests;return {api,self,next:self<api?'self-cost-review':self===api?'equal-cost-review':'api-cost-review',purchased:false}}
export function batchingSlots(step){if(!Number.isInteger(step)||step<0||step>2)throw TypeError('Known toy step required');const states=[['A','B'],['C','B'],['C','D']];return {slots:[...states[step]],completed:step===0?[]:step===1?['A']:['A','B'],measured:false}}
export function toyKvDemand({concurrency,context}){integer([concurrency,context]);const kv=concurrency*context,total=14+kv+2;return {weights:14,kv,workspace:2,total,capacity:24,within:total<=24,loaded:false}}
export function modelUpdateReview({distributed,rollbackReady,evaluationDone,cacheLinked,versionRecorded}){const v=[distributed,rollbackReady,evaluationDone,cacheLinked,versionRecorded];bools(v);return {reviewCandidate:v.every(Boolean),switched:false}}
export function toyFacilityImpact({pue,intensity}){if(![1,1.5,2].includes(pue)||![1,3].includes(intensity))throw TypeError('Known toy impact factors required');return {itEnergy:10,facilityEnergy:10*pue,carbonUnits:10*pue*intensity,measured:false}}
export function environmentalComparison({sameScope,samePeriod,sameMethod,sameUnit,sameVersion}){const v=[sameScope,samePeriod,sameMethod,sameUnit,sameVersion];bools(v);return {reviewCandidate:v.every(Boolean),comparisonMade:false}}
