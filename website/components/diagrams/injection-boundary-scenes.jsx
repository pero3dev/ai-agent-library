'use client'
import {useId,useState} from 'react'
import {SecurityFigure,SecurityCanvas,SecurityPair,SecurityThree,Text,Box,Wire,Select,Tokens} from './security-boundaries-primitives'
import {iidDetectionRisk,defenseMechanism} from '../../lib/security-boundaries-model.mjs'
const layers={design:['設計','data・tool・送信を限定','三条件の組合せを避ける'],execution:['実行','許可tool・引数・承認','sandboxと対象の制約'],input:['入力','外部の出所を明示','分類器は誤り得る'],model:['model','指示階層と拒否を改善','完全な分離を仮定しない'],output:['出力','宛先制限と内容検査','強制と推測が同居する']}
const goals={hijack:['回答の乗っ取り','出力を意図から逸らす','実toolなしでも影響する'],leak:['dataの漏えい','読める秘密を外へ送る','dataと送信経路を制限'],rights:['権限の悪用','write・削除・実行を使う','本人・対象・操作を制限'],recon:['偵察','構成や権限を探る','秘密をpromptに置かない']}
export function InjectionInputDefense({children}){
 const id=useId(),[layer,setLayer]=useState('execution'),[goal,setGoal]=useState('leak'),mechanism=defenseMechanism(layer),r=layers[layer]
 return <SecurityFigure diagram="injection-input-defense" title="指示が入り込む経路と、防御する五つの層" scene={({phase})=><SecurityCanvas diagram="injection-input-defense" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['構造で分けるSQLと、自然言語の区切りを分ける','利用者の入力から、意図しない指示が入る','利用者が読ませた資料に、別の作者の指示が混ざる','四つの目標を、出力と外部への作用で分ける','五層の役割を、強制できる境界と検知で分ける','検知の合格を、権限や承認の代わりにしない'][stage]}</Text>
 {stage===0&&<SecurityPair left={['SQLの構造分離','構文と値を別に渡す','placeholder等の機構','構造側で分離を強制']} right={['LLMの自然言語','指示とdataを同じ文脈へ','区切り・ラベルは改善','実行権限は別に強制']} id={id} phase={phase} arrow={false}/>}
 {stage===1||stage===2?<><Box x={40} y={90} width={200} height={143} title={stage===1?'利用者の入力':'外部資料の作者'} lines={stage===1?['直接の注入の入口','dataと異なる指示']:['Web・mail・文書','画像・他Agentの出力','利用者とは別の作者']} tone="amber"/><Wire id={id} d="M240 163H318" active phase={phase}/><Box x={320} y={90} width={280} height={143} title="modelの文脈" lines={['依頼と資料をまとめて読む','資料内の指示が影響し得る','区切りだけで完全分離しない']} tone="purple"/><Text y={295}>外部資料の内容 → 回答／toolの提案</Text><Text y={339} small>実行前に、権限・引数・承認を別に照合する。</Text></>:null}
 {stage===3&&<><Tokens labels={['乗っ取り','漏えい','権限の悪用','偵察']} selected={[Object.keys(goals).indexOf(goal)]} y={86}/><SecurityPair left={goals[goal]} right={['被害の上限を設計','実行できる能力を棚卸し','読み手と作者を分ける','危険な自動操作を制限']} id={id} phase={phase} y={180} arrow={false}/></>}
 {stage===4&&<><Tokens labels={['設計','実行','入力','model','出力']} selected={[Object.keys(layers).indexOf(layer)]} y={86}/><SecurityPair left={[r[0],r[1],r[2],'この層だけでは不完全']} right={[mechanism.kind==='mixed'?'強制と検知を分ける':mechanism.kind==='fallible-detection'?'誤り得る検知の層':'実行側で強制する境界',mechanism.kind==='mixed'?'許可宛先: 実行側で制限':mechanism.kind==='fallible-detection'?'出所・分類・拒否を改善':'policy・認証・隔離を実装',mechanism.kind==='mixed'?'内容検査: 誤り得る判断':'残る穴を別の層で検証','図は防御率を測らない']} id={id} phase={phase} y={180} arrow={false}/></>}
 {stage===5&&<><Tokens labels={['tool','引数','宛先','承認','隔離']} y={86}/><SecurityPair left={['modelからの提案','検知が合格しても誤り得る','systemの依頼だけでは不足','権限を自動で増やさない']} right={['実行する側の制約','対象・引数・送り先を照合','危険な作用の前に承認','実際の構成で制約を試す']} id={id} phase={phase} y={180}/></>}
 <Text y={412} small>図は入力を実modelへ送らない。区切りと強制する制約を分ける。</Text>
 </>}</SecurityCanvas>} controls={({stage,ready})=>stage===3?<Select label="読み分ける攻撃の目標" value={goal} onChange={setGoal} ready={ready}>{Object.entries(goals).map(([v,a])=><option key={v} value={v}>{a[0]}</option>)}</Select>:stage===4?<Select label="読み分ける防御の層" value={layer} onChange={setLayer} ready={ready}>{Object.entries(layers).map(([v,a])=><option key={v} value={v}>{a[0]}</option>)}</Select>:null}>{children}</SecurityFigure>
}
export function InjectionRepeatedRisk({children}){
 const id=useId(),[trials,setTrials]=useState('100'),risk=iidDetectionRisk(Number(trials)),percent=(risk.atLeastOneMiss*100).toFixed(1)
 return <SecurityFigure diagram="injection-repeated-risk" title="繰返しの見逃しと、検知とは別に置く被害の上限" scene={({phase})=><SecurityCanvas diagram="injection-repeated-risk" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['一回99%でも、残りの1%はゼロにならない','期待件数と、一件以上の確率を読み分ける','データ・操作・宛先を、実行側で絞る','適応する現実の攻撃は、独立同確率とは限らない','拒否・検知・tool遮断を分けて記録する'][stage]}</Text>
 {stage<2&&<><Text y={90}>{`模式の ${trials} 試行: 一回の見逃し 1%`}</Text><rect x={65} y={124} width={510} height={33} rx={5} fill="#142b39"/><rect x={65} y={124} width={510*risk.atLeastOneMiss} height={33} rx={5} fill="#f2bd67"/><Text y={200}>{`一件以上の見逃し: ${percent}%`}</Text><SecurityPair y={215} left={['期待見逃し件数',`${risk.expectedMisses.toFixed(2)} 件`,'n × 0.01']} right={['一件以上の確率','1 − 0.99ⁿ','100回で必ずとは限らない']} id={id} phase={phase} arrow={false}/></>}
 {stage===2&&<SecurityThree columns={[["dataの範囲","必要な情報だけ","秘密は実行側"],["操作の能力","readとwriteを分離","危険操作へ承認"],["外へ届く経路","許可された宛先","検知とは別に制約"]]}/>}
 {stage===3&&<SecurityPair left={['算術の仮定','独立した各試行','同じ見逃し確率','架空の計算用の入力']} right={['現実の攻撃','試行は適応・相関し得る','分布・model・環境も変わる','実発生率は別に検証']} id={id} phase={phase} arrow={false}/>}
 {stage===4&&<SecurityThree columns={[["検知の結果","分類が反応したか","誤検知・見逃し"],["modelの拒否","出力を拒否したか","権限の保証ではない"],["実行の遮断","toolが止めたか","実制約の証拠"]]}/>}
 <Text y={412} small>独立・同一確率の模式値。実測の安全率・検知率・攻撃成功率でない。</Text>
 </>}</SecurityCanvas>} controls={({stage,ready})=>stage<2?<Select label="独立な模式試行の数" value={trials} onChange={setTrials} ready={ready}><option value="0">0回</option><option value="1">1回</option><option value="10">10回</option><option value="100">100回</option></Select>:null}>{children}</SecurityFigure>
}
