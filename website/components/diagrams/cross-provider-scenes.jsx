'use client'
import {useId,useState} from 'react'
import {IntegrationCanvas,IntegrationFigure,IntegrationPair,IntegrationThree,Text,Box,Wire,Select,Tokens} from './model-mcp-evaluation-primitives'
import {modelVariantGate} from '../../lib/model-mcp-evaluation-model.mjs'
const comparisons={
 markup:['構造の記法',['XML中心','役割別のタグ','自然な階層'],['見出しとXML','素の段落も使う','過剰整形を避ける'],['XMLも見出しも','一貫した区切り','制約を明示']],
 role:['指示の役割',['systemで役割','途中の対応は別','原文の時点へ'],['developer','userより優先','APIへ照合'],['systemの指示','重要な制約を先','曖昧語を定義']],
 examples:['例の方針',['用途に合う例','多様性と構造','原文の目安'],['zero-shot先','必要なら例示','矛盾を点検'],['few-shot推奨','形式を統一','数は実験で調整']],
 thinking:['思考制御',['adaptive','effort','対象世代で照合'],['reasoning','effortとmode','既定はモデル別'],['thinking_level','API面も確認','数値予算は別']],
 output:['機械処理の出力',['構造化出力','形式と意味は別','業務検証を保持'],['strict schema','拒否・打切り','業務検証を保持'],['JSONとschema','深い型の拒否','業務検証を保持']],
 prefill:['prefillの扱い',['最新世代の拒否','用途別に移行','原文の世代へ'],['主要技法にせず','出力契約へ移す','未確認を保持'],['未確認','前提にしない','APIへ照合']],
 sampling:['samplingの扱い',['非既定値の拒否','最新世代を照合','全世代に拡張せず'],['Astraは非対応','旧モデルと区分','APIへ照合'],['3.xは既定維持','低温度の劣化','安全保証にせず']],
 context:['長い文脈',['資料を先に置く','問いは末尾','文書をXML化'],['必要箇所を検索','状態を圧縮','探索上限を保持'],['資料を先に置く','問いは末尾','転換句を添える']],
 emphasis:['強い表現',['CRITICAL等','過剰反応に注意','必要な行動を明示'],['ALWAYS等','不変条件に限定','矛盾を点検'],['過度な説得を避け','目標を直接述べる','曖昧語を定義']]
}
export function CrossProviderMap({children}){
 const id=useId(),[axis,setAxis]=useState('thinking'),row=comparisons[axis]
 return <IntegrationFigure diagram="cross-provider-map" title="共通の骨格と、三社の差分" scene={({phase})=><IntegrationCanvas diagram="cross-provider-map" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['意図と制約を保ち、記法と設定を個別にする','同じ観点で、原文の三社を並べる','共通の値を送ると、拒否や静かな劣化が起きる','名前・水準・既定は、モデルと世代に結び付く','呼出し・履歴・数値予算の例外を保持する'][stage]}</Text>
  {stage===0?<IntegrationPair id={id} phase={phase} left={['共通する骨格','タスクの意図と制約','データとの境界','評価と運用の手順']} right={['モデルに依存','記法・パラメータ・API','世代別の既定と条件','個別の正本へ戻る']}/>:stage===1?<>
   <IntegrationThree columns={['Claude','OpenAI','Gemini'].map((name,i)=>[name,...row[i+1]])}/>
   <Text y={329} small>原文比較: 2026-09-10</Text>
  </>:stage===2?<>
   <Tokens labels={['sampling','思考量','強い補助']} y={104} selected={[0,1,2]}/>
   <Box x={64} y={232} width={512} height={136} title="一つの共通設定を、全モデルへ送らない" lines={['受理する設定と、推奨する使い方は別','temperature=0を共通化しない','リクエスト受理だけで品質を認定せず']} tone="amber"/>
  </>:stage===3?<IntegrationThree columns={['Claude','OpenAI','Gemini'].map((name,i)=>[name,...comparisons.thinking[i+1]])}/>:<IntegrationPair id={id} phase={phase} arrow={false} left={['Fableの原文条件','strict引数と呼出しは別','前方の履歴と思考を保持','旧モデルfallbackを検証']} right={['Geminiの原文条件','数値予算を一律廃止せず','2.5 Live等の条件を照合','SDKの型だけで決めない']}/>}
 </>}</IntegrationCanvas>} controls={({stage,ready})=>stage===1?<Select label="三社を比べる観点" value={axis} onChange={setAxis} ready={ready}>{Object.entries(comparisons).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:null}>{children}</IntegrationFigure>
}
export function CrossProviderMigration({children}){
 const id=useId(),[missing,setMissing]=useState('regression')
 const decision=modelVariantGate({apiCompatible:missing!=='api',parametersPinned:missing!=='parameters',outputContractChecked:missing!=='output',tokenBudgetMeasured:missing!=='budget',regressionPassed:missing!=='regression'})
 return <IntegrationFigure diagram="cross-provider-migration" title="API・予算・回帰と、管理するバリアント" scene={({phase})=><IntegrationCanvas diagram="cross-provider-migration" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['移行で壊れる箇所を、対象ごとに点検する','APIの非互換と、出力の形式を照合する','思考制御と強調の効果を、移行先で評価する','同じ文章でも、tokenizerと予算を測り直す','崩れた入力も含め、同じ成功条件で比較する','共通骨格と、薄いモデル別の差分を管理する'][stage]}</Text>
  {stage===0?<><Tokens labels={['API','思考','出力','予算','回帰']} y={103} selected={[0,1,2,3,4]}/><Box x={64} y={230} width={512} height={136} title="非互換・既定・品質を、別々に照合" lines={['個別ガイドと公式の対象条件へ戻る','運用の段階リリースは正本へ接続']} tone="violet"/></>:stage===1?<IntegrationPair id={id} phase={phase} left={['旧リクエスト','prefill・固定budget','非既定のsampling','受理しない設定を検出']} right={['移行先の出力','対応するschemaへ移す','型と意味の検証を分ける','API面の機能を照合']}/>:stage===2?<IntegrationPair id={id} phase={phase} left={['思考の名前と既定','移行先の水準へ変換','既定を明示して固定','高い値を品質にしない']} right={['強い補助を再評価','CRITICAL／ALWAYS等','過剰反応と非互換','必要な制約だけを保持']}/>:stage===3?<><Tokens labels={['同じ文章','対象tokenizer','枠と費用']} y={100} selected={[0,1,2]}/><Box x={64} y={230} width={512} height={139} title="出力枠・文脈予算・費用を再計算" lines={['原文の増分例を全モデルへ拡張せず','模式図はtoken数や価格を捏造しない','採用する設定で実測する']} tone="violet"/></>:stage===4?<Box x={64} y={112} width={512} height={190} title={decision.reviewCandidate?'移行を検討する候補':'不足を残して評価へ戻る'} lines={['API・設定・出力の契約を確認','token予算と代表入力の回帰','言い換えと崩れた入力も含める','図は本番へ反映しない']} tone={decision.reviewCandidate?'teal':'amber'} data-cross-migration-candidate={String(decision.reviewCandidate)} data-cross-deployment-executed="false"/>:<>
   <Box x={64} y={81} width={512} height={102} title="共通骨格: 意図・制約・成功条件" lines={['接続層でモデル選択と差分を解決する']} tone="violet"/>
   <IntegrationThree y={218} columns={['Claude','OpenAI','Gemini'].map(name=>[name,'固有の記法と制御','版を管理する','回帰を確認する'])}/>
  </>}
 </>}</IntegrationCanvas>} controls={({stage,ready})=>stage===4?<Select label="横断移行の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="api">APIの互換</option><option value="parameters">制御と既定の固定</option><option value="output">出力の契約</option><option value="budget">token予算の実測</option><option value="regression">代表入力の回帰</option><option value="none">必要条件を照合</option></Select>:null}>{children}</IntegrationFigure>
}
