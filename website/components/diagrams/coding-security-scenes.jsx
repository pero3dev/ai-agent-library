'use client'
import { useState } from 'react'
import { ControlFigure,ControlCanvas,Text,Box,Wire,Select } from './coding-controls-primitives'
import { codingPermissionPath } from '../../lib/coding-controls-model.mjs'
export function CodingSecurityThreatPaths({children}){
  return <ControlFigure diagram="coding-security-threat-paths" title="入力から、権限・秘密・外への出口を追う"
    scene={s=><ControlCanvas diagram="coding-security-threat-paths" {...s}>{f=><>
      <Text y={35}>{['信頼できない入力と、強い権限が交差する','外部の文章は、操作の許可へ昇格させない','読み取った秘密は、複数の出口へ流れ得る','誤操作と、未検証の供給元を防御対象にする','送信先と契約を確認し、外へ出す範囲を決める'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={93} width={260} height={121} title="信頼できない入力" lines={['Issue・Web・MCP応答']} tone="violet"/><Box x={348} y={93} width={260} height={121} title="開発環境の権限" lines={['読む・書く・実行・通信']} tone="amber"/>
        <Wire id={s.id} d="M162 214V272H320V291" active phase={f.phase}/><Wire id={s.id} d="M478 214V272H320V291" active phase={f.phase} tone="amber"/><Box x={168} y={299} width={304} height={83} title="被害の到達範囲" lines={['秘密・本番への経路も確認']} tone="amber"/>
      </>:f.stage===1?<>
        {['Issue・PRコメント','Web・依存文書','MCPの応答'].map((t,i)=><g key={t}><Box x={32} y={74+i*94} width={250} height={65} title={t} tone="violet"/><Wire id={s.id} d={`M282 ${106+i*94}H307V200H340`} active phase={f.phase}/></g>)}
        <Box x={348} y={138} width={260} height={136} title="許可の境界で照合" lines={['利用者の権限','現在の対象・作業範囲']} tone="amber" data-external-text-is-authorization="false"/>
        <Text y={397} small>ツール要求も検証する。入力文だけで権限を増やさない</Text>
      </>:f.stage===2?<>
        <Box x={32} y={159} width={220} height={115} title="秘密を読み取る" lines={['.env・認証情報']} tone="amber"/>
        {['モデルへの送信','ログ・会話履歴','コード・コミット'].map((t,i)=><g key={t}><Wire id={s.id} d={`M252 216H304V${106+i*106}H340`} active phase={f.phase} tone="amber"/><Box x={348} y={73+i*106} width={260} height={65} title={t} tone="amber"/></g>)}
        <Text y={412} small>書込禁止でも、読み取りと通信による漏えいは成立する</Text>
      </>:f.stage===3?<>
        <Box x={32} y={99} width={260} height={173} title="意図せず壊す操作" lines={['削除・強制push・DB','「掃除」の誤解も対象']} tone="amber"/><Box x={348} y={99} width={260} height={173} title="未検証の供給元" lines={['MCP・拡張・ルール','定義と応答から誘導']} tone="violet"/>
        <Text y={353}>{['出所・必要権限・保守状況を確かめる','承認済みの範囲で、実効的な制御を置く']}</Text>
      </>:<>
        <Box x={32} y={107} width={260} height={145} title="予定の契約と設定" lines={['保持・学習利用','送信する対象と範囲']} tone="violet"/><Wire id={s.id} d="M292 179H340" active phase={f.phase}/><Box x={348} y={107} width={260} height={145} title="外部への送信" lines={['提供者と保存先を確認','秘密を混ぜない']} tone="amber"/>
        <Text y={350} small>Gitで差分を戻しても、外部へ送った内容は消えない</Text>
      </>}
    </>}</ControlCanvas>}>{children}</ControlFigure>
}
export function CodingSecurityPermissionModes({children}){
  const [mode,setMode]=useState('ask'),[request,setRequest]=useState('bounded')
  const path=codingPermissionPath(mode,request)
  const outcomes=path.deny?['拒否：未許可の秘密','読み取りを実行しない']:path.autoExecute?['検証済みの範囲で実行','外への出口は別に制御']:['対象と権限を確認','確認が済むまで実行しない']
  return <ControlFigure diagram="coding-security-permission-modes" title="確認する位置と、自動実行の実効範囲を選ぶ"
    controls={({stage,ready})=>stage>0?<>
      <Select label="操作を制御する方式" value={mode} onChange={setMode} ready={ready}><option value="ask">都度承認</option><option value="allowlist">許可リスト</option><option value="isolated">実効性を確認した隔離内</option></Select>
      <Select label="要求する操作の範囲" value={request} onChange={setRequest} ready={ready}><option value="bounded">事前検証済み・権限内の操作</option><option value="external">外部通信・公開など境界を越える操作</option><option value="secret">未許可の秘密の読み取り</option></Select>
    </>:null}
    scene={s=><ControlCanvas diagram="coding-security-permission-modes" {...s}>{f=><>
      <Text y={35}>{['速さとともに、確認位置と権限の上限を見る','都度承認でも、権限の上限は小さく保つ','操作名だけで、全副作用の安全を判断しない','隔離の名称だけで、通信と認証を許可しない','必要な権限を足す。秘密の読み取りも制御する'][f.stage]}</Text>
      {f.stage===0?<>
        {['都度承認','許可リスト','隔離内自動'].map((t,i)=><Box key={t} x={32+i*197} y={112} width={182} height={112} title={t} tone={i===2?'violet':'teal'} lines={[['操作前に確認','範囲外で確認','境界で確認'][i]]}/>)}
        <Text y={326}>{['対象・入力・操作・隔離の実効性を確認','効率だけで、自動承認の範囲を広げない']}</Text>
      </>:<>
        <Box x={32} y={103} width={260} height={142} title={request==='bounded'?'検証済み・権限内':request==='external'?'境界を越える操作':'未許可の秘密'} lines={[mode==='ask'?'方式：都度承認':mode==='allowlist'?'方式：許可リスト':'方式：隔離内自動']} tone="violet"/>
        <Wire id={s.id} d="M292 174H340" active phase={f.phase} tone={path.deny?'amber':'teal'}/><Box x={348} y={103} width={260} height={142} title={outcomes[0]} lines={[outcomes[1]]} tone={path.deny||path.needsApproval?'amber':'teal'} data-auto-execute={String(path.autoExecute)} data-needs-approval={String(path.needsApproval)} data-operation-denied={String(path.deny)}/>
        <Text y={337} small>{f.stage===4?'文章の禁止と、アクセス権の強制は別の仕組み':'確認済みの権限でも、対象・引数・副作用を検証する'}</Text>
      </>}
    </>}</ControlCanvas>}>{children}</ControlFigure>
}
export function CodingSecurityDefenseAudit({children}){
  return <ControlFigure diagram="coding-security-defense-audit" title="防御を重ね、戻せる変更と外部の影響を分ける"
    scene={s=><ControlCanvas diagram="coding-security-defense-audit" {...s}>{f=><>
      <Text y={35}>{['本番の秘密と、作業環境を分ける','Gitで戻せる差分と、外部の影響を分ける','実行の隔離と、外への出口を重ねて制御する','CIの権限上限と、デプロイの秘密を分離する','読み・実行・変更の記録から、停止と復旧へ'][f.stage]}</Text>
      {f.stage===4?<>
        <Box x={86} y={80} width={468} height={88} title="読む・実行・変更を記録" lines={['ログ自身へ秘密を混ぜない']} tone="violet"/>
        {['停止・失効','影響を特定','復旧・再発防止'].map((t,i)=><g key={t}><Box x={32+i*197} y={254} width={182} height={104} title={t} tone={i===0?'amber':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 306H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Wire id={s.id} d="M320 168V209H123V246" active phase={f.phase} tone="amber"/>
      </>:<>
        <Box x={32} y={104} width={260} height={151} title={['作業専用の環境','コードの差分','実行環境の隔離','CIの狭い権限'][f.stage]} lines={[
          ['ダミー・狭いトークン','除外の実効性を確認'],['ブランチ・コミット','テスト・人のレビュー'],['コンテナ・VM等','到達できる対象を制限'],['書込範囲・秘密を限定','必要な資格情報だけ']][f.stage]} tone="teal"/>
        <Box x={348} y={104} width={260} height={151} title={['本番・秘密の環境','外部の副作用','ネットワーク境界','デプロイ用の秘密'][f.stage]} lines={[
          ['本物の秘密を置かない','会話ログも取扱い確認'],['API・DB・公開した秘密','Gitだけでは戻らない'],['送信先を制限','認証・出口も確認'],['別の権限と経路に分離','無人実行と同居させず']][f.stage]} tone="amber" data-git-reverts-external={f.stage===1?'false':undefined}/>
        <Text y={348} small>{['ignoreの配置だけで、全アクセスを防いだと扱わない','差分の復元と、外部の影響の回復を別に設計する','単一の文章フィルタに、全ての防御を任せない','実際のファイル・通信権限も、CIの上限を決める'][f.stage]}</Text>
      </>}
    </>}</ControlCanvas>}>{children}</ControlFigure>
}
