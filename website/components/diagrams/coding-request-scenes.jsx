'use client'
import { useState } from 'react'
import { CodingFigure,CodingCanvas,Text,Box,Wire,Select } from './coding-decisions-primitives'
import { requestCompletion } from '../../lib/coding-decisions-model.mjs'
export function CodingRequestContract({children}){
  const [work,setWork]=useState('dependent'),[certainty,setCertainty]=useState('suspected')
  return <CodingFigure diagram="coding-request-contract" title="目的と制約から、レビューできる仕事を切る"
    controls={({stage,ready})=>stage===2?<Select label="分けた仕事の関係" value={work} onChange={setWork} ready={ready}><option value="dependent">依存がある：順番に進める</option><option value="independent">独立している：並列候補</option></Select>:stage===3?<Select label="関連箇所について分かっていること" value={certainty} onChange={setCertainty} ready={ready}><option value="known">パス・再現・エラーが確認済み</option><option value="suspected">可能性はあるが未確認</option><option value="unknown">当たりがない：まず探索</option></Select>:null}
    scene={s=><CodingCanvas diagram="coding-request-contract" {...s}>{f=><>
      <Text y={35}>{['依頼・計画・実装・検証・レビューをつなぐ','途中の判断を支える四つの要素','一回でレビューできる変更量へ分ける','具体情報を、確度付きで先に渡す'][f.stage]}</Text>
      {f.stage===0?<>
        {['依頼','計画','実装','検証','人のレビュー'].map((t,i)=><g key={t}><Box x={32+i*118} y={125} width={104} height={113} title={t} tone={i===1?'amber':i===4?'violet':'teal'}/>{i<4&&<Wire id={s.id} d={`M${136+i*118} 181H${142+i*118}`} active phase={f.phase}/>}</g>)}
        <Wire id={s.id} d="M556 238V299H320V246" active phase={f.phase} tone="violet"/><Text y={345} small>{['必要なら計画を承認し、指摘を実装へ戻す','レビューを終えた成果を、公開・反映へ進める']}</Text>
      </>:f.stage===1?<>
        {['目的・背景','現状と文脈','制約','完了条件'].map((t,i)=><Box key={t} x={32+i%2*292} y={92+Math.floor(i/2)*126} width={284} height={95} title={t} lines={[[ '迷った時の判断基準' ],[ 'パス・再現・エラー全文' ],[ '領域・互換・テスト変更' ],[ '確認する挙動とコマンド' ]][i]} tone={i===2?'amber':'violet'}/>)}
        <Text y={398} small>具体例は本文を読み、図では各要素の役割を対応させる</Text>
      </>:f.stage===2?<>
        <Box x={32} y={86} width={260} height={127} title="探索・計画を先に" lines={['前提と影響範囲を確認','レビューできる単位へ']} tone="violet"/><Box x={348} y={86} width={260} height={127} title="段階ごとの実装" lines={['検証して次の単位へ','依存関係も確認']} />
        <Box x={105} y={284} width={430} height={105} title={work==='dependent'?'依存する仕事は、順番に進める':'独立した仕事は、並列の候補'} lines={[work==='dependent'?'前提が揃う前に同時着手しない':'担当範囲と統合を揃えて進める']} tone={work==='dependent'?'amber':'teal'} data-coding-parallel-candidate={String(work==='independent')}/>
      </>:<>
        <Box x={32} y={92} width={260} height={165} title={certainty==='known'?'確認済みの具体情報':certainty==='suspected'?'仮説と、未確認の範囲':'まず探索する仕事へ'} lines={certainty==='known'?['パス・関数・エラー全文','再現手順を渡す']:certainty==='suspected'?['可能性を断定しない','確度を添えて渡す']:['関連箇所を無理に指定せず','現状と影響を調べる']} tone="violet"/><Box x={348} y={92} width={260} height={165} title="恒常規約はルールへ" lines={['コマンド・規約を置く','今回の仕事は依頼へ']} />
        <Text y={342} small>エラーを要約して、誤った前提を固定しない</Text>
      </>}
    </>}</CodingCanvas>}>{children}</CodingFigure>
}
export function CodingRequestVerificationRecovery({children}){
  const [evidence,setEvidence]=useState('claim'),[retain,setRetain]=useState('learning')
  const completion=requestCompletion(evidence)
  return <CodingFigure diagram="coding-request-verification-recovery" title="検証基準を守り、失敗の学びを次の依頼へ戻す"
    controls={({stage,ready})=>stage===1?<Select label="完了を裏付けるもの" value={evidence} onChange={setEvidence} ready={ready}><option value="claim">できたという自己申告のみ</option><option value="verified">元の基準で、挙動と検査を確認</option><option value="weakened">通すために検証基準を弱めた</option></Select>:stage===2?<Select label="仕切り直しへ引き継ぐ内容" value={retain} onChange={setRetain} ready={ready}><option value="learning">失敗した手段と、正しい前提</option><option value="nothing">学びなしで、同じ依頼を繰り返す</option></Select>:null}
    scene={s=><CodingCanvas diagram="coding-request-verification-recovery" {...s}>{f=><>
      <Text y={35}>{['確認できる手段を、依頼の完了条件へ','「通った」だけで、基準を弱めた変更を受けない','長い失敗の履歴から、学びを抽出する','部分採用と、粒度・前提の見直しも選べる'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={100} width={260} height={157} title="実行可能な確認" lines={['テスト・リントを渡す','失敗を観測して直す']} tone="violet"/><Wire id={s.id} d="M292 178H340" active phase={f.phase}/><Box x={348} y={100} width={260} height={157} title="期待した挙動" lines={['検査の範囲を確認','人のレビューも必要']} />
        <Text y={347} small>既存挙動を固定する必要がある領域は、変更前に確認</Text>
      </>:f.stage===1?<>
        <Box x={32} y={101} width={260} height={146} title="検証の手段を保護" lines={['テスト変更を制約へ','変更するなら重点レビュー']} tone="violet"/><Wire id={s.id} d="M292 174H340" active phase={f.phase} tone={completion.satisfiesOriginalCriteria?'teal':'amber'}/><Box x={348} y={101} width={260} height={146} title={completion.satisfiesOriginalCriteria?'元の基準で確認':'元の基準では未確認'} lines={[evidence==='weakened'?'基準変更を成功扱いしない':evidence==='claim'?'自己申告だけでは閉じない':'確認範囲と差分もレビュー']} tone={completion.satisfiesOriginalCriteria?'teal':'amber'} data-original-criteria-met={String(completion.satisfiesOriginalCriteria)}/>
        <Text y={341} small>テストの成功と、元の目的を満たしたことを結び付ける</Text>
      </>:f.stage===2?<>
        <Box x={32} y={97} width={260} height={155} title="失敗履歴から抽出" lines={['試して動かなかった手段','正しい前提・決定事項']} tone="violet"/><Wire id={s.id} d="M292 174H340" active phase={f.phase}/><Box x={348} y={97} width={260} height={155} title={retain==='learning'?'次の依頼・規約へ':'同じ失敗へ戻る危険'} lines={retain==='learning'?['長い履歴を離して再構成','学びは失わない']:['誤った前提を再利用','繰返しの原因を見直す']} tone={retain==='learning'?'teal':'amber'} data-coding-learning-retained={String(retain==='learning')}/>
        <Text y={344} small>新しく始めるときも、分かったことを引き継ぐ</Text>
      </>:<>
        <Box x={32} y={100} width={260} height={149} title="正しい部分を採用" lines={['差分を確認して編集','全件やり直し以外も選ぶ']} tone="teal"/><Box x={348} y={100} width={260} height={149} title="続く失敗を見直す" lines={['タスクの大きさ・前提','恒常規約の不足']} tone="amber"/>
        <Text y={346} small>依頼文の修正だけに、立て直しを限定しない</Text>
      </>}
    </>}</CodingCanvas>}>{children}</CodingFigure>
}
