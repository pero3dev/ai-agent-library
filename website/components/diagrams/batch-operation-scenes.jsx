'use client'
import {useId,useState} from 'react'
import {ReuseCanvas,ReuseFigure,ReusePair,ReuseThree,Text,Box,Wire,Select,Tokens} from './gateway-reuse-primitives'
import {batchRoute,batchItemNext,batchCapacity} from '../../lib/gateway-reuse-model.mjs'
export function BatchRouteCapacity({children}){
 const id=useId(),[missing,setMissing]=useState('deadline'),[work,setWork]=useState('embedding')
 const result=batchRoute({large:missing!=='small',deadlineLoose:missing!=='deadline',immediateRequired:missing==='immediate'}),works={evaluation:['評価スイート','回帰・一括採点','夜間の実行を検討'],embedding:['再埋め込み','モデルを移行','全chunkを再計算'],backfill:['backfill','過去の資料へ','要約やtagを付与'],classification:['一括分類・抽出','大量の資料へ','構造化の処理']}
 return <ReuseFigure diagram="batch-route-capacity" title="待てる大量処理の経路と、処理猶予・容量の条件" scene={({phase})=><ReuseCanvas diagram="batch-route-capacity" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['その場で要る処理と、急がない大量処理を分ける','即時性を手放す代わりに、契約の割引を使う','期限内の猶予を、全件成功の保証にしない','四つの対象を、業務の締切で点検する','大量・猶予・即時性不要を同時に確認する'][stage]}</Text>
 {stage===0&&<ReusePair left={['即時の経路','対話・その場の判定','ユーザーを待たせない','容量と時間は別に確認']} right={['待てる大量の経路','夜間・過去分の処理','非同期で後から回収','図は実投入しない']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<ReuseThree columns={[["処理の猶予","非同期で待つ","契約の割引"],["容量の枠","token・file","同時job上限"],["提供条件","modelと保持","現行版で確認"]]}/>}
 {stage===2&&<ReusePair left={['期限切れのjob','すべて成功とは限らない','未完了のエラーを回収','容量の上限も残る']} right={['完了した項目','成功結果を回収する','成功分は送り直さない','後で項目ごとに対応']} id={id} phase={phase} arrow={false}/>}
 {stage===3&&<><Tokens labels={['評価','再埋込','過去分','分類']} stage={Object.keys(works).indexOf(work)} y={90}/><Box x={65} y={190} width={510} height={164} title={works[work][0]} lines={[...works[work].slice(1),'即時性が必要なら別の経路']} tone="teal"/></>}
 {stage===4&&<ReusePair left={['バッチ対象の三条件','件数が多い','締切に猶予がある','一件ずつの即時性が不要']} right={[result.next==='batch-candidate'?'batchの検討候補':'即時経路も検討する','再投入と回収を見込む','切替先の容量も点検','条件だけで納期保証しない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>原文のTODOを保ち、現行の単価・上限・モデルは生成しない。</Text>
 </>}</ReuseCanvas>} controls={({stage,ready})=>stage===3?<Select label="締切を読む模式ワークロード" value={work} onChange={setWork} ready={ready}>{Object.entries(works).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===4?<Select label="バッチ対象で不足する条件" value={missing} onChange={setMissing} ready={ready}><option value="small">件数が少ない</option><option value="deadline">締切の猶予がない</option><option value="immediate">一件ずつ即時に要る</option><option value="none">三条件を照合</option></Select>:null}>{children}</ReuseFigure>
}
const states={succeeded:'成功',failed:'失敗',expired:'期限切れ',unknown:'結果不明'}
export function BatchResultsDeadlines({children}){
 const id=useId(),[status,setStatus]=useState('unknown'),[deadline,setDeadline]=useState('5'),[realtime,setRealtime]=useState('unknown')
 const item=batchItemNext(status),capacity=batchCapacity({queueTime:5,retryTime:2,recoveryTime:1,deadlineTime:Number(deadline),realtimeAvailable:realtime==='available'})
 return <ReuseFigure diagram="batch-results-deadlines" title="項目ごとの照合と再投入、二経路と納期の見積り" scene={({phase})=><ReuseCanvas diagram="batch-results-deadlines" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['大きいjobを分け、項目ごとの成否を残す','結果不明を、失敗した項目と同じ再投入にしない','同じ処理を、即時とbatchの二経路で呼ぶ','入出力の対応を、出力の並び順に依存させない','投入・再投入・回収に必要な猶予を見込む','進捗と失敗の偏りを、経路と納期へ戻す'][stage]}</Text>
 {stage===0&&<><Tokens labels={['分割','投入','回収','項目成否','部分再投入']} stage={3} y={90}/><ReusePair left={['原文の大量job例','1万件中30件が失敗','成功・失敗を記録する','巨大な一件にしない']} right={['必要な項目へ限定','失敗分だけを検討','成功分は送り直さない','図は実投入しない']} id={id} phase={phase} y={184}/></>}
 {stage===1&&<ReusePair left={[`項目の状態: ${states[status]}`,'入力版と業務のキー','項目の結果を記録','custom_idは対応のID']} right={[item.next==='keep-result'?'成功結果を保持する':item.next==='reconcile-job'?'既存jobを照合する':'対象項目の再投入を検討','不明のまま全件を再送しない','呼出し・課金の排除は別','図は再投入しない']} id={id} phase={phase}/>}
 {stage===2&&<><Box x={60} y={80} width={520} height={108} title="共有する処理ロジック" lines={['promptと後処理を同じ版で保つ','実行経路だけを分ける']} tone="teal"/><Wire id={id} d="M320 188V226M180 226H460" active phase={phase}/><Box x={32} y={248} width={260} height={122} title="即時" lines={['新しい資料の処理','その場で必要な入力']} tone="violet"/><Box x={348} y={248} width={260} height={122} title="batch" lines={['過去分の再計算','待てる大量の入力']} tone="amber"/></>}
 {stage===3&&<ReusePair left={['結果を対応づける','一意の入力キー','順序は保証されない','成功とerrorを別に回収']} right={['反映の重複排除','入力版と業務操作のID','受信側の契約を点検','保存と作用を原子的に']} id={id} phase={phase}/>}
 {stage===4&&<><ReuseThree columns={[["処理猶予","5 単位","模式の時間"],["部分再投入","2 単位","失敗分を見込む"],["結果の回収","1 単位","後処理も見込む"]]}/><Text x={320} y={332} center>{`必要な猶予 ${capacity.needed} ／ 締切まで ${deadline} ／ 余裕 ${capacity.margin}`}</Text><Text x={320} y={366} center small>{capacity.next==='batch-plan-review'?'batch計画の検討候補':capacity.next==='realtime-capacity-review'?'即時経路の容量を別に確認':'締切と実行計画を見直す'}</Text></>}
 {stage===5&&<ReusePair left={['概算と監視','件数 × token × 単価','進捗・成功率・完了時間','失敗の偏りを読む']} right={['締切へ戻す','切替の条件を先に持つ','即時側も容量に限界','図は課金・切替をしない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>時間は無単位の模式値。識別子だけで呼出し・課金の重複は防げない。</Text>
 </>}</ReuseCanvas>} controls={({stage,ready})=>stage===1?<Select label="再投入を読む模式の項目状態" value={status} onChange={setStatus} ready={ready}>{Object.entries(states).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>:stage===4?<><Select label="締切までの模式時間" value={deadline} onChange={setDeadline} ready={ready}><option value="5">5 単位</option><option value="8">8 単位</option><option value="10">10 単位</option></Select><Select label="即時経路の模式状態" value={realtime} onChange={setRealtime} ready={ready}><option value="unknown">利用可否が未確認</option><option value="available">経路はある: 容量は別に確認</option></Select></>:null}>{children}</ReuseFigure>
}
