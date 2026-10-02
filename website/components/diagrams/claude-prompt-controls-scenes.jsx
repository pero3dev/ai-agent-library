'use client'
import {useId,useState} from 'react'
import {VendorCanvas,VendorFigure,VendorPair,Text,Box,Wire,Select,Tokens,ExampleGate,ExampleSelect,MigrationGate,MigrationSelect} from './vendor-prompt-controls-primitives'
import {claudeHistoryRoute} from '../../lib/vendor-prompt-controls-model.mjs'
export function ClaudeStructureExamples({children}){
 const id=useId(),[example,setExample]=useState('conflict')
 return <VendorFigure diagram="claude-structure-examples" title="役割・XML・代表例の境界" scene={({phase})=><VendorCanvas diagram="claude-structure-examples" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['汎用技法と、対象世代の固有条件を照合する','役割に判断基準を、制約に理由を添える','種類ごとのタグで、自然な階層をつくる','数だけを増やさず、例と指示を合わせる'][stage]}</Text>
  {stage===0?<VendorPair id={id} phase={phase} left={['汎用の原理','構造・分解・評価','モデル中立の正本','一般の技法へ戻る']} right={['Claudeの条件','対象モデルと確認日','XML・思考・世代差','最新対応は公式へ戻る']}/>:stage===1?<VendorPair id={id} phase={phase} left={['systemの役割','用途と判断基準','文体と制約の理由','明確な行動と範囲']} right={['会話中の変更','対応モデルを照合','最上位systemと区分','未確認は未確認のまま']}/>:stage===2?<>
   <Tokens labels={['指示','文脈','例','入力']} y={92} selected={[0,1,2,3]}/>
   <Box x={64} y={204} width={512} height={158} title="documents → document → 内容と出典" lines={['同じ役割には一貫したタグ名','文書の中身を指示の権限にしない','出力の形式タグと入力のタグを区分']} tone="violet"/>
  </>:<>
   <Tokens labels={['用途に合う','多様性','構造を統一']} y={98} selected={[0,1,2]}/>
   <Text y={219} small>3〜5は原文の目安。実タスクで比較する</Text><ExampleGate state={example}/>
  </>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===3?<ExampleSelect state={example} setState={setExample} ready={ready}/>:null}>{children}</VendorFigure>
}
export function ClaudeThinkingOutput({children}){
 const id=useId(),[purpose,setPurpose]=useState('format')
 const outputs={format:['機械処理の形式','output_config.format','schemaの制約','アプリで意味を検証'],prose:['文体と前置き','systemで希望を明示','形式タグも使う','禁止より望む形を示す'],continue:['中断した応答','中断文をuserへ移す','継続の目的を明示','元の権限と制約を保つ']}
 return <VendorFigure diagram="claude-thinking-output" title="思考の制御と、出力の契約" scene={({phase})=><VendorCanvas diagram="claude-thinking-output" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['adaptiveとeffortは、違う役割の制御','既定と対応は、対象モデルに結び付く','目標と検証を先に整え、労力を評価する','prefillの旧用途に応じて、移行先を変える'][stage]}</Text>
  {stage===0?<VendorPair id={id} phase={phase} arrow={false} left={['adaptive thinking','いつ・どれだけ思考','モデルの複雑さ判断','既定はモデル別']} right={['effort','応答全体の労力','思考・文・toolに影響','長さの保証ではない']}/>:stage===1?<VendorPair id={id} phase={phase} left={['旧設定の照合','budget_tokens等','世代で可否が変わる','400の境界を確認']} right={['対象のモデル','既定と許容値を照合','原文の時点を保持','設定と実測を合わせる']}/>:stage===2?<VendorPair id={id} phase={phase} left={['先に整える','目標と強い制約','検証できる基準','矛盾を残さない']} right={['労力を比較','自己検証は補助','外部の検証も合わせる','品質・費用を実測']}/>:<>
   <VendorPair id={id} phase={phase} left={['旧prefillの用途','形式・前置き・継続','対象世代の対応を確認','旧設定を盲目的に再送せず']} right={outputs[purpose]}/>
   <Text y={339} small>形式の制約と、業務の意味の検証は別</Text>
  </>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===3?<Select label="prefillの旧用途" value={purpose} onChange={setPurpose} ready={ready}><option value="format">機械処理する形式</option><option value="prose">文体と前置き</option><option value="continue">中断した応答の継続</option></Select>:null}>{children}</VendorFigure>
}
export function ClaudeHistoryMigration({children}){
 const id=useId(),[history,setHistory]=useState('prefix'),[missing,setMissing]=useState('regression')
 const route=claudeHistoryRoute({protectedPrefixChanged:history==='prefix',thinkingPreserved:history!=='thinking',supportedUpdate:history!=='support',updateExpired:history==='expired'||history==='resent',systemResent:history==='resent'})
 const labels={'rebuild-history':'履歴を再構成して照合','confirm-support':'対応の確認へ戻る','retain-and-resend':'期限後も保持して再送','history-candidate':'履歴を照合する候補'}
 return <VendorFigure diagram="claude-history-migration" title="長文・思考履歴・世代更新の条件" scene={({phase})=><VendorCanvas diagram="claude-history-migration" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['先に資料と出典を置き、末尾の問いへつなぐ','必要な行動と、toolを使う条件を明示する','autoとstrictで、呼出しと引数を区分する','保持した思考の前提を、無断で書き換えない','対応する更新と、期限後の履歴を区分する','回帰・保持・旧依存を合わせて移行する'][stage]}</Text>
  {stage===0?<>
   <Tokens labels={['資料・出典','関連の引用','末尾の問い']} y={102} selected={[0,1,2]}/>
   <Box x={64} y={232} width={512} height={132} title="引用を手がかりに、根拠と本題を結ぶ" lines={['配置の効果は実タスクで比較','原文の自己報告を全用途へ拡張せず']} tone="violet"/>
  </>:stage===1?<VendorPair id={id} phase={phase} left={['行動を明示','いつ何を行うか','強い強調を見直す','委任の条件を明示']} right={['toolの記述','目的・入力・副作用','必要な権限と承認','委任で権限を広げない']}/>:stage===2?<VendorPair id={id} phase={phase} arrow={false} left={['呼出しの選択','Fableのautoを照合','any／toolの非互換','必要な行動を明示']} right={['引数の形式','toolのstrictを照合','引数schemaの制約','呼出し強制とは別']}/>:stage===3?<g data-claude-history-next={route.next} data-claude-request-sent="false">
   <Tokens labels={['system・tools','過去の履歴','保持した思考']} y={93} selected={[0,1,2]}/>
   <Box x={64} y={228} width={512} height={135} title={labels[route.next]} lines={['思考と前提の結び付きを保つ','drop・旧モデルfallbackは別に検証']} tone={route.next==='history-candidate'?'teal':'amber'}/>
  </g>:stage===4?<VendorPair id={id} phase={phase} arrow={false} left={['対応する設定更新','betaと提供経路を確認','effortの途中更新','過去本文の編集とは別']} right={['期限つきsystem','期限後も履歴を保持','削除せず再送する条件','対象モデルを確認']}/>:<MigrationGate missing={missing}/>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===3?<Select label="思考履歴の状態" value={history} onChange={setHistory} ready={ready}><option value="prefix">前提を編集した</option><option value="thinking">思考を保持していない</option><option value="support">更新の対応が未確認</option><option value="expired">期限後に再送していない</option><option value="resent">期限後も保持して再送</option><option value="checked">必要な履歴条件を照合</option></Select>:stage===5?<MigrationSelect missing={missing} setMissing={setMissing} ready={ready}/>:null}>{children}</VendorFigure>
}
