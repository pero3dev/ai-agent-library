'use client'
import { useState } from 'react'
import { ControlFigure,ControlCanvas,Text,Box,Wire,Select } from './coding-controls-primitives'
import { ruleDiscovery } from '../../lib/coding-controls-model.mjs'
export function CodingRulesContent({children}){
  return <ControlFigure diagram="coding-rules-content" title="恒常規約の正本を一つにし、短く検証できる内容へ"
    scene={s=><ControlCanvas diagram="coding-rules-content" {...s}>{f=><>
      <Text y={35}>{['繰り返す規約と、その仕事だけの指示を分ける','形式が違っても、共通規約を二重管理しない','判断と実行に必要な、プロジェクト固有の差分','毎回の文脈へ、不要な情報を持ち込まない','従わなかったことを、確認できる形にする'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={100} width={260} height={161} title="ルールファイル" lines={['規約・コマンド・境界','恒常的な前提を共有']} tone="violet"/><Box x={348} y={100} width={260} height={161} title="今回の依頼" lines={['目的・現状・制約','今回の完了条件']} />
        <Text y={349} small>同じ規約を、毎回の依頼文へ複製しない</Text>
      </>:f.stage===1?<>
        <Box x={35} y={136} width={217} height={124} title="共通規約の正本" lines={['変更する入口を一つに']} tone="violet"/>
        {['他形式から参照','必要な形式へ生成','読込結果を確認'].map((t,i)=><g key={t}><Wire id={s.id} d={`M252 198H304V${109+i*100}H340`} active phase={f.phase}/><Box x={348} y={74+i*100} width={260} height={70} title={t} tone={i===2?'amber':'teal'}/></g>)}
        <Text y={406} small>製品ごとの対応形式とTODOは、本文の表を保持</Text>
      </>:f.stage===2?<>
        {['実行コマンド','構造の要点','具体的な規約','触らない領域','Git・PR運用','固有の用語'].map((t,i)=><Box key={t} x={32+i%2*292} y={83+Math.floor(i/2)*97} width={284} height={71} title={t} tone={i===3?'amber':'violet'}/>)}
        <Text y={408} small>全ディレクトリや一般論の網羅を、目的にしない</Text>
      </>:f.stage===3?<>
        {['一般的な「良いコード」論','頻繁に変わる版・担当情報','秘密値・環境依存の値','人向けREADMEの複製'].map((t,i)=><Box key={t} x={55} y={72+i*79} width={530} height={57} title={t} tone={i===2?'amber':'violet'}/>)}
        <Text y={418} small>コードや別の正本へ置き、必要な条件で参照する</Text>
      </>:<>
        <Box x={32} y={95} width={260} height={160} title="短く・具体的な指示" lines={['実行・検査できる','違反をレビューで発見']} tone="violet"/><Box x={348} y={95} width={260} height={160} title="実際の強制境界" lines={['アクセス権・隔離','検証と承認の制御']} tone="amber" data-rule-text-enforces-access="false"/>
        <Text y={344}>{['文章で禁止しても、アクセス権は変わらない','指示の内容と、強制する仕組みを揃える']}</Text>
      </>}
    </>}</ControlCanvas>}>{children}</ControlFigure>
}
export function CodingRulesScopeMaintenance({children}){
  const [cwd,setCwd]=useState('root')
  const discovered=ruleDiscovery(cwd)
  return <ControlFigure diagram="coding-rules-scope-maintenance" title="適用する経路を確認し、実態へ合わせて保守する"
    controls={({stage,ready})=>stage===1?<Select label="Codexを開始する作業ディレクトリ" value={cwd} onChange={setCwd} ready={ready}><option value="root">リポジトリのルート</option><option value="web">apps/web</option><option value="ml">ml</option></Select>:null}
    scene={s=><ControlCanvas diagram="coding-rules-scope-maintenance" {...s}>{f=><>
      <Text y={35}>{['範囲ごとの役割と、合成の仕様を確認する','開始cwdまでの経路を、自動読込する','参照先は、読む条件と明示した操作を設計','失敗の根拠と、変更レビューをつなぐ','規約を、今の実装と実行コマンドへ照合'][f.stage]}</Text>
      {f.stage===0?<>
        {['組織：共通の管理方針','個人：自分の好み','ルート：チームの規約','下位：固有の技術条件'].map((t,i)=><Box key={t} x={61} y={73+i*79} width={518} height={58} title={t} tone={i===0?'amber':'violet'}/>)}
        <Text y={417} small>順序と優先順位は、全ツールへ同じと仮定しない</Text>
      </>:f.stage===1?<>
        <Box x={128} y={74} width={384} height={86} title="ルートのAGENTS.md" lines={['開始の共通入口']} tone="violet" data-cwd-root-loaded="true"/>
        {['web','ml'].map((p,i)=><g key={p}><Wire id={s.id} d={`M320 160V212H${162+i*316}V248`} active={discovered[p]} phase={f.phase} tone="violet"/><Box x={32+i*316} y={256} width={260} height={102} title={p==='web'?'apps/web/':'ml/'} lines={['AGENTS.md',discovered[p]?'開始cwdの経路に入る':'開始cwdの下・別経路']} active={discovered[p]} tone="teal" data-cwd-rule={p} data-loaded={String(discovered[p])}/></g>)}
        <Text y={405} small>ルートで起動しただけでは、下位を一括探索しない</Text>
      </>:f.stage===2?<>
        <Box x={32} y={99} width={260} height={149} title="共通入口の設計" lines={['対象別の参照パス','必要な時に読む条件']} tone="violet"/><Wire id={s.id} d="M292 173H340" active phase={f.phase}/><Box x={348} y={99} width={260} height={149} title="対象の詳細を読む" lines={['明示した読込を実行','利用した規約を確認']} tone="teal"/>
        <Text y={338}>{['パス参照だけで、全文は自動注入されない','下位で始める場合も、読込結果を確認']}</Text>
      </>:f.stage===3?<>
        {['繰返す失敗','規約を具体化','PRでレビュー'].map((t,i)=><g key={t}><Box x={32+i*197} y={124} width={182} height={111} title={t} tone={i===0?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 179H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={336} small>いつか役立つ網羅より、再発防止の実績を根拠にする</Text>
      </>:<>
        <Box x={32} y={104} width={260} height={151} title="現在の実装・コマンド" lines={['実行して確かめる','移行・廃止を照合']} tone="teal"/><Wire id={s.id} d="M292 179H340" active phase={f.phase}/><Box x={348} y={104} width={260} height={151} title="ルールを整理" lines={['矛盾と重複を除く','古い規約を更新']} tone="violet"/>
        <Text y={347} small>配置があるだけで、遵守や実発火を確認済みにしない</Text>
      </>}
    </>}</ControlCanvas>}>{children}</ControlFigure>
}
