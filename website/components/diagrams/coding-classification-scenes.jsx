'use client'
import { useState } from 'react'
import { CodingFigure,CodingCanvas,Text,Box,Wire,Select } from './coding-decisions-primitives'
import { executionPlacement } from '../../lib/coding-decisions-model.mjs'
export function CodingSupportForms({children}){
  const [form,setForm]=useState('cli')
  const forms=[['cli','ターミナル','シェルからの対話'],['ide','IDE統合','編集文脈を活用'],['issue','Issue・PR連携','開発のイベント起点'],['cloud','クラウド実行','非同期・隔離・並列'],['extensible','OSS・拡張可能','公開コードや拡張機構']]
  return <CodingFigure diagram="coding-support-forms" title="提案からタスク委任へ、形態は重なっている"
    controls={({stage,ready})=>stage===3?<Select label="読む提供形態" value={form} onChange={setForm} ready={ready}>{forms.map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}
    scene={s=><CodingCanvas diagram="coding-support-forms" {...s}>{f=><>
      <Text y={35}>{['一行の提案と、開発タスクの委任を分ける','人がどこで、文脈と採否を扱うか','コードと実行結果を観測し、次の手を選ぶ','五つの形態は、排他的な分類ではない','製品名と、その利用形態を別に選ぶ'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={105} width={260} height={146} title="補完・チャット" lines={['コードの提案・質問応答','人が採用して次へ']} tone="violet"/><Box x={348} y={105} width={260} height={146} title="タスクの委任" lines={['探索・編集・実行・検証','条件を満たすまで反復']} />
        <Text y={340} small>用途ごとの分担の違い：全てを置き換える順位ではない</Text>
      </>:f.stage===1?<>
        <Box x={32} y={104} width={260} height={165} title="コード補完" lines={['カーソルの続きを提案','人が毎回、採否を判断']} tone="violet"/><Box x={348} y={104} width={260} height={165} title="チャット支援" lines={['質問とコード生成','文脈の受渡し・貼付は人']} tone="teal"/>
        <Text y={352} small>提案が作られただけで、編集・検証済みとはしない</Text>
      </>:f.stage===2?<>
        {['観測','次の手を決定','行動'].map((t,i)=><g key={t}><Box x={32+i*197} y={105} width={182} height={120} title={t} lines={[[ 'コード・テスト' ],[ 'モデルが判断' ],[ '編集・コマンド' ]][i]} tone={i===1?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 164H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Wire id={s.id} d="M517 225V284H123V233" active phase={f.phase}/><Text y={349}>{['実行結果を、次の観測へ返す','完了条件と、最終レビューで確認']}</Text>
      </>:f.stage===3?<>
        {forms.map(([v,t,n],i)=><Box key={v} x={i===4?120:32+i%2*292} y={75+Math.floor(i/2)*111} width={i===4?400:284} height={87} title={t} lines={[n]} tone={form===v?'teal':'violet'} active={form===v}/>)}
        <Text y={422} small>代表例と仕様の確認時点は、元の表を読む</Text>
      </>:<>
        <Box x={32} y={114} width={219} height={130} title="同じ製品" lines={['利用する面を特定']} tone="violet"/>
        {['CLI','IDE','クラウド'].map((t,i)=><g key={t}><Wire id={s.id} d={`M251 179H304V${109+i*97}H340`} active phase={f.phase}/><Box x={348} y={75+i*97} width={260} height={69} title={t}/></g>)}
        <Text y={391} small>{['一つの製品が複数の面を持ちうる','OSSであることと、拡張可能なことも同一ではない']}</Text>
      </>}
    </>}</CodingCanvas>}>{children}</CodingFigure>
}
export function CodingTriggerExecutionMap({children}){
  const [trigger,setTrigger]=useState('ide'),[place,setPlace]=useState('cloud')
  const mapTrigger=stage=>stage===2?'issue':stage===1&&trigger==='issue'?'ide':trigger
  return <CodingFigure diagram="coding-trigger-execution-map" title="仕事の入口と、ループの実行場所を分ける"
    controls={({stage,ready})=>stage<3?<><Select label="仕事を依頼する入口" value={mapTrigger(stage)} onChange={setTrigger} ready={ready}>{stage!==2&&<><option value="cli">CLI</option><option value="ide">IDE</option></>}{stage!==1&&<option value="issue">Issue・PR</option>}</Select><Select label="ループを実行する場所" value={place} onChange={setPlace} ready={ready}><option value="local">ローカル</option><option value="cloud">クラウド</option><option value="ci">自分のCI</option></Select></>:null}
    scene={s=><CodingCanvas diagram="coding-trigger-execution-map" {...s}>{f=><>
      <Text y={35}>{['同じ入口でも、ループの場所は変わりうる','手元の対話と、クラウド委任を区別','Issue・PRのイベントから、仕事を始める','コマンドの場所と、データの送信先は別'][f.stage]}</Text>
      {f.stage<3?<>
        {['local','cloud','ci'].map((v,i)=><Text key={v} x={243+i*141} y={93} small>{['ローカル','クラウド','自分のCI'][i]}</Text>)}
        {['cli','ide','issue'].map((t,r)=><g key={t}>
          <Text x={89} y={160+r*82} small>{['CLI','IDE','Issue・PR'][r]}</Text>
          {['local','cloud','ci'].map((p,c)=>{const represented=executionPlacement(t,p).represented,selected=t===mapTrigger(f.stage)&&p===place;return <g key={p} data-coding-map-cell={`${t}-${p}`} data-represented={String(represented)} data-selected={String(selected)}><rect x={178+c*141} y={127+r*82} width={130} height={60} rx={8} fill={selected?'#214941':'#112638'} stroke={selected?'#77dec4':'#5f788e'} strokeWidth={selected?3:1}/><Text x={243+c*141} y={166+r*82}>{represented?'○':'—'}</Text></g>})}
        </g>)}
        <Text y={403} small>{executionPlacement(mapTrigger(f.stage),place).represented?'選択セルは、元記事が示す形態の対応':'— は元記事の表で該当を示さない組合せ'}</Text>
      </>:<>
        <Box x={32} y={94} width={260} height={144} title="実行の場所" lines={['コード配置', 'コマンドの実行権限']} tone="violet"/><Box x={348} y={94} width={260} height={144} title="送信・保持の経路" lines={['モデルや外部サービス', '学習利用と保持条件']} tone="amber" data-local-means-no-transfer="false"/>
        <Text y={327}>{['ローカル実行だけで、外部送信なしとは判定しない','予定プランと設定の一次情報で、経路を確認']}</Text>
      </>}
    </>}</CodingCanvas>}>{children}</CodingFigure>
}
export function CodingAutonomyLearning({children}){
  const [autonomy,setAutonomy]=useState('approval'),[role,setRole]=useState('select')
  return <CodingFigure diagram="coding-autonomy-learning" title="人の確認位置と、その運用に必要な学び"
    controls={({stage,ready})=>stage===0?<Select label="選ぶ確認の運用" value={autonomy} onChange={setAutonomy} ready={ready}><option value="completion">補完を毎回採否</option><option value="approval">操作ごとに承認</option><option value="allowlist">定型操作の許可リスト</option><option value="delegate">委任して成果をレビュー</option></Select>:stage===2?<Select label="学習する立場" value={role} onChange={setRole} ready={ready}><option value="select">選定する人</option><option value="use">使い始めた人</option><option value="team">組織へ展開する人</option></Select>:null}
    scene={s=><CodingCanvas diagram="coding-autonomy-learning" {...s}>{f=><>
      <Text y={35}>{['同じツールでも、確認の運用は選べる','確認を減らす前に、権限と検証を整える','今の役割から、次の学習先へ進む'][f.stage]}</Text>
      {f.stage===0?<>
        {['completion','approval','allowlist','delegate'].map((v,i)=><Box key={v} x={32+i%2*292} y={93+Math.floor(i/2)*124} width={284} height={93} title={['補完','都度承認','許可リスト','委任'][i]} lines={[['人が毎回採否','各操作の前に確認','定型操作を自動化','成果の最終レビュー'][i]]} active={v===autonomy} tone={v===autonomy?'teal':'violet'}/>)}
        <Text y={398} small>自律性は設定と運用の選択：製品の固定属性ではない</Text>
      </>:f.stage===1?<>
        <Box x={32} y={107} width={260} height={143} title="権限の設計" lines={['失敗の影響範囲を制御','危険操作は承認へ']} tone="amber"/><Box x={348} y={107} width={260} height={143} title="完了条件の検証" lines={['実行可能な確認手段','成果のレビュー']} tone="teal"/>
        <Text y={342} small>レビューは、成果の公開・反映より前に置く</Text>
      </>:<>
        {({select:['選定','横断比較','個別ツール'],use:['依頼の設計','恒常規約','設定を整える'],team:['権限・安全','チーム導入','評価する']})[role].map((t,i)=><g key={t}><Box x={32+i*197} y={131} width={182} height={109} title={t} tone={i===1?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 185H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={341} small>本文にある、立場別の章内リンクを辿る</Text>
      </>}
    </>}</CodingCanvas>}>{children}</CodingFigure>
}
