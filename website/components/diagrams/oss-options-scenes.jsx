'use client'
import { useState } from 'react'
import { OptionsFigure,OptionsCanvas,Text,Box,Wire,Select } from './coding-options-primitives'
export function OssFreedomResponsibility({children}){
 const [model,setModel]=useState('api'),[status,setStatus]=useState('archive')
 return <OptionsFigure diagram="oss-freedom-responsibility" title="選択の自由と、利用者が引き受ける運用を読む"
  controls={({stage,ready})=>stage===0?<Select label="自分で選ぶ推論経路" value={model} onChange={setModel} ready={ready}><option value="api">外部モデルAPI</option><option value="local">対応するローカルモデル</option></Select>:stage===3?<Select label="プロジェクト状態の根拠" value={status} onChange={setStatus} ready={ready}><option value="archive">非アーカイブ属性</option><option value="readme">READMEの保守方針</option><option value="release">releaseの存在</option></Select>:null}
  scene={s=><OptionsCanvas diagram="oss-freedom-responsibility" {...s}>{f=><>
   <Text y={35}>{['OSSは、接続経路とモデルを選ぶ自由','利用者が、契約と運用の担当を持つ','ツール名より、作業形態と既定を読む','リリース・保守方針・属性を別に確かめる'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={81} width={260} height={144} title="OSSのAgent" lines={['コードを読める・拡張できる','BYOK先と経路を設計','モデル対応はツール別']} tone="violet"/>
    <Wire id={s.id} d="M292 153H340" active phase={f.phase}/><Box x={348} y={81} width={260} height={144} title={model==='api'?'外部モデルAPI':'ローカルの推論基盤'} lines={model==='api'?['自分の契約・APIキー','入力は提供者へ送信']:['そのツールの対応を確認','計算資源と運用を用意']} tone="teal" data-external-inference={String(model==='api')}/>
    <Box x={67} y={297} width={506} height={93} title="選択した全経路を確認" lines={['MCP等も別。ローカルだけで無通信とはしない']} tone="amber" data-oss-guarantees-no-transmission="false"/>
   </>:f.stage===1?<>
    {['モデル契約とデータ条件','API・資源・運用の総費用','権限・隔離・組織の設定','存続性の監視と乗換え'].map((t,i)=><Box key={t} x={67} y={75+i*82} width={506} height={62} title={t} tone={i===3?'amber':'violet'}/>)}
    <Text y={421} small>ソフトウェアが無料でも、運用費と管理は残る</Text>
   </>:f.stage===2?<>
    {['CLI・TUI','IDE拡張・アプリ','実行基盤','汎用Agent・MCP'].map((t,i)=><Box key={t} x={32+i%2*316} y={84+Math.floor(i/2)*132} width={260} height={100} title={t} lines={[["Aider・opencode"],["Cline・Continue"],["OpenHands"],["Goose"]][i]} tone="violet"/>)}
    <Text y={366} small>ライセンス・主体・既定は、本文の確認時点の表へ照合</Text>
    <Text y={412} small>買収・財団移管・停滞も、存続の保証にはしない</Text>
   </>:<>
    <Box x={67} y={85} width={506} height={129} title={status==='archive'?'非アーカイブ ≠ 積極保守':status==='readme'?'保守方針とサポート範囲':'releaseの存在 ≠ 全機能GA'} lines={status==='archive'?['ContinueのREADMEと属性は別の根拠']:status==='readme'?['保守終了・read-only方針を本文時点で確認']:['Cline Desktopのreleaseと採用機能を分ける']} tone="amber" data-liveness-guaranteed="false"/>
    <Box x={67} y={284} width={506} height={109} title="採用時と定期見直しで照合" lines={['release・README・issue・運営主体を合わせて読む','未確認のサポートや将来を補完しない']} tone="teal"/>
   </>}
  </>}</OptionsCanvas>}>{children}</OptionsFigure>
}
export function OssEvaluationControls({children}){
 const [approval,setApproval]=useState('ask'),[cost,setCost]=useState('api')
 return <OptionsFigure diagram="oss-evaluation-controls" title="存続性・安全・総費用・互換から、自己運用を設計"
  controls={({stage,ready})=>stage===1?<Select label="承認モデルの型" value={approval} onChange={setApproval} ready={ready}><option value="human">人が明示実行</option><option value="ask">都度承認</option><option value="risk">リスク選別</option><option value="auto">全自動・ほぼ許可</option></Select>:stage===2?<Select label="推論費用の経路" value={cost} onChange={setCost} ready={ready}><option value="api">外部APIの従量</option><option value="local">ローカル計算資源</option></Select>:null}
  scene={s=><OptionsCanvas diagram="oss-evaluation-controls" {...s}>{f=><>
   <Text y={35}>{['四つの軸を、同じ安全点数にまとめない','承認モデルと、隔離の実装を分ける','無料のソフトウェアと、総運用費を分ける','接続・規約・移行の互換を確かめる','チームの統制は、担当と実装が必要'][f.stage]}</Text>
   {f.stage===0?<>
    {['存続性とガバナンス','既定の安全度','推論を含む総費用','ecosystemの互換'].map((t,i)=><Box key={t} x={32+i%2*316} y={81+Math.floor(i/2)*132} width={260} height={101} title={t} tone={i===0?'amber':'violet'}/>)}
    <Text y={373} small>release頻度・運営主体・収益モデルを継続確認</Text>
   </>:f.stage===1?<>
    <Box x={67} y={87} width={506} height={128} title={{human:'人がコマンドを実行',ask:'操作ごとに承認',risk:'分類したリスクで判断',auto:'承認を省略して実行'}[approval]} lines={['元記事のツール別スナップショットへ照合','採用時の既定と設定を公式で再確認']} tone={approval==='auto'?'amber':'violet'} data-approval-type={approval}/>
    <Box x={67} y={286} width={506} height={110} title="OSの隔離は別の層" lines={['ファイル・通信・実行権限の境界を設計','deny設定と承認だけで隔離完了とはしない']} tone="teal"/>
   </>:f.stage===2?<>
    <Box x={32} y={91} width={260} height={152} title="ソフトウェア" lines={['無料でもライセンスを確認','更新・設定・保守の工数']} tone="violet"/>
    <Box x={348} y={91} width={260} height={152} title={cost==='api'?'推論：APIの従量':'推論：計算資源'} lines={cost==='api'?['組織キー・消費上限','送信経路・契約条件']:['GPU等の資源・電力','配置・性能・運用の工数']} tone="teal" data-inference-cost-path={cost}/>
    <Text y={350} small>使う頻度・レビュー・保守を含めて比較し、金額は測る</Text>
   </>:f.stage===3?<>
    {['MCPの実対応','規約ファイル','モデル接続'].map((t,i)=><Box key={t} x={32+i*197} y={83} width={182} height={97} title={t} tone="violet"/>)}
    <Box x={77} y={266} width={486} height={127} title="移行・保守の負担を確認" lines={['AGENTSと独自形式を照合','Aider等の未確認は、そのまま残す','代替候補と依存の見直しを持つ']} tone="teal"/>
   </>:<>
    <Box x={32} y={82} width={260} height={164} title="実行の環境" lines={['OpenHandsのDocker・VM','他ツールのローカル実行','利用者が隔離を設計']} tone="violet"/>
    <Box x={348} y={82} width={260} height={164} title="組織の管理" lines={['共有する設定とルール','組織キー・CIの検査','担当・監査・更新方針']} tone="teal"/>
    <Text y={350} small>OSS単体に、SSO・強制policy・監査が揃うとはしない</Text>
   </>}
  </>}</OptionsCanvas>}>{children}</OptionsFigure>
}
