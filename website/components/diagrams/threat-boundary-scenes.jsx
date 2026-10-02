'use client'
import {useId,useState} from 'react'
import {SecurityFigure,SecurityCanvas,SecurityPair,SecurityThree,Text,Box,Wire,Select,Tokens} from './security-boundaries-primitives'
import {trifectaPath} from '../../lib/security-boundaries-model.mjs'
const threats=[['直接の注入','利用者入力','意図と異なる操作'],['間接の注入','Web・tool結果','資料の作者は別'],['dataの漏えい','私有dataから外へ','送信経路を制限'],['過剰な権限','全権の代理','本人と範囲を照合'],['供給網','model・tool更新','出所と差分を点検'],['記憶の汚染','RAG・長期記憶','書き込み主体を確認'],['経済的DoS','loopとtoken','時間・資源の上限'],['秘密の抽出','system prompt','秘密を埋め込まない']]
export function ThreatBoundaryCycle({children}){
 const id=useId(),[threat,setThreat]=useState('0'),row=threats[Number(threat)]
 return <SecurityFigure diagram="threat-boundary-cycle" title="入力・model・toolを往復する信頼境界" scene={({phase})=><SecurityCanvas diagram="threat-boundary-cycle" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['三つの前提から、被害の上限を設計する','外からの入力と、外へ届く作用を区別する','tool結果の内容も、次の入力に戻ってくる','八つの脅威を、どこを越えるかで読む','選んだ脅威の入口と、利用できる能力を結ぶ','modelの判断と、実行側の制約を分ける'][stage]}</Text>
 {stage===0&&<SecurityThree columns={[["指示になる入力","text・画像・結果","出所を確認"],["誤り得るmodel","拒否も完全でない","検知は追加の層"],["被害の上限","渡した権限","実行側で強制"]]}/>}
 {stage===1||stage===2?<><Box x={35} y={88} width={175} height={122} title="利用者と外部資料" lines={['資料の作者は別','内容は未信頼']} tone="amber"/><Box x={270} y={88} width={150} height={122} title="model" lines={['指示とdata','読んで操作提案']} tone="purple"/><Box x={465} y={88} width={145} height={122} title="tool" lines={['認証と引数','実行側の制約']}/><Wire id={id} d="M210 149H268" active phase={phase}/><Wire id={id} d="M420 149H463" active phase={phase}/><Box x={380} y={286} width={230} height={90} title="外部世界" lines={['変更・送信・課金の作用']}/><Wire id={id} d="M538 210V284" active phase={phase}/><Wire id={id} d="M467 196L449 196V249H342V211" active={stage===2} phase={phase}/><Text x={184} y={280} small>tool結果 → 再び入力</Text><Text x={190} y={332} small>内容への信頼は認証と別</Text></>:null}
 {stage===3&&<>{threats.map((r,i)=><g key={r[0]}><rect x={40+(i%2)*290} y={80+Math.floor(i/2)*72} width={270} height={60} rx={6} fill="#142b39" stroke={Number(threat)===i?'#68ded0':'#526b7c'}/><Text x={175+(i%2)*290} y={107} small>{r[0]}</Text><Text x={175+(i%2)*290} y={129} small>{r[1]}</Text></g>)}</>}
 {stage===4&&<SecurityPair left={[row[0],row[1],row[2],'権限とデータを棚卸し']} right={['対処する境界','対象と送信先を絞る','更新・memory・資源も点検','発生率は別に検証']} id={id} phase={phase}/>}
 {stage===5&&<SecurityPair left={['誤り得る判断','modelへ注意を依頼','入力・出力の検知','拒否率を観測する']} right={['実行側の強制','認証・対象・宛先','sandbox・資源の上限','失敗時にも権限を増やさない']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>toolの結果は入力へ戻る。図は攻撃や実制約の検査を行わない。</Text>
 </>}</SecurityCanvas>} controls={({stage,ready})=>stage===3||stage===4?<Select label="経路を読む脅威" value={threat} onChange={setThreat} ready={ready}>{threats.map((r,i)=><option key={i} value={i}>{r[0]}</option>)}</Select>:null}>{children}</SecurityFigure>
}
export function ThreatTrifectaWorkflow({children}){
 const id=useId(),[removed,setRemoved]=useState('none'),result=trifectaPath({privateData:removed!=='data',untrustedContent:removed!=='input',externalSend:removed!=='send'})
 return <SecurityFigure diagram="threat-trifecta-workflow" title="三条件の漏えい経路と、強制できる制御の選択" scene={({phase})=><SecurityCanvas diagram="threat-trifecta-workflow" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['三つの能力が、同じ経路に揃うかを点検する','一条件を閉じると、この特定経路を閉じられる','modelの拒否とは別に、権限を制限する','棚卸しで、誰がどこへ触れられるかを示す','被害の大きさと可逆性から、優先する境界を選ぶ','制御不足の高リスク機能は、機能と権限を縮める'][stage]}</Text>
 {stage<2&&<><Wire id={id} d="M200 127L437 127L320 306Z" active={result.specificPathOpen} phase={phase}/>{[['私有data','読めるデータ',removed!=='data',65,73],['未信頼内容','外部の作者',removed!=='input',370,73],['外部通信','送信する能力',removed!=='send',215,269]].map(([title,line,on,x,y])=><Box key={title} x={x} y={y} width={205} height={100} title={title} lines={[line,on?'能力あり':'強制的に閉じる']} tone={on?'amber':'teal'}/>)}<Text y={232}>{result.specificPathOpen?'三条件が揃う経路の候補':'この三条件の経路は閉じる'}</Text></>}
 {stage===2&&<SecurityPair left={['modelの拒否','依頼や防御を改善','完全な拒否を仮定しない','検知は追加して観測']} right={['渡す権限の上限','必要なdataだけを読む','送信先を実行側で制限','この制約を実構成で試す']} id={id} phase={phase} arrow={false}/>}
 {stage===3&&<SecurityThree columns={[["主体と能力","利用者・service","toolと権限"],["dataと作者","読む／書く主体","外部資料と記憶"],["境界の地図","入力と作用","三条件を照合"]]}/>}
 {stage===4&&<><Tokens labels={['影響','可逆性','件数','起こりやすさ']} y={87}/><SecurityPair left={['被害を具体化','一件と大量を分ける','外部への送信は戻せるか','金額・公開・削除を確認']} right={['制御の優先順位','強制できる境界を先に置く','検知は誤りを含めて評価','高リスクの未制御を残さない']} id={id} phase={phase} y={181} arrow={false}/></>}
 {stage===5&&<SecurityPair left={['強制できる制御あり','必要な権限に限定','承認・宛先・隔離','残るリスクを検証']} right={['制御不足の機能','機能・権限を縮める','自動操作を保留','modelの説得で穴を埋めない']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>一条件の除去はこの経路の説明。全脅威への安全保証ではない。</Text>
 </>}</SecurityCanvas>} controls={({stage,ready})=>stage<2?<Select label="三重奏で閉じる条件" value={removed} onChange={setRemoved} ready={ready}><option value="none">三条件が揃う</option><option value="data">私有dataへのアクセスを閉じる</option><option value="input">未信頼内容の入力を閉じる</option><option value="send">外部送信を閉じる</option></Select>:null}>{children}</SecurityFigure>
}
