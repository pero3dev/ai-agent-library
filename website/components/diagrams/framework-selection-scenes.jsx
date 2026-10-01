'use client'
import {useState} from 'react'
import {SelectionFigure,SelectionCanvas,Text,Box,Wire,Select,Tokens} from './framework-model-tuning-primitives'
import {frameworkMigration} from '../../lib/framework-model-tuning-model.mjs'
export function FrameworkAbstractionSelection({children}){
 const [level,setLevel]=useState('orchestration'),[axis,setAxis]=useState('state'),[complex,setComplex]=useState('simple')
 const levels={sdk:['薄いSDK','呼出しと型の補助','制御は自分で設計'],orchestration:['状態と経路の編成','状態・再開・介入','制御の抽象を点検'],full:['フルスタック','UI・運用まで含む','既存基盤と重複確認']}
 const axes={observe:['可観測性','trace・ログの粒度','失敗をたどれるか'],state:['状態・再開','checkpointと復旧','中断位置を戻せるか'],human:['人の介入','承認・停止・編集','介入後の再開を点検'],tools:['ツール連携','入力・結果の契約','既存の接続を試す'],multi:['複数Agent','必要な場合だけ評価','協調の負担も見る'],lock:['依存と交換','vendor・framework','移行境界を点検'],maintain:['維持の負担','版・更新・コミュニティ','保守の経路を確認'],evaluate:['評価の統合','テストとの接続','回帰を検出できるか']}
 return <SelectionFigure diagram="framework-abstraction-selection" title="必要な抽象度と、採用を決める条件"
 controls={({stage,ready})=>stage===1?<Select label="フレームワークの抽象度" value={level} onChange={setLevel} ready={ready}>{Object.entries(levels).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===2?<Select label="先に確かめる選定軸" value={axis} onChange={setAxis} ready={ready}>{Object.entries(axes).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===3?<Select label="必要な制御の複雑さ" value={complex} onChange={setComplex} ready={ready}><option value="simple">単純なループ・厳しい監査</option><option value="complex">状態・再開・介入が複雑</option></Select>:null}
 scene={s=><SelectionCanvas diagram="framework-abstraction-selection" {...s}>{f=><>
  <Text y={35}>{['小さく作り、モデル・ツール・状態の関係を知る','便利さと、隠れる制御・交換の負担を比べる','必要な軸を選び、代表タスクで確かめる','自作で持つ責任と、基盤へ任せる範囲を比べる','機能の有無から、実際の制御と観測へ進む'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={82} width={260} height={150} title="生APIの小さな実装" lines={['モデル呼出し・ツール','状態と停止を明示','基本構造を把握']} tone="violet"/>
   <Wire id={s.id} d="M292 156H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={150} title="必要な補助を選ぶ" lines={['重い部分を見つける','隠れる挙動も確認','機能数で順位を作らず']} tone="teal"/>
   <Text y={350} small>実APIを呼ばず、採用前に見る構造を示す</Text>
  </>:f.stage===1?<>
   <Tokens labels={['薄いSDK','経路の編成','全体の基盤']} y={81} selected={[Object.keys(levels).indexOf(level)]}/>
   <Box x={32} y={178} width={260} height={150} title={levels[level][0]} lines={levels[level].slice(1)} tone="violet"/>
   <Box x={348} y={178} width={260} height={150} title="同じ代表タスク" lines={['便利さと隠れる挙動','交換と接続の負担','多機能だけで選ばず']} tone="teal"/>
  </>:f.stage===2?<>
   <Box x={32} y={80} width={260} height={171} title={axes[axis][0]} lines={axes[axis].slice(1)} tone="violet"/>
   <Box x={348} y={80} width={260} height={171} title="条件と対応させる" lines={['全軸を必須にしない','複数Agentは必要時','未確認を保持する']} tone="teal"/>
   <Tokens labels={['観測','状態','人','接続']} y={285} selected={[[ 'observe','state','human','tools'].indexOf(axis)].filter(i=>i>=0)}/>
   <Tokens labels={['協調','依存','維持','評価']} y={345} selected={[[ 'multi','lock','maintain','evaluate'].indexOf(axis)].filter(i=>i>=0)}/>
  </>:f.stage===3?<>
   <Box x={32} y={82} width={260} height={175} title={complex==='simple'?'なしも選択肢':'自作の再現費用'} lines={complex==='simple'?['単純なループ','監査で挙動を把握','チームが理解できる']:['状態・checkpoint','人の介入と再開','必要な機能を自作']} tone="violet"/>
   <Box x={348} y={82} width={260} height={175} title="採用と維持を比較" lines={['抽象が隠す制御','接続・運用の負担','自作を常に安価にせず']} tone="teal"/>
   <Text y={361} small>必要な制御と、誰が維持するかを合わせて選ぶ</Text>
  </>:<>
   {['代表タスクで経路を実行・観測','失敗時の再開と人の介入を点検','満たす条件と残る負担を評価'].map((title,i)=><g key={title}><Box x={55} y={76+i*103} width={530} height={72} title={title} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${148+i*103}V${174+i*103}`} active phase={f.phase}/>}</g>)}
   <Text y={413} small>図は実行結果・採用順位を生成しない</Text>
  </>}
 </>}</SelectionCanvas>}>{children}</SelectionFigure>
}
export function FrameworkBoundaryMigration({children}){
 const [missing,setMissing]=useState('version'),[scope,setScope]=useState('core')
 const flags={toolsIndependent:missing!=='tools',promptsIndependent:missing!=='prompts',evaluationIndependent:missing!=='evaluation',versionRecorded:missing!=='version'},state=frameworkMigration(flags)
 return <SelectionFigure diagram="framework-boundary-migration" title="移行できる境界と、提供段階の確認"
 controls={({stage,ready})=>stage===1?<Select label="移行検査で不足する条件" value={missing} onChange={setMissing} ready={ready}><option value="tools">ツールの独立</option><option value="prompts">プロンプトの独立</option><option value="evaluation">評価の独立</option><option value="version">版の記録</option><option value="none">4条件を確認済み</option></Select>:stage===2?<Select label="MAFで確認する範囲" value={scope} onChange={setScope} ready={ready}><option value="core">1.0の安定した中核</option><option value="preview">個別のpreview機能</option><option value="autogen">AutoGenの保守状態</option></Select>:null}
 scene={s=><SelectionCanvas diagram="framework-boundary-migration" {...s}>{f=><>
  <Text y={35}>{['業務資産を、フレームワークの接着層から分ける','交換できる境界を、同じ評価で検査する','製品の版と、個別機能の提供段階を分ける','変更を一次情報と代表タスクへ戻す'][f.stage]}</Text>
  {f.stage===0?<>
   <Tokens labels={['ツール','プロンプト','評価']} y={80} selected={[0,1,2]}/>
   <Wire id={s.id} d="M127 127V173H320V190 M320 127V190 M513 127V173H320V190" active phase={f.phase}/>
   <Box x={96} y={190} width={448} height={100} title="交換する接着層" lines={['フレームワークの配線と状態制御']} tone="violet"/>
   <Text y={357} small>資産の分離だけで、無変更・無費用の移行を保証せず</Text>
  </>:f.stage===1?<>
   <Tokens labels={['ツール独立','指示独立','評価独立','版の記録']} y={83} selected={Object.values(flags).flatMap((v,i)=>v?[i]:[])}/>
   <Box x={85} y={185} width={470} height={148} title={state.verificationCandidate?'移行を検証する候補':'不足した境界を確認'} lines={['他の条件は満たした想定','同じ評価・観測で点検','図は移行を実行しない']} tone={state.verificationCandidate?'teal':'amber'} data-migration-candidate={String(state.verificationCandidate)} data-migration-executed="false"/>
  </>:f.stage===2?<>
   <Box x={32} y={83} width={260} height={175} title={{core:'1.0の中核',preview:'個別preview',autogen:'AutoGen保守'}[scope]} lines={scope==='core'?['.NETとPython','状態・経路・介入','安定APIの対象範囲']:scope==='preview'?['DevUI・Skillsなど','個別機能の段階','中核の安定とは別']:['保守する既存基盤','MAFの採用とは別','移行の条件を評価']} tone="violet"/>
   <Box x={348} y={83} width={260} height={175} title="範囲を照合する" lines={['採用する版と機能','安定・previewを区分','全機能へ一般化せず']} tone="teal"/>
   <Text y={359} small>原文の統合後の提供段階を読む例</Text>
  </>:<>
   <Box x={32} y={83} width={260} height={157} title="一次情報で変更確認" lines={['版・提供段階','接続先と保守経路','TODOを再確認']} tone="violet"/>
   <Wire id={s.id} d="M292 161H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={157} title="代表タスクへ戻す" lines={['同じ評価・観測','状態・再開・介入','未知を確認済みにせず']} tone="teal"/>
   <Text y={355} small>採用時の一度の確認で終わらせない</Text>
  </>}
 </>}</SelectionCanvas>}>{children}</SelectionFigure>
}
