'use client'
import {useId,useState} from 'react'
import {LifecycleCanvas,LifecycleFigure,LifecyclePair,LifecycleThree,Text,Box,Wire,Select,Tokens} from './deployment-lifecycle-primitives'
import {trainingJoin} from '../../lib/deployment-lifecycle-model.mjs'
const differences={asset:[['自作の予測model','重みと学習データ','特徴量と配信構成'],['借りる生成アプリ','prompt・RAG・Agent','提供modelとの組合せ']],experiment:[['学習と実験の記録','データとhyperparameter','model版と実行条件'],['アプリの比較記録','promptと検索・toolの版','全組合せと評価条件']],evaluation:[['予測と利用の評価','精度以外も必要','安全・公平性・費用'],['生成と作用の評価','自由文とtrajectory','多次元と反復を点検']],change:[['学習を含む変更','data・feature・training','配信と回帰を接続'],['学習なしの変更も','prompt・検索・tool','組合せごとに回帰']],monitor:[['共通する監視','データ・品質・運用','費用とリスクも見る'],['足す観測の差分','token費用・trace','生成品質と安全性']]}
export function MlopsCommonDifferences({children}){
 const id=useId(),[axis,setAxis]=useState('asset')
 return <LifecycleFigure diagram="mlops-common-differences" title="共通する運用の循環と、生成アプリに足す差分" scene={({phase})=><LifecycleCanvas diagram="mlops-common-differences" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['記録・比較・展開・監視を、共通の基盤へ置く','代表例の比較を、ML全体の断定にしない','資産から監視まで、五つの軸を一つずつ読む','学習なしの変更も、アプリの挙動を変える','既存基盤を、部品ごとに適合確認して使う','LLM固有の資産と計測を、共通の循環へ足す'][stage]}</Text>
 {stage===0&&<><Tokens labels={['変更記録','比較','展開','監視']} selected={[Math.min(3,Math.floor(phase))]} y={90}/><LifecyclePair left={['共通の循環','実験とdataの系譜','CI/CDとmetrics','認証と監査の基盤']} right={['差分を接続する','prompt・検索・tool','生成と外部作用の評価','個別の正本と分担']} id={id} phase={phase} y={182}/></>}
 {stage===1&&<LifecyclePair left={['従来のMLにもある','非決定性と不確実性','安全・公平性・費用','単一指標とは限らない']} right={['代表例として比べる','自作予測と借りる生成','組織と利用条件で変わる','頻度を一律に断定しない']} id={id} phase={phase} arrow={false}/>}
 {stage===2&&<><Tokens labels={['資産','実験','評価','変更','監視']} selected={[Object.keys(differences).indexOf(axis)]} y={88}/><LifecyclePair left={differences[axis][0]} right={differences[axis][1]} id={id} phase={phase} y={181} arrow={false}/></>}
 {stage===3&&<><LifecycleThree columns={[["promptの変更","学習なしでも","出力が変わる"],["検索の変更","知識と権限","結果が変わる"],["toolの変更","契約と副作用","作用が変わる"]]}/><Text y={345}>modelだけの版では、アプリの挙動は固定されない</Text></>}
 {stage===4&&<LifecyclePair left={['再利用する骨格','実験・指標・data経路','CI/CD・認証・監査','成熟した仕組みを点検']} right={['部品ごとの適合','feature storeの一部','検索・promptとの接点','全基盤の作り直しを避ける']} id={id} phase={phase}/>}
 {stage===5&&<><Tokens labels={['prompt版','確率的評価','token費用','trace']} y={90}/><Box x={65} y={184} width={510} height={174} title="共通基盤へ差分を接続" lines={['judgeも校正と失敗ケースを点検','モデル・prompt・検索・toolの組合せを記録','実評価・実計測から変更へ戻る']} tone="teal"/></>}
 <Text y={412} small>版の名前だけで挙動を固定しない。図は実評価・費用を測定しない。</Text>
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===2?<Select label="比較する運用の差分" value={axis} onChange={setAxis} ready={ready}>{Object.entries({asset:'資産',experiment:'実験',evaluation:'評価',change:'変更経路',monitor:'監視'}).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</LifecycleFigure>
}
export function MlopsRolesTrainingJoin({children}){
 const id=useId(),[tool,setTool]=useState('extension'),[missing,setMissing]=useState('data'),join=trainingJoin({trainingPlanned:missing!=='borrowed',dataOwner:missing!=='data',jobOwner:missing!=='job',modelVersion:missing!=='version',appEvaluation:missing!=='evaluation'})
 return <LifecycleFigure diagram="mlops-roles-training-join" title="三つの責任と、道具の選択・学習を始める接点" scene={({phase})=><LifecycleCanvas diagram="mlops-roles-training-join" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['modelを作る責任と、アプリ品質・共通基盤を分ける','版と評価・監視で、三つの責任をつなぐ','基盤の成熟度と重複運用から、二類型を比べる','FTを始めるとき、data・job・model版で合流する','役割の空白と評価の分断を、共通循環へ戻す'][stage]}</Text>
 {stage===0||stage===1?<><LifecycleThree columns={[["ML側","自作model・FT","学習とdata"],["アプリ側","prompt・RAG","Agentの品質"],["platform側","共通gateway","CIと監視"]]}/>{stage===1&&<><Wire id={id} d="M120 269V302H520V269" active phase={phase}/><path d="M320 269V302" stroke="#66dac8" strokeWidth={2} fill="none"/><Text y={355}>版・評価・監視の成果物と、変更する責任を接続</Text></>}</>:null}
 {stage===2&&<><Tokens labels={['特化型','既存の拡張']} selected={[tool==='specialized'?0:1]} y={90}/><LifecyclePair left={tool==='specialized'?['LLM特化の道具','prompt・trace・評価を導入','短く始める構成を検討','既存との二重運用も点検']:['既存MLOpsを拡張','実験と監視の骨格を使う','成熟した基盤へ差分を足す','各部品の適合を点検']} right={['比較する組織条件','既存基盤の成熟度','規模と分業の範囲','製品名だけで採用しない']} id={id} phase={phase} y={182} arrow={false}/></>}
 {stage===3&&<LifecyclePair left={['FTを始める接点','学習データの責任','学習jobとmodel版','アプリ品質の評価']} right={[join.next==='borrowed-app-path'?'借りるアプリの経路':join.next==='training-integration-review'?'学習連携の検討候補':'不足する責任を決める','既存MLの知識へつなぐ','借りるだけならFTは任意','図は学習を実行しない']} id={id} phase={phase}/>}
 {stage===4&&<LifecycleThree columns={[["基盤の全新設","部品別に再利用","差分を足す"],["評価の分断","共有する結果","変更を比較"],["責任の空白","借りる／作る","先に境界を決める"]]}/>}
 <Text y={412} small>模式条件の照合は実採用・学習実行・品質の保証ではない。</Text>
 </>}</LifecycleCanvas>} controls={({stage,ready})=>stage===2?<Select label="比較するtoolの類型" value={tool} onChange={setTool} ready={ready}><option value="specialized">LLM特化型</option><option value="extension">既存MLOpsの拡張</option></Select>:stage===3?<Select label="学習連携で不足する条件" value={missing} onChange={setMissing} ready={ready}>{Object.entries({data:'学習データの責任が未設定',job:'学習jobの責任が未設定',version:'model版が未確認',evaluation:'アプリ評価が未確認',none:'四条件を照合',borrowed:'学習を計画していない'}).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</LifecycleFigure>
}
