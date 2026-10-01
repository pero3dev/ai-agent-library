'use client'
import { useState } from 'react'
import { ControlFigure,ControlCanvas,Text,Box,Wire,Select } from './coding-controls-primitives'
import { automationReadiness } from '../../lib/coding-controls-model.mjs'
const patterns=[
  ['review','PRの一次レビュー','PR作成・更新','指摘コメント','人のレビューが本審'],
  ['triage','Issueトリアージ','Issue作成','ラベル・重複・再現','対応方針は人が決定'],
  ['dependency','依存関係の更新','定期実行','更新とテストのPR','PRマージ前'],
  ['tests','テスト補強','穴を指定して委任','既存挙動で通過','仕様を確かめるレビュー'],
  ['docs','ドキュメント同期','コード変更・定期','文書の差分PR','内容の正確さを確認'],
  ['release','リリースノート生成','タグ・定期','差分からのドラフト','公開前に編集'],
  ['lint','lint・型エラー解消','委任・定期','lint・型検査通過','非機械的な修正を確認']
]
export function CodingAutomationTaskDesign({children}){
  const [condition,setCondition]=useState('all'),[pattern,setPattern]=useState('dependency')
  const ready=automationReadiness({patterned:condition!=='pattern',verifiable:condition!=='verify',safeFailure:condition!=='failure'})
  const selected=patterns.find(p=>p[0]===pattern)
  return <ControlFigure diagram="coding-automation-task-design" title="手順・判定・失敗の条件を揃えて、無人起動へ"
    controls={({stage,ready:loaded})=>stage===1?<Select label="自動化の前提で不足するもの" value={condition} onChange={setCondition} ready={loaded}><option value="all">三つとも設計できている</option><option value="pattern">手順のパターン化</option><option value="verify">機械による成否判定</option><option value="failure">部分変更を公開しない失敗設計</option></Select>:stage===2?<Select label="本文の自動化パターン" value={pattern} onChange={setPattern} ready={loaded}>{patterns.map(p=><option key={p[0]} value={p[0]}>{p[1]}</option>)}</Select>:null}
    scene={s=><ControlCanvas diagram="coding-automation-task-design" {...s}>{f=><>
      <Text y={35}>{['起動方法と、人が確認する位置を変える','条件が不足する仕事は、人の関与を保つ','トリガー・完了基準・人の判断位置を結びつける','ブランチとPRに閉じ、公開前にゲートを置く','非対話の結果契約と、両側の上限を揃える'][f.stage]}</Text>
      {f.stage===0?<>
        {['対話','タスク委任','無人起動'].map((t,i)=><g key={t}><Box x={32+i*197} y={113} width={182} height={131} title={t} lines={[["人が伴走","都度判断"],["単位で任せる","完了をレビュー"],["イベント・定期","検証・公開ゲート"]][i]} tone={i===2?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 178H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={344} small>右へ進むほど、権限・冪等性・通知・上限が必要</Text>
      </>:f.stage===1?<>
        {['手順がパターン化','成否を機械判定','安全に失敗できる'].map((t,i)=><Box key={t} x={32+i*197} y={85} width={182} height={94} title={t} active={condition!==['pattern','verify','failure'][i]} tone="violet"/>)}
        <Wire id={s.id} d="M320 179V246" active phase={f.phase} tone={ready.unattendedCandidate?'teal':'amber'}/><Box x={117} y={254} width={406} height={104} title={ready.unattendedCandidate?'無人起動の候補として設計':'委任と人の事後レビューに留める'} lines={['権限・再実行・観測の設計も必要']} tone={ready.unattendedCandidate?'teal':'amber'} data-unattended-candidate={String(ready.unattendedCandidate)}/>
        <Text y={408} small>無人起動を増やすだけでは、不足条件を補えない</Text>
      </>:f.stage===2?<>
        <Text y={86}>{selected[1]}</Text>
        {['トリガー','完了基準','判断の位置'].map((t,i)=><g key={t}><Box x={32} y={122+i*89} width={155} height={61} title={t} tone="violet"/><Wire id={s.id} d={`M187 ${152+i*89}H221`} active phase={f.phase}/><Box x={229} y={122+i*89} width={379} height={61} title={selected[i+2]} tone={i===2?'amber':'teal'}/></g>)}
      </>:f.stage===3?<>
        {['変更・検証','ブランチとPR','公開前の確認'].map((t,i)=><g key={t}><Box x={32+i*197} y={122} width={182} height={112} title={t} tone={i===2?'amber':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 178H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={330}>{['本文の設計は、人がマージを判断する','ブランチ保護と必須チェックを保つ']}</Text>
      </>:<>
        <Box x={32} y={82} width={260} height={124} title="機械可読の結果" lines={['JSON・終了コード','後続が成否を判定']} tone="violet"/><Box x={348} y={82} width={260} height={124} title="最小のCI権限" lines={['書込・秘密の範囲','デプロイ権限と分離']} tone="amber"/>
        <Box x={80} y={283} width={480} height={97} title="CIとツールの両方に上限" lines={['時間・試行回数・費用を制限']} tone="amber"/>
      </>}
    </>}</ControlCanvas>}>{children}</ControlFigure>
}
export function CodingAutomationRuntimeRecovery({children}){
  const [runtime,setRuntime]=useState('local')
  return <ControlFigure diagram="coding-automation-runtime-recovery" title="実行場所・稼働条件・再実行と失敗を設計する"
    controls={({stage,ready})=>stage===0?<Select label="モデルを実行する場所" value={runtime} onChange={setRuntime} ready={ready}><option value="local">手元でモデル実行、CIは検証と公開</option><option value="ci">CI runnerでモデルも実行</option></Select>:null}
    scene={s=><ControlCanvas diagram="coding-automation-runtime-recovery" {...s}>{f=><>
      <Text y={35}>{['モデル実行と、検証・公開の担当を分ける','ローカルの定期実行は、稼働条件を確認する','同じ依頼を管理し、結果と消費から頻度を決める','作業空間の分離に加え、仕事の独立性が必要','再実行で重複せず、失敗した部分変更を公開しない','外部の起動イベントは、許可を変更しない'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={97} width={260} height={147} title={runtime==='local'?'手元のモデル実行':'CI内のモデル実行'} lines={[runtime==='local'?'契約枠・認証を確認':'対応する非対話認証',runtime==='local'?'API従量と区別':'課金と消費を確認']} tone="violet"/>
        <Wire id={s.id} d="M292 170H340" active phase={f.phase}/><Box x={348} y={97} width={260} height={147} title="CIの検証・公開" lines={[runtime==='local'?'モデル用APIキー不要':'モデル実行分の認証要','検証結果で公開を制御']} tone="teal" data-ci-runs-model={String(runtime==='ci')} data-ci-model-auth-needed={String(runtime==='ci')}/>
        <Text y={349} small>契約枠の利用とAPI従量を、無料の実行と同一視しない</Text>
      </>:f.stage===1?<>
        {['PCが稼働','アプリが稼働','対象フォルダ'].map((t,i)=><Box key={t} x={32+i*197} y={113} width={182} height={113} title={t} tone="violet"/>)}
        <Text y={326}>{['ローカル実行の稼働条件とアクセスを確認','Webから、手元のフォルダを直接操作しない']}</Text>
      </>:f.stage===2?<>
        {['依頼文を管理','結果を通知','消費から頻度'].map((t,i)=><g key={t}><Box x={32+i*197} y={117} width={182} height={128} title={t} lines={[["同じ依頼を使用","変更をレビュー"],["成功・失敗","スキップも観測"],["一回を計測","定期消費を見積る"]][i]} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 181H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={354} small>静かに失敗し続けるジョブを、稼働成功としない</Text>
      </>:f.stage===3?<>
        <Box x={32} y={104} width={260} height={152} title="分離した作業空間" lines={['worktree・隔離環境','依存する仕事は分けず']} tone="violet"/><Box x={348} y={104} width={260} height={152} title="レビューの消化量" lines={['生産量と合わせて観測','粒度と自己検証を改善']} tone="amber"/>
        <Text y={349} small>レビュー待ちが増えるだけなら、並列度で解決しない</Text>
      </>:f.stage===4?<>
        <Box x={32} y={101} width={260} height={142} title="再実行を設計" lines={['同じPRを重複させず','部分状態を残さない']} tone="violet"/><Box x={348} y={101} width={260} height={142} title="失敗は公開せず報告" lines={['壊れた部分変更を止める','成功扱いしない']} tone="amber" data-publish-broken-partial="false"/>
        <Text y={348}>{['安全に「何もしなかった」へ倒せる構成にする','成功・失敗・スキップを観測へつなぐ']}</Text>
      </>:<>
        <Box x={32} y={104} width={260} height={145} title="Issue・PRの入力" lines={['外部の書き込み','信頼できない資料']} tone="violet"/><Wire id={s.id} d="M292 176H340" active phase={f.phase}/><Box x={348} y={104} width={260} height={145} title="作業範囲の境界" lines={['権限と検証を維持','観測と停止を準備']} tone="amber" data-trigger-is-authorization="false"/>
        <Text y={352} small>無人起動でも、入力の文章を実行権限に昇格させない</Text>
      </>}
    </>}</ControlCanvas>}>{children}</ControlFigure>
}
