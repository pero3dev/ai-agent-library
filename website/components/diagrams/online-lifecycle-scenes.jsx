'use client'
import {useId,useState} from 'react'
import {LifecycleCanvas,LifecycleFigure,LifecyclePair,LifecycleThree,Text,Box,Select,Tokens} from './evaluation-lifecycle-primitives'
import {onlineRelease} from '../../lib/evaluation-lifecycle-model.mjs'
const signals={complete:['完了とエスカレーション','タスクに合う主指標','成功の代理を読む','正解そのものにせず'],repair:['修正とやり直し','修正距離・言い直し','タスクの負担を観測','修正ゼロを正解にせず'],explicit:['明示的な評価','評価ボタン・報告','低い回答率と理由','回答者の偏りを保持']}
const guards={cost:'費用／リクエスト',latency:'レイテンシp95',error:'エラー率',safety:'安全性の逸脱',none:'合意したガード内'}
export function OnlineSequenceSignals({children}){
 const id=useId(),[signal,setSignal]=useState('complete'),[guard,setGuard]=useState('cost')
 return <LifecycleFigure diagram="online-sequence-signals" title="固定セットから本番分布へ進む順序と観測" scene={({phase})=><LifecycleCanvas diagram="online-sequence-signals" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['リリース前の関門と、本番の効果を補完する','劣化案を先に落とし、実利用者への影響を絞る','タスクに合う代理指標と、その偏りを読む','主指標の改善でも、ガード違反は失敗','検証したjudgeを、標本へ限定して使う'][stage]}</Text>
  {stage===0?<LifecyclePair id={id} phase={phase} arrow={false} left={['オフライン評価','固定セット・再現比較','速く安く、劣化案を落とす','実反応は分からない']} right={['オンライン評価','本番分布と利用者反応','遅く、実利用者へ影響','交絡と観測期間を確認']}/>:stage===1?<>
   <Tokens labels={['固定セット','少量観測','新旧比較','展開判断']} y={96} selected={[0,1,2,3]}/>
   <LifecyclePair id={id} phase={phase} y={204} arrow={false} left={['通過してから進む','劣化案は修正へ','影響範囲を制限','本番デバッグにせず']} right={['作用の境界','シャドーは記録のみ','副作用toolを実行せず','旧構成を利用者へ']}/>
  </>:stage===2?<Box x={64} y={104} width={512} height={207} title={signals[signal][0]} lines={signals[signal].slice(1)} tone="violet"/>:stage===3?<LifecyclePair id={id} phase={phase} arrow={false} left={['主指標','改善を観測しても','費用・p95・エラー・安全','同時に監視する']} right={[guard==='none'?'ガード内を確認':'ガード違反の模式入力',guards[guard],guard==='none'?'他の採用条件も必要':'主指標の改善でも失敗','図は実計測でない']}/>:<LifecyclePair id={id} phase={phase} left={['本番出力の標本','全量を採点しない','費用・遅さを考慮','利用方針と文脈を保持']} right={['検証済みjudge','人手との検証を保つ','判断が必要な観点','合格を業務完了にせず']}/>}
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===2?<Select label="本番で読む品質シグナル" value={signal} onChange={setSignal} ready={ready}>{Object.entries(signals).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===3?<Select label="本番のガード条件" value={guard} onChange={setGuard} ready={ready}>{Object.entries(guards).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>:null}>{children}</LifecycleFigure>
}
const pitfalls={traffic:['少トラフィック','期間と指標感度を検討','無理に有意差を作らず','offline・shadow・人手へ'],multiple:['多重比較','主指標を事前に絞る','探索は仮説として残す','後付けの勝者にせず'],novelty:['新奇性・学習効果','短期の数字で決めず','定常状態まで観測','遅れる成否も追う'],confound:['交絡と層の差','ランダムな固定割付','主要層の一貫性','選択者の偏りを点検'],unmeasured:['成否を測れない','A/Bの結論を作らない','offlineと人手へ戻す','信号を取れる範囲へ']}
export function OnlineComparisonRelease({children}){
 const id=useId(),[missing,setMissing]=useState('guard'),[pitfall,setPitfall]=useState('traffic')
 const release=onlineRelease({offlineMet:missing!=='offline',assignmentStable:missing!=='assignment',criteriaFixed:missing!=='criteria',sampleSufficient:missing!=='sample',periodObserved:missing!=='period',guardrailsMet:missing!=='guard',rollbackReady:missing!=='rollback'})
 return <LifecycleFigure diagram="online-comparison-release" title="比較実験・段階展開・旧構成へ戻す条件" scene={({phase})=><LifecycleCanvas diagram="online-comparison-release" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['同じ利用者・セッションは、同じ比較群へ','指標・基準・標本数・期間を開始前に定める','改善の比較と、壊れていない確認を分ける','違反で戻す経路を、展開前に用意する','新構成へ流す入力と、外部作用を分ける','結論を歪める条件を、独立に点検する'][stage]}</Text>
  {stage===0?<LifecyclePair id={id} phase={phase} arrow={false} left={['A群: 旧構成','同じ利用者を固定','リクエストで行き来せず','比較の一貫性を保つ']} right={['B群: 新構成','同じ利用者を固定','ランダムに割付','層別でも結果を点検']}/>:stage===1?<LifecycleThree columns={[['事前に定義','主指標と成功基準','後付けで選ばず','比較の開始前'],['標本数','検出したい差','必要な量を見積る','偶然で打切らず'],['観測期間','遅れて現れる成否','信頼と学習の変化','短期の数字で決めず']]}/>:stage===2?<>
   <LifecyclePair id={id} phase={phase} arrow={false} left={['A/B: 改善の比較','新旧を同時に観測','事前の成功条件','標本・期間・割付']} right={['カナリア: 段階展開','少量から広げる','新旧のガードを比較','違反で旧へ戻す']}/>
   <g data-online-review-candidate={String(release.reviewCandidate)} data-online-rollback-candidate={String(release.rollbackCandidate)} data-online-deployed="false" data-online-effects-undone="false"><Text y={337} small>{release.rollbackCandidate?'ガード違反: 旧構成へ戻す候補':release.reviewCandidate?'条件照合済み: 展開を検討する候補':'不足する条件が残る: 判定を保留'}</Text></g>
  </>:stage===3?<LifecyclePair id={id} phase={phase} left={['合意した違反条件','費用・エラー・安全','閾値を超えたら切替','人手待ちにせず']} right={['用意したフラグ経路','デプロイなしで旧へ','切替が実際に効くか確認','既作用の取消でない']}/>:stage===4?<LifecyclePair id={id} phase={phase} arrow={false} left={['旧構成: 利用者へ','通常の回答を返す','必要な作用を制御','比較の基準を記録']} right={['新構成: 記録のみ','本番分布を観測','副作用toolは実行せず','勝者の確定にせず']}/>:<Box x={64} y={104} width={512} height={207} title={pitfalls[pitfall][0]} lines={pitfalls[pitfall].slice(1)} tone="amber"/>}
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===2?<Select label="本番比較の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="offline">オフラインの関門</option><option value="assignment">固定した割付</option><option value="criteria">事前の成功条件</option><option value="sample">必要な標本数</option><option value="period">観測期間</option><option value="guard">ガード違反</option><option value="rollback">旧へ戻す経路</option><option value="none">必要条件を照合</option></Select>:stage===5?<Select label="比較実験の落とし穴" value={pitfall} onChange={setPitfall} ready={ready}>{Object.entries(pitfalls).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:null}>{children}</LifecycleFigure>
}
