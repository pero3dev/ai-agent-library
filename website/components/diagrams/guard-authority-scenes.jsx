'use client'
import {useId,useState} from 'react'
import {AuthorityFigure,AuthorityCanvas,AuthorityPair,AuthorityThree,Text,Box,Wire,Select,Tokens} from './security-authority-primitives'
import {actionGuard,toyGuardQuality,incidentGuard} from '../../lib/security-authority-model.mjs'
export function GuardLayersEnforcement({children}){
 const id=useId(),[missing,setMissing]=useState('approval'),[classifier,setClassifier]=useState('safe'),guard=actionGuard({toolAllowed:missing!=='tool',argsValid:missing!=='args',withinLimit:missing!=='limit',humanApproved:missing!=='approval',llmSaysSafe:classifier==='safe'})
 return <AuthorityFigure diagram="guard-layers-enforcement" title="modelの外で通過を強制し、作用の直前に制約する" scene={({phase})=><AuthorityCanvas diagram="guard-layers-enforcement" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['promptの禁止と、外側で強制する通過制御を分ける','入力・出力・actionの三つの位置にguardを置く','LLMの合格でも、tool・引数・上限・承認を飛ばせない','ruleで書ける制約と、文脈を判定する検査を分ける','検査器も誤る前提で、決定的な制約を維持する'][stage]}</Text>
 {stage===0&&<AuthorityPair left={['promptの禁止指示','modelへ避けるよう依頼','無視や上書きがあり得る','強制制御として数えない']} right={['外側のコード','guardが通さなければ停止','全経路がguardを経由','内容判断の誤りは別に評価']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<AuthorityThree columns={[["入力の前","目的・size・rate","不正patternの検知"],["応答を渡す前","機微・形式・URL","内容検査は誤り得る"],["toolの実行前","許可・引数・上限","承認と隔離を強制"]]}/>}
 {stage===2||stage===4?<><Tokens labels={['tool','引数','上限','承認']} selected={missing==='none'?[0,1,2,3]:[]} y={86}/><AuthorityPair left={['LLM検査の追加層',classifier==='safe'?'検査器は「問題なし」':'検査器は問題を検知','検査器自体も騙され得る','許可や承認にはならない']} right={[guard.reviewCandidate?'実行制約の検討候補':'不足する制約で停止','許可・範囲・総上限を確認','危険な作用は承認も確認','図はtoolを実行しない']} id={id} phase={phase} y={180}/></>:null}
 {stage===3&&<AuthorityPair left={['ruleによる検証','既知形式・範囲・許可','codeで判定できる条件','高速・理由が明確']} right={['LLMによる検査','有害性・話題・根拠','柔軟だが誤り得る判断','ruleの代わりにしない']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>LLMの合格でも独立制約を省かない。図は実guardを実行しない。</Text>
 </>}</AuthorityCanvas>} controls={({stage,ready})=>stage===2||stage===4?<><Select label="action guardで不足する制約" value={missing} onChange={setMissing} ready={ready}><option value="tool">toolが許可されていない</option><option value="args">引数が範囲外</option><option value="limit">総上限を超える</option><option value="approval">必要な承認がない</option><option value="none">四制約を照合</option></Select><Select label="追加LLM検査の模式結果" value={classifier} onChange={setClassifier} ready={ready}><option value="safe">問題なしと判定</option><option value="unsafe">問題を検知</option></Select></>:null}>{children}</AuthorityFigure>
}
export function GuardQualityResponse({children}){
 const id=useId(),[quality,setQuality]=useState('balanced'),[incident,setIncident]=useState('normal'),q=toyGuardQuality(quality),control=incidentGuard(incident)
 return <AuthorityFigure diagram="guard-quality-response" title="guardの二つの誤りと、監視から異常時の縮退へ" scene={({phase})=><AuthorityCanvas diagram="guard-quality-response" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['正当なcaseと違反caseの両方を、評価へ入れる','誤検知と見逃しは、異なる分母から計算する','回帰の軌跡assertionと、発火ログをつなぐ','操作のリスクで強度を変え、警告の雑音を減らす','異常時は承認必須・tool停止へ縮める','品質と迂回を測り直して、設定へ戻す'][stage]}</Text>
 {stage<2&&<><Text y={86}>架空の正当100件 ／ 違反100件</Text><Text x={55} y={142} small>正当</Text><rect x={105} y={118} width={470} height={37} fill="#214941"/><rect x={105} y={118} width={470*q.falsePositiveRate} height={37} fill="#f2bd67"/><Text x={55} y={201} small>違反</Text><rect x={105} y={177} width={470} height={37} fill="#493653"/><rect x={105} y={177} width={470*q.falseNegativeRate} height={37} fill="#f2bd67"/><AuthorityPair y={247} height={135} left={['誤検知',`正当 ${q.falsePositives} / 100件`,`正当caseの ${(q.falsePositiveRate*100).toFixed(0)}%`]} right={['見逃し',`違反 ${q.falseNegatives} / 100件`,`違反caseの ${(q.falseNegativeRate*100).toFixed(0)}%`]} id={id} phase={phase} arrow={false}/></>}
 {stage===2&&<AuthorityThree columns={[["回帰のcase","正当と違反を保存","model変更でも試す"],["軌跡assertion","guardが止めたか","toolの作用も確認"],["発火の監視","急変は調査の入口","事故対応へ接続"]]}/>}
 {stage===3&&<AuthorityPair left={['不可逆・大きい影響','決定的制約と承認','対象・件数・金額・宛先','強度をリスクで配置']} right={['軽いreadと平時','認可・秘密の制約は維持','ログで傾向を観測','軽い監視を無制約にしない']} id={id} phase={phase} arrow={false}/>}
 {stage===4&&<><Tokens labels={['平時','承認必須','tool停止']} selected={[['normal','approval','stop'].indexOf(incident)]} y={86}/><AuthorityPair left={['guardの運用状態',control.toolsEnabled?'制約内のtool候補':'toolを停止する',control.approvalRequired?'強い承認のゲート':'平時の制約と監視','図は実設定を変えない']} right={['kill switchと連動','異常時は権限を縮める','新しい作用を抑止','実行済みの作用は別に確認']} id={id} phase={phase} y={180}/></>}
 {stage===5&&<AuthorityThree columns={[["品質を測る","誤検知と見逃し","分母と版を記録"],["使える制御","承認疲れと雑音","影響を具体化"],["迂回を試す","全経路の強制","設定を見直す"]]}/>}
 <Text y={412} small>caseと率は模式。実製品の品質・最適設定・安全受入を示さない。</Text>
 </>}</AuthorityCanvas>} controls={({stage,ready})=>stage<2?<Select label="架空caseのguard強度" value={quality} onChange={setQuality} ready={ready}><option value="light">軽い: 誤検知2／見逃し12</option><option value="balanced">中間: 誤検知8／見逃し5</option><option value="strict">強い: 誤検知20／見逃し2</option></Select>:stage===4?<Select label="異常時のguard運用" value={incident} onChange={setIncident} ready={ready}><option value="normal">平時の制約と監視</option><option value="approval">承認を必須化</option><option value="stop">toolを停止</option></Select>:null}>{children}</AuthorityFigure>
}
