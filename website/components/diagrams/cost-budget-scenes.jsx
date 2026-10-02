'use client'
import {useId,useState} from 'react'
import {BudgetCanvas,BudgetFigure,BudgetPair,BudgetThree,Text,Box,Select,Tokens} from './service-budgets-primitives'
import {toyHistoryInput,toyCacheAccounting,budgetLayers} from '../../lib/service-budgets-model.mjs'
export function CostHistoryMeasurement({children}){
 const id=useId(),[steps,setSteps]=useState('5'),[cap,setCap]=useState('8'),result=toyHistoryInput({steps:Number(steps),fixed:4,increment:2,historyCap:Number(cap)})
 return <BudgetFigure diagram="cost-history-measurement" title="タスク費用の変動と、履歴を再送する累積" scene={({phase})=><BudgetCanvas diagram="cost-history-measurement" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['回数・履歴・固定入力が、タスクごとに変わる','同じ履歴増分を再送する、模式の累積を読む','ユーザー本文以外も、入力に含める','削減の前に、タスク1件の単位経済を測る','平均と、暴走する分布の裾を分けて追う'][stage]}</Text>
  {stage===0?<BudgetThree columns={[['回数の変動','入力で回数変動','簡単／厄介で変化','同じ機能でも違う'],['履歴の再送','毎回履歴を渡す','進行で入力膨張','圧縮で条件が変化'],['固定の入力','system・tool定義','toolの結果も入力','本文だけを数えず']]}/>:stage===1?<>
   <Text y={85}>{`模式${steps}ステップ: 総入力 ${result.total}単位`}</Text>
   {result.rows.map((row,i)=><g key={i}><rect x={68+i*66} y={326-row.fixed*11} width={40} height={row.fixed*11} rx={4} className="sb-bar-teal"/><rect x={68+i*66} y={326-row.input*11} width={40} height={row.history*11} rx={4} className="sb-bar-amber"/><Text x={88+i*66} y={312-row.input*11} small>{row.input}</Text><Text x={88+i*66} y={357} small>{i+1}</Text></g>)}
   <Text y={398} small>緑: 固定4／黄: 履歴が毎回2増加。圧縮の品質は別に確認。</Text>
   <g data-cost-history-total={result.total} data-cost-tokens-measured="false" data-cost-quality-verified="false"/>
  </>:stage===2?<BudgetPair id={id} phase={phase} arrow={false} left={['毎回の固定入力','systemの指示','toolの定義と契約','固定でも再送する']} right={['毎回増える内容','ユーザー本文・履歴','toolが返した結果','入力と出力を測る']}/>:stage===3?<BudgetPair id={id} phase={phase} left={['タスク1件のトレース','input・output token','cache読取と書込','使用した版・単価']} right={['単位経済を把握','成功タスクの費用','再試行・人手も含む','実構成で測る']}/>:<BudgetThree columns={[['分布の裾','平均だけを見ない','P95と最大値','迷走が費用を支配'],['属性別に集計','利用者・テナント','機能ごとの構成','タグを記録する'],['日次と判断','月末だけで気付かず','cost rateを監視','上限と対応へ接続']]}/>}
 </>}</BudgetCanvas>} controls={({stage,ready})=>stage===1?<><Select label="模式の履歴再送ステップ数" value={steps} onChange={setSteps} ready={ready}>{['1','3','5','8'].map(n=><option key={n} value={n}>{n}ステップ</option>)}</Select><Select label="模式で保持する履歴の増分数" value={cap} onChange={setCap} ready={ready}><option value="8">追加した全履歴</option><option value="3">直近3増分まで</option><option value="1">直近1増分まで</option></Select></>:null}>{children}</BudgetFigure>
}
export function CostReductionQuality({children}){
 const id=useId(),[prefix,setPrefix]=useState('stable')
 return <BudgetFigure diagram="cost-reduction-quality" title="費用を減らす五つの手段と、品質の条件" scene={({phase})=><BudgetCanvas diagram="cost-reduction-quality" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['どの費用へ効く手段かを区分する','再利用するprefixは、固定の先頭へ集める','圧縮で失う情報を、品質評価で確認する','安い部品と、成功タスクの総費用を分ける','不要な結果と、不要な即時性を減らす'][stage]}</Text>
  {stage===0?<><Tokens labels={['cache','圧縮','モデル','tool結果','batch']} selected={[0,1,2,3,4]} y={85}/><BudgetThree y={188} columns={[['入力の再処理','固定prefixをcache','履歴の圧縮と要約','情報損失を確認'],['部品と結果','役割別のモデル','不要な結果を削減','品質と総費用を比較'],['即時性の条件','急がない処理','非同期の応答へ','最新割引は確認']]}/></>:stage===1?<>
   <Tokens labels={prefix==='stable'?['system','tool定義','固定履歴','可変末尾']:['日時・利用者','system','tool定義','履歴']} selected={prefix==='stable'?[0,1,2]:[]} y={87}/><Box x={64} y={190} width={512} height={192} title={prefix==='stable'?'同じprefixを再利用する候補':'先頭が変わり一致しない'} lines={['可変部分を後ろへ','境界・長さ・モデル条件も確認','図の一致を実cache hitにしない']} tone={prefix==='stable'?'teal':'amber'} data-cost-cache-prefix={prefix==='stable'?'candidate':'changed'} data-cost-cache-hit-measured="false"/>
  </>:stage===2?<BudgetPair id={id} phase={phase} left={['圧縮と要約','長い履歴の入力を減らす','保持する意図と制約','情報の脱落を点検']} right={['変更後の品質評価','元タスクと失敗ケース','低下と削減を比較','小ささだけで採用せず']}/>:stage===3?<BudgetPair id={id} phase={phase} arrow={false} left={['部品モデルの単価','分類・抽出などの役割','小型・安価の候補','成功率を実測する']} right={['成功タスクの総費用','再試行と追加loop','人手対応の負担','単価だけを比較せず']}/>:<BudgetPair id={id} phase={phase} arrow={false} left={['tool結果を絞る','不要なJSONフィールド','取りすぎないtool設計','必要情報は保持する']} right={['急がない処理','評価などオフライン処理','非同期の応答と割引','即時完了とは別']}/>}
 </>}</BudgetCanvas>} controls={({stage,ready})=>stage===1?<Select label="キャッシュ用prefixの模式配置" value={prefix} onChange={setPrefix} ready={ready}><option value="stable">固定部分から可変末尾へ</option><option value="variable">日時・利用者を先頭へ</option></Select>:null}>{children}</BudgetFigure>
}
export function CostBudgetCacheAccounting({children}){
 const id=useId(),[blocked,setBlocked]=useState('task'),[cache,setCache]=useState('reuse'),remaining=budgetLayers({taskRemaining:blocked==='task'?0:10,tenantRemaining:blocked==='tenant'?0:10,systemRemaining:blocked==='system'?0:10}),usage=toyCacheAccounting(cache==='reuse'?{input:100,read:60,write:20}:cache==='rewrite'?{input:100,read:0,write:80}:{input:100,read:0,write:0})
 return <BudgetFigure diagram="cost-budget-cache-accounting" title="三層の上限と、cache読取・書込の計測" scene={({phase})=><BudgetCanvas diagram="cost-budget-cache-accounting" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['上限は、影響範囲を分けて三層に置く','タスクの暴走と、利用者の占有を別に守る','全体の予算から、遮断と対応へ進める','結果と中断理由を残して停止する','通常・読取・書込を、重複せず区分する','再利用の実際と、単価・保持契約を読む','更新の例は、時点と対応経路を保つ'][stage]}</Text>
  {stage<=2?<>
   <BudgetThree columns={[[remaining.blocked.includes('task')?'タスク: 残0':'タスク: 残10','最大ステップ数','task token予算','一件の暴走を守る'],[remaining.blocked.includes('tenant')?'テナント: 残0':'テナント: 残10','期間利用の予算','rate limit','占有と悪用を守る'],[remaining.blocked.includes('system')?'全体: 残0':'全体: 残10','日次・月次予算','circuit breaker','請求事故と対応へ']]}/>
   <Text y={341}>{remaining.mayContinue?'模式の残量あり。実行許可と品質は別に確認。':'残0の層で停止する設計。既費用と既作用は残る。'}</Text><g data-cost-budget-blocked={remaining.blocked.join(',')||'none'} data-cost-budget-may-continue={String(remaining.mayContinue)} data-cost-actually-stopped="false" data-cost-effects-undone="false"/>
  </>:stage===3?<BudgetPair id={id} phase={phase} left={['上限に達したタスク','ここまでの結果を保全','未完了の範囲を明示','中断理由を記録する']} right={['報告して停止する','黙って切り捨てず','復旧・対応手順へ','既作用の取消にせず']}/>:stage===4?<>
   <BudgetThree columns={[[`通常: ${usage.ordinary}`,'inputから区分','模式倍率1','通常を二重加算せず'],[`読取: ${usage.read}`,'cachedの区分','模式倍率0.2','単価は個別確認'],[`書込: ${usage.write}`,'cache writeの区分','模式倍率1.5','末尾の再利用を点検']]}/>
   <Text y={332}>{`模式input 100: 加重合計 ${usage.weighted}（実料金ではない）`}</Text><Text y={393} small>原文仕様の確認: 2026-09-10。実inputの全料金を表さない。</Text><g data-cost-cache-ordinary={usage.ordinary} data-cost-cache-weighted={usage.weighted} data-cost-priced="false" data-cost-billed="false"/>
  </>:stage===5?<BudgetPair id={id} phase={phase} arrow={false} left={['再利用のない書込','可変末尾を毎回write','readとwriteを別計測','書込費用の増加を点検']} right={['個別モデルと契約','割引率を他へ流用せず','保持時間≠削除期限','実契約と最新単価を確認']}/>:<BudgetPair id={id} phase={phase} arrow={false} left={['対応する追記の機構','構成更新とeffort','モデル・経路の条件','原文の確認時点を保つ']} right={['広げない一致の保証','systemの自由な書換え','過去履歴の自由な変更','特化ガイドで再確認']}/>}
 </>}</BudgetCanvas>} controls={({stage,ready})=>stage<=2?<Select label="模式予算の残量がない層" value={blocked} onChange={setBlocked} ready={ready}><option value="task">タスク</option><option value="tenant">テナント</option><option value="system">システム全体</option><option value="none">三層に残量あり</option></Select>:stage===4?<Select label="cacheの模式input内訳" value={cache} onChange={setCache} ready={ready}><option value="reuse">読取60・書込20</option><option value="rewrite">再利用せず書込80</option><option value="none">すべて通常入力</option></Select>:null}>{children}</BudgetFigure>
}
