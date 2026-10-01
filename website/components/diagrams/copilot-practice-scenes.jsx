'use client'
import { useState } from 'react'
import { PracticeFigure,PracticeCanvas,Text,Box,Wire,Select } from './coding-practice-primitives'
import { copilotBudgetMinimum } from '../../lib/coding-practice-model.mjs'
export function CopilotPracticeFunctionsConfig({children}){
 const [task,setTask]=useState('completion'),tasks={plan:['Chat：計画・技術選定','人が前提と方針を判断'],completion:['補完・Next edit','打鍵中に人が採否'],edit:['edit：対象を絞る編集','対象ファイルと承認を人が握る'],agent:['agent：複数stepの反復','節目で人が承認'],cloud:['cloud：Issue単位の委任','非同期のPRを事後レビュー'],review:['review：指摘を検証','assessmentとpreview承認は別']},choice=tasks[task]
 return <PracticeFigure diagram="copilot-practice-functions-config" title="機能ごとの制御と、指示・添付・記憶の違い"
  controls={({stage,ready})=>stage===0?<Select label="行うタスク" value={task} onChange={setTask} ready={ready}>{Object.entries(tasks).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:null}
  scene={s=><PracticeCanvas diagram="copilot-practice-functions-config" {...s}>{f=><>
   <Text y={35}>{['同じCopilotでも、人の制御の位置は異なる','明確で小さい委任と、向かない仕事を分ける','指示の配置と、その機能の対応を合わせる','検索で得る部分と、毎回注入する全文を分ける','記憶の内容・保持・対応する面を確認する'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={82} width={506} height={126} title={choice[0]} lines={[choice[1]]} tone="violet" data-copilot-practice-task={task}/>
    <Wire id={s.id} d="M320 208V265" active phase={f.phase}/><Box x={67} y={275} width={506} height={119} title="対象と完了条件を確かめる" lines={['機能ごとの提供面へ照合','全機能に同じ承認位置を付けない']} tone="teal"/>
   </>:f.stage===1?<>
    <Box x={32} y={82} width={260} height={171} title="小さく明確なIssue" lines={['修正・test・文書・負債','問題・受入条件・対象','CLI：planとdelegate']} tone="teal"/>
    <Box x={348} y={82} width={260} height={171} title="向かない四条件" lines={['横断の広い知識','本番critical・機密','曖昧な要求・学習目的']} tone="amber"/>
    <Text y={355} small>事後レビューで、人が仕様・差分・実行結果を確認</Text>
   </>:f.stage===2?<>
    <Box x={32} y={82} width={260} height={171} title="指示の種類" lines={['全体・パス別・互換file','prompt・skills・agents','面別の対応表へ照合']} tone="violet"/>
    <Box x={348} y={82} width={260} height={171} title="PRのcode review" lines={['base branchの指示','PR側の新指示とは別','組織配布と適用を確認']} tone="teal" data-review-instructions="base"/>
    <Text y={354} small>置いただけで全機能へ適用されるとしない</Text>
   </>:f.stage===3?<>
    <Box x={32} y={82} width={260} height={171} title="Repository添付" lines={['検索で関連部分を取得','大規模な対象を探索','必要な情報を絞る']} tone="violet"/>
    <Box x={348} y={82} width={260} height={171} title="File添付" lines={['毎queryに全文を注入','常に参照する少数file','精度と消費へ影響']} tone="amber"/>
    <Text y={354} small>Spacesは、必要な量と関連する情報を合わせる</Text>
   </>:<>
    <Box x={67} y={82} width={506} height={134} title="Copilot Memory" lines={['repositoryの事実と個人の嗜好','cloud・review・CLI等で共有']} tone="violet"/>
    <Box x={67} y={283} width={506} height={111} title="本文時点のpreview・保持条件" lines={['JetBrains追加と未使用28日を時点別に読む','未再確認を残し、永続保証へしない']} tone="amber"/>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
const budgetCases={user:{user:0,cost:80,organization:130,enterprise:200},cost:{user:100,cost:20,organization:80,enterprise:200},organization:{user:100,cost:80,organization:10,enterprise:200},enterprise:{user:100,cost:80,organization:130,enterprise:5},tie:{user:20,cost:20,organization:130,enterprise:200}}
export function CopilotPracticeBudgetCache({children}){
 const [budget,setBudget]=useState('organization'),values=budgetCases[budget],state=copilotBudgetMinimum(values),names={user:'ユーザー',cost:'コストセンター',organization:'組織',enterprise:'企業'}
 return <PracticeFigure diagram="copilot-practice-budget-cache" title="消費、キャッシュ、4階層の残枠を別々に読む"
  controls={({stage,ready})=>stage===3?<Select label="説明用の予算残枠" value={budget} onChange={setBudget} ready={ready}><option value="user">ユーザー残枠0</option><option value="cost">コストセンターが最少</option><option value="organization">組織が最少</option><option value="enterprise">企業が最少</option><option value="tie">ユーザーとコストセンターが同値</option></Select>:null}
  scene={s=><PracticeCanvas diagram="copilot-practice-budget-cache" {...s}>{f=><>
   <Text y={35}>{['現行Creditsと、旧リクエスト乗数は別','計画・会話・環境・ツールを整える','設定変更とタスクの切れ目を合わせる','重なった予算では、最少残枠が先に効く','請求と導入効果は、別の測定系統'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={81} width={260} height={172} title="AI Credits" lines={['token × モデル単価','旧乗数を適用しない','cache比率は本文時点']} tone="violet"/>
    <Box x={348} y={81} width={260} height={172} title="別に見る消費" lines={['cloud・review：Actions分','有料の補完・Next edit','Creditsの扱いは元記事へ']} tone="teal"/>
    <Text y={355} small>Auto割引と単価は確認日付き。現在の額を作らない</Text>
   </>:f.stage===1?<>
    {['計画と実装：適したモデル','会話：new・clear・compact','環境：instructions・setup steps','能力：必要なtoolだけ有効'].map((t,i)=><Box key={t} x={67} y={76+i*81} width={506} height={62} title={t} tone="violet"/>)}
    <Text y={419} small>品質と消費を測り、無駄な探索・環境試行を減らす</Text>
   </>:f.stage===2?<>
    <Box x={32} y={82} width={260} height={170} title="会話途中の変更" lines={['モデル・reasoning','tool構成の変更','長い放置後の復帰']} tone="amber"/>
    <Wire id={s.id} d="M292 166H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={170} title="タスクの切れ目" lines={['先にセッションを分ける','必要なモデルへ切替','cacheの条件を確認']} tone="teal"/>
    <Text y={356} small>本文時点の失効条件。現在の比率と提供条件を確認</Text>
   </>:f.stage===3?<>
    {Object.entries(values).map(([key,value],i)=><Box key={key} x={32+i%2*316} y={79+Math.floor(i/2)*130} width={260} height={99} title={names[key]} lines={[`説明用の残枠：${value}`]} tone={state.firstBudgets.includes(key)?'amber':'violet'} data-first-budget={state.firstBudgets.includes(key)?key:undefined}/>)}
    <g data-user-hard-stop={String(state.userHardStop)}><Text y={362} small>{state.userHardStop?'ユーザー残枠0：ULBは常にhard stop':'最少の残枠へ照合。超過時ポリシーは別に確認'}</Text></g>
    <Text y={415} small>架空の残枠。組織poolは個人割当でない・月初UTCにreset</Text>
   </>:<>
    <Box x={32} y={83} width={260} height={170} title="請求と予算" lines={['AI usage dashboard','CSV・課金usage API','poolと超過方針を管理']} tone="teal"/>
    <Box x={348} y={83} width={260} height={170} title="導入の効果" lines={['usage metrics API','別系統の指標','費用と品質へ照合']} tone="violet"/>
    <Text y={357} small>未使用分の繰越なし。過去の数値は元の条件へ戻す</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
export function CopilotPracticeAutomation({children}){
 const [enabled,setEnabled]=useState('off'),[changed,setChanged]=useState('no'),canCount=enabled==='on'&&changed==='no'
 return <PracticeFigure diagram="copilot-practice-automation" title="依頼、起動、消費帰属と承認の境界"
  controls={({stage,ready})=>stage===2?<><Select label="preview承認の管理設定" value={enabled} onChange={setEnabled} ready={ready}><option value="off">off：既定</option><option value="on">対象を有効化</option></Select><Select label="レビュー後の追加commit" value={changed} onChange={setChanged} ready={ready}><option value="no">追加なし</option><option value="yes">新commitあり</option></Select></>:null}
  scene={s=><PracticeCanvas diagram="copilot-practice-automation" {...s}>{f=><>
   <Text y={35}>{['問題・受入条件・対象を示して委任する','同じ起動でも、消費の帰属は異なる','assessmentと、必要承認数への算入は別','read-onlyと、宣言したsafe outputsを分ける'][f.stage]}</Text>
   {f.stage===0?<>
    {['Issue：問題・受入条件・対象','Cloud：限定した仕事をPR化','Review：修正依頼をまとめて送る'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>APIのプラン・token、agent・modelの対応は本文へ</Text>
   </>:f.stage===1?<>
    <Box x={32} y={82} width={260} height={173} title="automations" lines={['作成者へ消費帰属','private・internal対象','無権限起点は既定無視']} tone="violet"/>
    <Box x={348} y={82} width={260} height={173} title="自動code review" lines={['PR作成者へ帰属','ruleset・draftの設定','effortで消費も確認']} tone="teal"/>
    <Text y={357} small>CreditsだけでなくActions分も、元記事の条件で確認</Text>
   </>:f.stage===2?<>
    <Box x={32} y={82} width={260} height={156} title="assessment" lines={['承認可能性の評価','評価は承認数に入れない']} tone="violet" data-practice-assessment-counts="false"/>
    <Box x={348} y={82} width={260} height={156} title={canCount?'承認算入の条件一致':changed==='yes'?'新commitで失効':'承認は未有効'} lines={['管理設定・対象pathを照合','保護規則と人の承認方針']} tone={canCount?'teal':'amber'} data-practice-approval-counts={String(canCount)}/>
    <Text y={356} small>本文時点のpublic preview。自動マージの許可とは別</Text>
   </>:<>
    <Box x={32} y={83} width={260} height={169} title="Agentの実行" lines={['Markdownで定義','read-onlyが既定','宣言したengineを使う']} tone="violet"/>
    <Wire id={s.id} d="M292 168H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={169} title="safe outputs" lines={['宣言した出力を経由','書込の範囲を制限','実行あたりCredits上限']} tone="teal"/>
    <Text y={356} small>本文時点のpreview。素のCLIへ同じ防御を転用しない</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
