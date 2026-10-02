'use client'
import {useId,useState} from 'react'
import {DataCanvas,DataFigure,DataPair,DataThree,Text,Box,Wire,Select,Tokens} from './data-resilience-primitives'
import {conversationPurpose,conversationAccess,deletionCoverage} from '../../lib/data-resilience-model.mjs'
const purposeKeys={trace:'同じtraceの関連',notice:'目的と範囲の説明',minimum:'必要な記録への最小化',retention:'保持期間',access:'アクセス統制',training:'別の学習利用条件',none:'必要条件を照合'}
export function ConversationCollectionLayers({children}){
 const id=useId(),[purpose,setPurpose]=useState('training'),[missing,setMissing]=useState('training')
 const result=conversationPurpose({purpose,traceLinked:missing!=='trace',notified:missing!=='notice',minimized:missing!=='minimum',retentionSet:missing!=='retention',accessControlled:missing!=='access',trainingCondition:missing!=='training'})
 return <DataFigure diagram="conversation-collection-layers" title="会話の全段に置く統制と、加工後にも残る機微" scene={({phase})=><DataCanvas diagram="conversation-collection-layers" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['価値と機微を、同じライフサイクルで読む','同じIDが、応答と改善の資料を結ぶ','運用の目的を、学習の許諾へ広げない','機微は入力とtoolの結果の両方に現れる','処理名と、用途・識別の条件を分ける','加工・派生したデータも、原本の統制から始める'][stage]}</Text>
 {stage===0&&<><Tokens labels={['収集','保持','分析','改善','削除']} stage={2} y={90}/><DataPair left={['改善の一次資料','実利用の失敗と修正','評価・分析へ戻す','価値だけで開放しない']} right={['機微を含む会話','固有名や業務文脈','契約・信頼を守る','全段へ統制を置く']} id={id} phase={phase} y={184} arrow={false}/></>}
 {stage===1&&<><Tokens labels={['発話','検索','tool','応答','反応']} stage={2} y={90}/><Box x={60} y={190} width={520} height={164} title="同じtrace_idで関連付ける" lines={['原因を追う入口として結ぶ','会話全文の保存義務とは違う','必要な範囲と期間を別に定める']} tone="teal"/></>}
 {stage===2&&<DataPair left={[purpose==='training'?'学習への利用':'運用への利用','目的と記録範囲を説明','内容・件数・期間を絞る',purpose==='training'?'別の同意・契約を点検':'学習の条件へ広げない']} right={[result.reviewCandidate?'収集設計の検討候補':'不足する条件へ戻る','trace・保持・アクセス','規制の正本も点検','図は収集を行わない']} id={id} phase={phase}/>}
 {stage===3&&<DataPair left={['発話と文脈','自由文の機微','場所は予測できない','既知パターンを検出']} right={['検索・toolの結果','入力後にも機微が現れる','記録前に処理を置く','完全な除去とは違う']} id={id} phase={phase} arrow={false}/>}
 {stage===4&&<DataThree columns={[["入口のマスク","既知の機微","完全除去は別"],["仮名化","可逆の仮ID","対応表は分離"],["用途別の層","生・加工・匿名","再識別も点検"]]}/>}
 {stage===5&&<><DataThree columns={[["元の会話","固有名と文脈","原本の統制"],["派生した資料","要約・評価","同じ統制から"],["派生した保存","埋込・cache","利用条件を点検"]]}/><Text x={320} y={348} center>加工済みという名前で、統制を外さない</Text></>}
 <Text x={320} y={409} center small>図は収集・加工・同意取得や、法的適合の判定を行わない。</Text>
 </>}</DataCanvas>} controls={({stage,ready})=>stage===2?<><Select label="模式の収集目的" value={purpose} onChange={setPurpose} ready={ready}><option value="operation">運用と改善の分析</option><option value="training">モデルの学習利用</option></Select><Select label="収集設計で不足する条件" value={missing} onChange={setMissing} ready={ready}>{Object.entries(purposeKeys).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></>:null}>{children}</DataFigure>
}
const deletionKeys={raw:'生ログ',pseudonym:'仮名化',embedding:'埋め込み',cache:'cache',evaluation:'評価ケース',memory:'長期記憶'}
export function ConversationRetentionDeletion({children}){
 const id=useId(),[missing,setMissing]=useState('embedding'),[trigger,setTrigger]=useState('request')
 const result=deletionCoverage(Object.fromEntries(Object.keys(deletionKeys).map(key=>[key,missing!==key])))
 return <DataFigure diagram="conversation-retention-deletion" title="用途別の保持期間と、保存先を横断する削除" scene={({phase})=><DataCanvas diagram="conversation-retention-deletion" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['保持期間は用途と条件から定める','四つの保存層を、同じ期間にまとめない','満了と個別要求は、別の削除経路を持つ','原本だけでなく、派生先の残存を照合する','匿名化の名前だけで評価へ入れない'][stage]}</Text>
 {stage===0&&<DataPair left={['利用の目的','調査・品質分析','評価・傾向の計測','必要な範囲を選ぶ']} right={['保持の設計','用途ごとの期間','満了と削除を運用へ','原文の期間は設計例']} id={id} phase={phase}/>}
 {stage===1&&<><DataPair left={['生ログ／分析用','生は短期・厳格な権限','分析は加工と目的','同じ条件とは扱わない']} right={['評価用／集計','評価は匿名化を点検','集計にも個人が残るか','残れば統制を保つ']} id={id} phase={phase} arrow={false}/><Text x={320} y={348} center>期間の長さだけで、利用の許可を決めない</Text></>}
 {stage===2&&<DataPair left={[trigger==='request'?'利用者・tenant要求':'保持期限の満了',trigger==='request'?'IDから保存先へ遡る':'層ごとの期限を照合','原本と派生物を含む','必要な運用を用意']} right={['保存先を横断','所在と系譜を保持','残存を照合する','図は実削除を行わない']} id={id} phase={phase}/>}
 {stage===3&&<><Tokens labels={['生ログ','仮名','埋込','cache','評価','記憶']} stage={missing==='none'?5:Object.keys(deletionKeys).indexOf(missing)} y={90}/><Box x={60} y={190} width={520} height={166} title={result.designChecked?'全保存先の設計を照合':'未点検の保存先が残る'} lines={[result.designChecked?'六保存先の点検条件が揃う':`未点検: ${deletionKeys[missing]}`,'ID・所在・系譜から追う','模式条件は実削除の証拠ではない']} tone={result.designChecked?'teal':'amber'}/></>}
 {stage===4&&<DataPair left={['評価へ入れる前','個人から切り離せたか','再識別のリスク','利用条件と契約を点検']} right={['削除後の評価保守','抜けるケースを把握','回帰の条件を整える','全文保存の義務にしない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>原本だけの削除を完了にせず、系譜を全文保存の義務にしない。</Text>
 </>}</DataCanvas>} controls={({stage,ready})=>stage===2?<Select label="削除を始める模式条件" value={trigger} onChange={setTrigger} ready={ready}><option value="request">利用者・テナントの要求</option><option value="expiry">保持期間の満了</option></Select>:stage===3?<Select label="削除設計で未点検の保存先" value={missing} onChange={setMissing} ready={ready}>{Object.entries({...deletionKeys,none:'全保存先の点検条件を照合'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>:null}>{children}</DataFigure>
}
export function ConversationUseAccess({children}){
 const id=useId(),[form,setForm]=useState('raw'),[destination,setDestination]=useState('external'),[missing,setMissing]=useState('exception')
 const result=conversationAccess({raw:form==='raw',external:destination==='external',purposeKnown:missing!=='purpose',roleAllowed:missing!=='role',auditRecorded:missing!=='audit',rawExceptionApproved:missing!=='exception',destinationChecked:missing!=='destination'})
 return <DataFigure diagram="conversation-use-access" title="管理環境内の分析と、目的・役割・送信先の条件" scene={({phase})=><DataCanvas diagram="conversation-use-access" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['改善の循環を支えるデータ要件を読む','属性・ラベル・分析を管理の内側へ置く','全会話への開放を既定にしない','マスク済みでも、目的・役割・監査が残る','外部SaaSは送信先の条件を追加する'][stage]}</Text>
 {stage===0&&<DataPair left={['会話データの要件','記録・分類・追跡','同じtraceへ戻る','統制を持って分析']} right={['改善運用の正本','フィードバック循環','評価ケースと検査','記録だけでは完了しない']} id={id} phase={phase}/>}
 {stage===1&&<DataThree columns={[["属性で検索","構成版・失敗","反応で絞る"],["ラベルを保存","一度の分類","後続分析へ"],["管理内で分析","コピーを抑制","毎回持出さない"]]}/>}
 {stage===2&&<DataPair left={['全会話の開放','機微な業務情報','漏えいなしでも問題','目的と信頼を点検']} right={['既定の統制','マスク済みへ限定','roleと目的を照合','閲覧の監査を残す']} id={id} phase={phase} arrow={false}/>}
 {(stage===3||stage===4)&&<DataPair left={[form==='raw'?'生ログの例外':'マスク済みを既定',form==='raw'?'生の閲覧は例外承認':'加工だけで開放しない','目的・役割・閲覧監査',destination==='external'?'送信先の条件も点検':'管理環境内で分析']} right={[result.reviewCandidate?'利用設計の検討候補':'不足する条件へ戻る',destination==='external'?'送信・保持・学習の契約':'外部へ送信しない','権利・契約は別に点検','図はアクセスを許可しない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>模式の条件照合は、実閲覧・外部送信・法的適合の証拠ではない。</Text>
 </>}</DataCanvas>} controls={({stage,ready})=>stage===3||stage===4?<><Select label="閲覧する模式の加工状態" value={form} onChange={setForm} ready={ready}><option value="masked">マスク済み</option><option value="raw">生ログ</option></Select><Select label="模式の分析先" value={destination} onChange={setDestination} ready={ready}><option value="internal">管理環境内</option><option value="external">外部SaaS</option></Select><Select label="利用設計で不足する条件" value={missing} onChange={setMissing} ready={ready}>{Object.entries({purpose:'利用目的',role:'役割の範囲',audit:'閲覧監査',exception:'生ログの例外承認',destination:'外部送信先の条件',none:'必要条件を照合'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></>:null}>{children}</DataFigure>
}
