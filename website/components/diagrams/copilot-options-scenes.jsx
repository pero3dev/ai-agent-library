'use client'
import { useState } from 'react'
import { OptionsFigure,OptionsCanvas,Text,Box,Wire,Select } from './coding-options-primitives'
import { copilotApproval,copilotExclusion } from '../../lib/coding-options-model.mjs'
export function CopilotSurfacesFlow({children}){
 const [enabled,setEnabled]=useState('off'),[changed,setChanged]=useState('no'),approval=copilotApproval({enabled:enabled==='on',newCommit:changed==='yes'})
 return <OptionsFigure diagram="copilot-surfaces-flow" title="同じCopilotでも、入口・成果物・確認位置が違う"
  controls={({stage,ready})=>stage===2?<><Select label="管理者の承認設定" value={enabled} onChange={setEnabled} ready={ready}><option value="off">未有効</option><option value="on">previewを有効化</option></Select><Select label="レビュー後のcommit" value={changed} onChange={setChanged} ready={ready}><option value="no">追加なし</option><option value="yes">新commitが入った</option></Select></>:null}
  scene={s=><OptionsCanvas diagram="copilot-surfaces-flow" {...s}>{f=><>
   <Text y={35}>{['名称を一つの実行方式にまとめない','対話で編集するか、タスクを委任するか','承認可能性の評価と、承認の算入は別','探索・編集・コマンド・push後の確認','コメント解決と、マージの判断は別'][f.stage]}</Text>
   {f.stage===0?<>
    {['補完・Chat','IDE Agent・CLI','cloud agent','code review'].map((t,i)=><Box key={t} x={32+i%2*316} y={82+Math.floor(i/2)*126} width={260} height={95} title={t} lines={[["入力・質問"],["対話的な作業"],["非同期でPR"],["指摘・評価"]][i]} tone={i===3?'teal':'violet'}/>)}
    <Text y={365} small>改称・課金・学習条件の変更は、本文の確認日へ照合</Text>
   </>:f.stage===1?<>
    <Box x={32} y={84} width={260} height={178} title="IDE・CLI" lines={['人との同期・対話','ローカルで編集・実行','IDEはKeep／Undo']} tone="violet"/>
    <Box x={348} y={84} width={260} height={178} title="cloud agent" lines={['Issue等から非同期委任','Actionsの環境で実行','copilot/のブランチとPR']} tone="teal"/>
    <Text y={341} small>変更の確かめ方と、復元の単位を提供面へ合わせる</Text>
    <Text y={391} small>元記事の最大時間・preview・トリガーの条件を保持</Text>
   </>:f.stage===2?<>
    <Box x={32} y={81} width={260} height={137} title="承認可能性の評価" lines={['レビュー概要に判断','評価だけは承認数へ算入しない']} tone="violet" data-assessment-counts="false"/>
    <Box x={348} y={81} width={260} height={137} title={approval.approvalCanCount?'承認へ算入し得る':approval.approvalInvalidated?'承認は失効':'承認機能は未有効'} lines={['管理者のopt-in preview','対象・保護規則を確認']} tone={approval.approvalCanCount?'teal':'amber'} data-approval-can-count={String(approval.approvalCanCount)}/>
    <Box x={77} y={291} width={486} height={109} title="チームのレビュー方針へ照合" lines={['承認の有無だけで、自動マージとはしない','新commitを加えたら承認状態を確かめ直す']} tone="teal" data-automatic-merge="false"/>
   </>:f.stage===3?<>
    {['索引・検索','差分を確認','コマンド実行','push後のCI'].map((t,i)=><g key={t}><Box x={32+i%2*316} y={82+Math.floor(i/2)*136} width={260} height={96} title={t} lines={i===3?['cloudのworkflowは人手ゲート']:i===1?['IDEの復元とPRの却下は別']:['提供面の環境と権限を確認']} tone={i===3?'amber':'violet'}/></g>)}
    <Wire id={s.id} d="M292 130H340M478 178V210M348 266H300" active phase={f.phase}/>
    <Text y={392} small>cloud内のテストと、pushで始まるworkflowは別</Text>
   </>:<>
    <Box x={32} y={89} width={260} height={145} title="再レビューの解析" lines={['SDKのshell tools','firewall内で検査','修正した指摘を解決']} tone="violet"/>
    <Wire id={s.id} d="M292 162H340" active phase={f.phase}/><Box x={348} y={89} width={260} height={145} title="指摘を人が検証" lines={['的外れや見逃しを確認','解決と承認を分ける','元記事の提供条件へ照合']} tone="teal"/>
    <Text y={341} small>コメントの解決だけで、全問題を検出したとは言えない</Text>
   </>}
  </>}</OptionsCanvas>}>{children}</OptionsFigure>
}
export function CopilotPolicyBoundaries({children}){
 const [surface,setSurface]=useState('app-cli'),exclusion=copilotExclusion(surface)
 return <OptionsFigure diagram="copilot-policy-boundaries" title="提供面とプランごとに、設定・強制・データを確認"
  controls={({stage,ready})=>stage===1?<Select label="コンテンツ除外を使う面" value={surface} onChange={setSurface} ready={ready}><option value="app-cli">app・CLI</option><option value="ide-agent">IDE Edit・Agent</option><option value="cloud">cloud agent</option></Select>:null}
  scene={s=><OptionsCanvas diagram="copilot-policy-boundaries" {...s}>{f=><>
   <Text y={35}>{['指示の順位と、管理者の拒否制限は別','除外の対応は、元記事の提供面で異なる','cloudは、一つの承認で全部を通さない','学習設定とコード一致フィルターを分ける','接続の設定と、組織ポリシーの範囲を分ける'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={73} width={506} height={105} title="規約：個人 → repository → 組織" lines={['全体・パス別・階層を読む','AGENTSと互換ファイルは提供面別']} tone="violet"/>
    <Box x={67} y={258} width={506} height={124} title="操作制限：管理者の境界" lines={['読取・編集・shell・networkの許可／拒否','利用者の指示や保存した承認で緩めない']} tone="teal"/>
    <Text y={215} small>自然文の指示と、アクセスの強制を同一視しない</Text>
   </>:f.stage===1?<>
    <Box x={67} y={83} width={506} height={138} title={exclusion.status==='supported'?'対応：app・CLI':exclusion.status==='unsupported'?'未対応：IDE Edit・Agent':'未確認：cloud agent'} lines={['元記事の2026-09確認範囲','対応の一般化をせず、経路と権限を設計']} tone={exclusion.status==='supported'?'teal':'amber'} data-content-exclusion={exclusion.status}/>
    <Box x={67} y={294} width={506} height={96} title="GA・preview・OSの違いを確認" lines={['企業操作制御とJetBrains sandboxも別の提供面']} tone="violet"/>
   </>:f.stage===2?<>
    {['copilot/へpush','workflowを人が許可','レビュー・保護規則','firewall・自動検査'].map((t,i)=><Box key={t} x={67} y={76+i*80} width={506} height={61} title={t} tone={i===1?'amber':'violet'}/>)}
    <Text y={421} small>依頼者自身のPR承認は不可。CIの権限も先に確認</Text>
   </>:f.stage===3?<>
    <Box x={32} y={86} width={260} height={168} title="契約のデータ条件" lines={['個人：既定利用・opt-out','組織：契約で不使用','予定プランを照合']} tone="teal"/>
    <Box x={348} y={86} width={260} height={168} title="公開コードの一致" lines={['Blockの設定を確認','cloudでは一致生成があり得る','一致情報のログを確認']} tone="amber"/>
    <Text y={340} small>学習利用・推論送信・一致コード生成は別の項目</Text>
   </>:<>
    <Box x={32} y={87} width={260} height={157} title="GitHubのMCP設定" lines={['cloudとcode review','接続元・OAuth・ツール','第三者Agentの有効化']} tone="violet"/>
    <Box x={348} y={87} width={260} height={157} title="組織の対象を確認" lines={['Business／Enterpriseのseat','他社appの利用は別','APIとmetricsで管理']} tone="teal"/>
    <Text y={343} small>同じGitHub MCPへの接続でも、強制の範囲は別</Text>
   </>}
  </>}</OptionsCanvas>}>{children}</OptionsFigure>
}
export function CopilotAdoptionBudget({children}){
 const [requested,setRequested]=useState('no'),[approved,setApproved]=useState('no')
 return <OptionsFigure diagram="copilot-adoption-budget" title="管理、消費、移行期限を混ぜずに導入する"
  controls={({stage,ready})=>stage===3?<><Select label="予算増額の申請" value={requested} onChange={setRequested} ready={ready}><option value="no">申請なし</option><option value="yes">申請した</option></Select><Select label="管理者の予算判断" value={approved} onChange={setApproved} ready={ready}><option value="no">未承認・拒否</option><option value="yes">承認・調整済み</option></Select></>:null}
  scene={s=><OptionsCanvas diagram="copilot-adoption-budget" {...s}>{f=><>
   <Text y={35}>{['シートとCredits、機能とモデルを別に管理','Copilot上の廃止予定と、提供元APIは別','告知日・適用日・個別設定を分ける','モデルの選択と、予算の承認を分ける','GitHub中心の用途を、制約へ照合する'][f.stage]}</Text>
   {f.stage===0?<>
    {['シート：利用者の契約','Credits：モデルの消費','機能・モデル：管理policy'].map((t,i)=><Box key={t} x={67} y={81+i*100} width={506} height={75} title={t} tone={i===2?'teal':'violet'}/>)}
    <Text y={420} small>補完・reviewの消費帰属・予算上限は本文の条件へ</Text>
   </>:f.stage===1?<>
    <Box x={32} y={81} width={260} height={150} title="本文時点の告知" lines={['9月10日：既に廃止','10月2日・19日：予定','本文の移行先を確認']} tone="violet"/>
    <Wire id={s.id} d="M292 156H340" active phase={f.phase}/><Box x={348} y={81} width={260} height={150} title="設定を点検" lines={['保存したモデル選択','組織allowlist・自動化','実施前に公式で再確認']} tone="teal"/>
    <Text y={337} small>Copilotの提供終了を、各社APIの退役日へ移さない</Text>
   </>:f.stage===2?<>
    <Box x={67} y={77} width={506} height={101} title="機能の既定：10月22日適用予定" lines={['元記事の9月24日告知。適用中とはしない']} tone="violet"/>
    <Box x={32} y={263} width={260} height={127} title="個別設定を保持" lines={['未設定のGA機能へ既定','既存の指定は優先']} tone="teal"/>
    <Box x={348} y={263} width={260} height={127} title="preview・例外" lines={['previewは明示有効化','所在地・ローカル保存等']} tone="amber"/>
   </>:f.stage===3?<>
    <Box x={32} y={79} width={260} height={155} title="Autoの選択方針" lines={['効率・balance・intelligence','候補集合の選び方を変える','実際のモデルに沿う消費']} tone="violet"/>
    <Box x={348} y={79} width={260} height={155} title={approved==='yes'?'管理者が予算を判断':requested==='yes'?'申請だけでは増えない':'現在の予算を確認'} lines={['管理者が承認・調整・拒否','申請と決定を別に扱う']} tone={approved==='yes'?'teal':'amber'} data-budget-increase={String(approved==='yes')}/>
    <Text y={345} small>図の操作は申請・契約・支出を実行しません</Text>
   </>:<>
    <Box x={32} y={81} width={260} height={164} title="開発フローの価値" lines={['Issue → PR → review','組織管理・監査との統合','補完から段階的に導入']} tone="violet"/>
    <Box x={348} y={81} width={260} height={164} title="採用前の条件" lines={['SCM・除外の提供面','学習利用と管理者の設定','CI権限・レビュー体制']} tone="teal"/>
    <Text y={347} small>チームの用途・要件で試用し、料金の現在値は公式へ</Text>
   </>}
  </>}</OptionsCanvas>}>{children}</OptionsFigure>
}
