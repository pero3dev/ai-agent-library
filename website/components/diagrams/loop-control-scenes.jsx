'use client'
import { useState } from 'react'
import { HarnessFigure,HarnessCanvas,Text,Box,Wire,Select } from './harness-loop-primitives'
import { loopBudget,completionCheck } from '../../lib/harness-loop-model.mjs'
export function LoopTypeStopping({ children }) {
  const [type,setType]=useState('phases'),[evidence,setEvidence]=useState('claim'),[dimension,setDimension]=useState('none')
  const completion=completionCheck(evidence),budget=loopBudget(dimension)
  return <HarnessFigure diagram="loop-type-and-stopping" title="ループの自由度と、完了・上限の判定"
    controls={({stage,ready})=>stage===1?<Select label="ループの型" value={type} onChange={setType} ready={ready}><option value="free">自由ループ</option><option value="phases">フェーズ制</option><option value="machine">状態機械</option></Select>:stage===2?<Select label="完了を裏付ける情報" value={evidence} onChange={setEvidence} ready={ready}><option value="claim">モデルの自己申告のみ</option><option value="verified">検証器で確認</option><option value="unverifiable">検証不能：事前基準で判断</option></Select>:stage===3?<Select label="超えた予算の次元" value={dimension} onChange={setDimension} ready={ready}><option value="none">すべて上限内</option><option value="steps">ステップ</option><option value="tokens">トークン</option><option value="time">時間</option><option value="cost">費用</option></Select>:null}
    scene={s=><HarnessCanvas diagram="loop-type-and-stopping" {...s}>{f=><>
      <Text y={35}>{['長く回すために、制御の時間軸を設計する','必要な最小限の自由度を選ぶ','「できました」を、確認できた完了へ','一つでも上限を超えれば、継続を止める','停止するときにも、成果と現在地を返す'][f.stage]}</Text>
      {f.stage===0?<>
        {['考える','行動する','立ち止まる'].map((name,i)=><g key={name}><Box x={32+i*197} y={120} width={182} height={105} title={name} tone={i===2?'amber':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 171H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Wire id={s.id} d="M517 225V302H123V225" active phase={f.phase} tone="violet"/><Text y={365} small>いつ見直し、いつ終えるかを、ループへ組み込む</Text>
      </>:f.stage===1?<>
        {type==='free'?<>
          <Box x={32} y={114} width={260} height={127} title="毎周のモデル判断" lines={['次の一手を決める']} tone="violet"/><Wire id={s.id} d="M292 178H340" active phase={f.phase}/><Box x={348} y={114} width={260} height={127} title="行動と観測" lines={['探索的・手順は未確定']}/><Wire id={s.id} d="M478 241V302H163V241" active phase={f.phase}/>
        </>:<>
          {(type==='phases'?['計画','実行','検証']:['状態 A','状態 B','状態 C']).map((name,i)=><g key={name}><Box x={32+i*197} y={127} width={182} height={107} title={name} tone={i===1?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 180H${222+i*197}`} active phase={f.phase}/>}</g>)}
          <Box x={118} y={278} width={404} height={73} title={type==='phases'?'各フェーズの中は自由ループも可能':'遷移をコードで固定'} tone="amber"/>
        </>}
        <Text y={406} small>{type==='free'?'柔軟だが、迷走・堂々巡りを監視':type==='phases'?'フェーズ境界を設計し、柔軟性を残す':'堅牢だが、想定外の手順に弱い'}</Text>
      </>:f.stage===2?<>
        <Box x={32} y={108} width={260} height={132} title="モデルの完了申告" lines={['主観だけに委ねない']} tone="violet"/><Wire id={s.id} d="M292 174H340" active phase={f.phase} tone={completion.completed?'teal':'amber'}/>
        <Box x={348} y={108} width={260} height={132} title={completion.label} lines={evidence==='verified'?['テスト・スキーマ・照合']:evidence==='claim'?['完了判定を保留']:['何をもって完了か', '先に基準を示す']} tone={completion.completed?'teal':'amber'} data-loop-completed={String(completion.completed)}/>
        <Text y={332} small>{['検証器の範囲で、確認できることを裏付ける', '検証できないタスクでは、事前基準で判断する']}</Text>
      </>:f.stage===3?<>
        {['steps','tokens','time','cost'].map((key,i)=><Box key={key} x={32+(i%2)*292} y={77+Math.floor(i/2)*105} width={284} height={82} title={['ステップ','トークン','時間','費用'][i]} lines={[key===dimension?'上限に到達':'この次元は上限内']} tone={key===dimension?'amber':'teal'}/>)}
        <Box x={114} y={309} width={412} height={79} title={budget.stop?'継続を止め、部分成果を返す':'すべての予算を確認して継続'} tone={budget.stop?'amber':'teal'} data-loop-budget-stop={String(budget.stop)}/>
      </>:<>
        <Box x={32} y={100} width={260} height={173} title="未完了でも残す" lines={['途中経過・成果物', '未完了の理由', '次にやるべきこと']} tone="amber"/><Box x={348} y={100} width={260} height={173} title="配分を見直す" lines={['難しいサブタスクへ寄せる', '簡単な工程は早く切上げる']} tone="violet"/>
        <Text y={352} small>予算配分を変えても、全体の上限は守る</Text>
      </>}
    </>}</HarnessCanvas>}>{children}</HarnessFigure>
}
export function LoopReplanningRecovery({ children }) {
  const [intervention,setIntervention]=useState('hint'),[route,setRoute]=useState('failed')
  return <HarnessFigure diagram="loop-replanning-recovery" title="計画を見直し、失敗した経路を避けて戻る"
    controls={({stage,ready})=>stage===2?<Select label="停滞への介入" value={intervention} onChange={setIntervention} ready={ready}><option value="hint">別の方法へのヒント</option><option value="restart">外部化状態から仕切り直す</option><option value="human">人へ引き継ぐ</option></Select>:stage===3?<Select label="保存して戻る情報" value={route} onChange={setRoute} ready={ready}><option value="failed">状態と失敗経路の要約</option><option value="state">状態だけ：同じ失敗へ戻りうる</option></Select>:null}
    scene={s=><HarnessCanvas diagram="loop-replanning-recovery" {...s}>{f=><>
      <Text y={35}>{['行動より粗いリズムで、前提を確認する','反復と停滞を、コードで検知する','軽い介入から、人への引き継ぎまで','戻った後に、同じ失敗経路を避ける','長いタスクを、子ループとフェーズへ','柔らかな誘導と、強制する上限を併用する'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={99} width={260} height={157} title="見直す節目" lines={['フェーズ完了', '大きな失敗・新情報']} tone="violet"/><Wire id={s.id} d="M292 177H340" active phase={f.phase}/><Box x={348} y={99} width={260} height={157} title="計画の前提" lines={['まだ成り立つか', '崩れたら再計画']}/>
        <Text y={344} small>{['毎周の方針変更は、往復を増やす', '古い前提のまま、実行を続けない']}</Text>
      </>:f.stage===1?<>
        {['同一のツール・引数','同じエラーを反復','成果物・進捗が停滞'].map((name,i)=><Box key={name} x={77} y={80+i*95} width={486} height={67} title={name} tone={i===2?'amber':'violet'}/>)}
        <Text y={402} small>閾値を先に決め、悪化する前に介入する</Text>
      </>:f.stage===2?<>
        <Box x={32} y={109} width={260} height={146} title="停滞を検知" lines={['放置して上限を消費しない']} tone="amber"/><Wire id={s.id} d="M292 183H340" active phase={f.phase}/>
        <Box x={348} y={109} width={260} height={146} title={{hint:'別の方法を促す',restart:'状態から入力を再構成',human:'人へ引き継ぐ'}[intervention]} lines={{hint:['軽いヒントで介入'],restart:['汚染した履歴を離す'],human:['試したこと・残りを渡す']}[intervention]} tone="violet"/>
        <Text y={344} small>自動回復を保証せず、介入の強さを選ぶ</Text>
      </>:f.stage===3?<>
        <Box x={32} y={93} width={260} height={169} title="保存する情報" lines={route==='failed'?['チェックポイントの状態','失敗した試みの要約']:['チェックポイントの状態','失敗経路の記録がない']} tone="violet"/>
        <Wire id={s.id} d="M292 177H340" active phase={f.phase}/><Box x={348} y={93} width={260} height={169} title={route==='failed'?'別の手段へ':'同じ失敗へ戻る危険'} lines={['探索済みの経路を避ける','外部の副作用は消えない']} tone={route==='failed'?'teal':'amber'} data-failed-route-retained={String(route==='failed')}/>
        <Text y={352} small>状態の復元と、副作用の安全な再実行を分ける</Text>
      </>:f.stage===4?<>
        <Box x={32} y={109} width={260} height={131} title="親の短いループ" lines={['要点と参照を受け取る','戻り値を検証']} tone="violet"/><Wire id={s.id} d="M292 174H340" active phase={f.phase}/><Box x={348} y={109} width={260} height={131} title="独立した子ループ" lines={['調査などの工程を分離','子にも予算上限']} />
        <Text y={333} small>{['フェーズ境界で、圧縮・保存・再計画', '子の探索ログを、すべて親へ流し込まない']}</Text>
      </>:<>
        <Box x={32} y={109} width={260} height={154} title="プロンプトで促す" lines={['別の手段を検討する','節目で計画を見直す']} tone="violet"/><Box x={348} y={109} width={260} height={154} title="コードで固定" lines={['予算・危険操作の停止','反復の検知と介入']} tone="amber"/>
        <Text y={348} small>{['誘導が効かなくても、上限を破らせない','ヒントは、権限や上限を外す許可ではない']}</Text>
      </>}
    </>}</HarnessCanvas>}>{children}</HarnessFigure>
}
