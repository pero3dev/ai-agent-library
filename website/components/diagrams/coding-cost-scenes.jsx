'use client'
import { useState } from 'react'
import { OutcomeFigure,OutcomeCanvas,Text,Box,Wire,Select } from './coding-outcomes-primitives'
import { costReductionVerdict,delegatedConsumption } from '../../lib/coding-outcomes-model.mjs'
export function CodingCostConsumption({children}){
  const [quality,setQuality]=useState('preserved')
  const verdict=costReductionVerdict({consumptionLower:true,qualityPreserved:quality==='preserved'})
  return <OutcomeFigure diagram="coding-cost-consumption" title="ループと再送の消費を、成功と品質へ結びつける"
    controls={({stage,ready})=>stage===3?<Select label="消費を減らした後の品質" value={quality} onChange={setQuality} ready={ready}><option value="preserved">元の基準を保ち、手戻りも確認</option><option value="lost">品質低下・手戻りの増加がある</option></Select>:null}
    scene={s=><OutcomeCanvas diagram="coding-cost-consumption" {...s}>{f=><>
      <Text y={35}>{['ループの回数と、一回へ入れる情報が積み上がる','計上する対象と、超過時の挙動を確認する','失敗後のやり直しも、総消費に加える','消費減だけで、節約の施策を成功と判定しない','実際の利用と、契約別の計上を照合する'][f.stage]}</Text>
      {f.stage===0?<>
        <Text y={87} small>消費 ≒ ループ回数 ×（再送コンテキスト＋新規）</Text>
        {['観測・思考・行動','次のループ','さらに次のループ'].map((t,i)=><g key={t}><Text x={147} y={151+i*88} small>{t}</Text><Box x={268} y={119+i*88} width={207} height={60} title="履歴・規約・出力" tone="violet"/><Box x={486} y={119+i*88} width={122} height={60} title="新規" tone="teal"/></g>)}
        <Text y={415} small>模式的な近似。キャッシュと契約の計上条件は別に確認</Text>
      </>:f.stage===1?<>
        {['定額＋使用量上限','トークン従量','クレジット制'].map((t,i)=><g key={t}><Box x={32} y={85+i*99} width={237} height={71} title={t} tone="violet"/><Wire id={s.id} d={`M269 ${120+i*99}H305`} active phase={f.phase}/><Box x={313} y={85+i*99} width={295} height={71} title={['枠と超過の条件','削減と請求・支出上限','モデル別の換算率'][i]} tone={i===0?'teal':'amber'}/></g>)}
        <Text y={415} small>機能ごとの消費対象と、追加購入・超過時の扱いを見る</Text>
      </>:f.stage===2?<>
        {['軽いモデルで失敗','別モデルで再試行','両方の消費を合算'].map((t,i)=><g key={t}><Box x={32+i*197} y={103} width={182} height={122} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 164H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Box x={81} y={297} width={478} height={85} title="成功あたりの費用で比べる" lines={['難易度・品質・介入を合わせて測る']} tone="teal"/>
      </>:f.stage===3?<>
        <Box x={32} y={102} width={260} height={142} title="消費量は減った" lines={[quality==='preserved'?'元の品質基準を保持':'品質低下・手戻り増','介入と成果も確認']} tone="violet"/>
        <Wire id={s.id} d="M292 173H340" active phase={f.phase}/><Box x={348} y={102} width={260} height={142} title={verdict.accepted?'品質を保つ削減として評価':'削減だけでは採用しない'} lines={['成功あたりの費用へ照合','実測結果で判断']} tone={verdict.accepted?'teal':'amber'} data-cost-reduction-accepted={String(verdict.accepted)}/>
        <Text y={348} small>単価の安さ・消費量の少なさを、成果の代用にしない</Text>
      </>:<>
        {['誰が','何のタスクに','どれだけ'].map((t,i)=><Box key={t} x={32+i*197} y={94} width={182} height={87} title={t} tone="violet"/>)}
        <Wire id={s.id} d="M320 181V256" active phase={f.phase}/><Box x={77} y={264} width={486} height={102} title="使用量・ダッシュボード・計上条件" lines={['予算アラートと品質指標も合わせて管理']} tone="teal"/>
        <Text y={419} small>図の形や量は、請求額・契約枠の測定値ではない</Text>
      </>}
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
export function CodingCostContext({children}){
  const [delegation,setDelegation]=useState('off')
  const usage=delegatedConsumption(delegation==='on')
  return <OutcomeFigure diagram="coding-cost-context" title="再送する内容を絞り、委譲先を含む総消費を見る"
    controls={({stage,ready})=>stage===3?<Select label="大量の探索の文脈" value={delegation} onChange={setDelegation} ready={ready}><option value="off">本体の文脈で探索する</option><option value="on">別の文脈へ委譲し要約を戻す</option></Select>:null}
    scene={s=><OutcomeCanvas diagram="coding-cost-context" {...s}>{f=><>
      <Text y={35}>{['仕事の区切りで、不要な履歴を次へ持ち込まない','必要な根拠と制約を残し、大きな出力を絞る','恒常規約と探索範囲を、必要な対象へ絞る','親の再送が減っても、子の消費は全体へ加える','規約の接頭辞を安定させ、キャッシュを確認する'][f.stage]}</Text>
      {f.stage===3?<>
        <Box x={32} y={94} width={260} height={157} title={usage.parentContextReduced?'本体には要約を戻す':'本体で探索を保持'} lines={[usage.parentContextReduced?'本体の文脈を絞る':'読んだ内容が膨らむ','必要な根拠は保持']} tone="violet" data-parent-context-reduced={String(usage.parentContextReduced)}/>
        <Wire id={s.id} d="M292 173H340" active={usage.childConsumptionAdded} phase={f.phase}/><Box x={348} y={94} width={260} height={157} title={usage.childConsumptionAdded?'委譲先の消費を加算':'委譲先を実行しない'} lines={['親と子の合計を確認','総消費は自動で減らない']} tone="amber" data-child-consumption-added={String(usage.childConsumptionAdded)} data-total-reduction-guaranteed="false"/>
        <Text y={351} small>図は委譲を起動しない。対象と使いどころで総量を判断</Text>
      </>:f.stage===4?<>
        {['先頭の規約を保つ','繰り返しの入力','キャッシュ利用を確認'].map((t,i)=><g key={t}><Box x={71} y={85+i*97} width={498} height={70} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${155+i*97}V${174+i*97}`} active phase={f.phase}/>}</g>)}
        <Text y={413} small>内容が消える仕組みではない。期限と計上条件も確認</Text>
      </>:<>
        <Box x={32} y={103} width={260} height={146} title={['長く続く履歴','大きなログ・差分','肥大した規約・探索'][f.stage]} lines={[
          ['不要な経路も毎回再送','文脈の汚染を避ける'],['必要外の出力を混ぜる','以後のターンでも再送'],['全ての仕事へ情報が入る','生成物・依存も読む']][f.stage]} tone="violet"/>
        <Wire id={s.id} d="M292 176H340" active phase={f.phase}/><Box x={348} y={103} width={260} height={146} title={['新しい仕事で仕切直し','圧縮・抜粋を確認','短い規約と対象範囲'][f.stage]} lines={[
          ['必要な判断を引継ぐ','失敗の学びを捨てない'],['根拠・制約は残す','要約品質を確認'],['必要な情報は残す','ignoreと権限制御は別']][f.stage]} tone="teal"/>
        <Text y={351} small>読むべき根拠を削って、品質を落とす節約にしない</Text>
      </>}
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
export function CodingCostLimits({children}){
  return <OutcomeFigure diagram="coding-cost-limits" title="成功に合うモデルと、予算・レビューの制約を揃える"
    scene={s=><OutcomeCanvas diagram="coding-cost-limits" {...s}>{f=><>
      <Text y={35}>{['難易度とモデルの適合を、成功と費用で測る','人が見ていなくても、上限と進捗で止める','並列度は、予算とレビューの両方で律速される','利用の内訳と、品質・介入を見て施策を戻す'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={102} width={260} height={144} title="タスクの難易度" lines={['設計・難しいデバッグ','定型的・機械的な修正']} tone="violet"/><Wire id={s.id} d="M292 174H340" active phase={f.phase}/><Box x={348} y={102} width={260} height={144} title="モデルを選び、測る" lines={['成功あたりの費用','再試行・介入も含める']} tone="teal"/>
        <Text y={351} small>最高性能を常用せず、安さだけでも選ばない</Text>
      </>:f.stage===1?<>
        {['反復・回数・時間・進捗','実効的な支出上限','予算アラート・通知'].map((t,i)=><Box key={t} x={55} y={88+i*94} width={530} height={68} title={t} tone={i===2?'violet':'amber'}/>)}
        <Text y={412} small>アラートだけで、消費を必ず停止するとは扱わない</Text>
      </>:f.stage===2?<>
        <Box x={32} y={97} width={260} height={140} title="同時に発生する消費" lines={['親と子・並列の合計','予算と支出上限を確認']} tone="amber"/><Box x={348} y={97} width={260} height={140} title="レビューの消化量" lines={['待ちPRとリードタイム','粒度・自己検証を改善']} tone="violet"/>
        <Wire id={s.id} d="M162 237V278H320V299" active phase={f.phase}/><Wire id={s.id} d="M478 237V278H320V299" active phase={f.phase}/><Box x={122} y={307} width={396} height={78} title="両方の制約内で並列度を決める" tone="teal"/>
      </>:<>
        {['誰・何・消費量','成功・介入・手戻り','施策と上限を見直す'].map((t,i)=><g key={t}><Box x={32+i*197} y={114} width={182} height={115} title={t} tone={i===1?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 171H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={344} small>消費減と品質維持を合わせて、成功あたり費用を判断</Text>
      </>}
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
