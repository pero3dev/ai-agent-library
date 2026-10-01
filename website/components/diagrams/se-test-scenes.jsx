'use client'
import { useState } from 'react'
import { SeFigure,SeCanvas,Text,Box,Wire,Select } from './se-process-primitives'
import { seEvidenceGate } from '../../lib/se-process-model.mjs'
export function SeTestDesignGeneration({children}){
 return <SeFigure diagram="se-test-design-generation" title="観点とケースから、仕様の期待値を保つテストへ"
  scene={s=><SeCanvas diagram="se-test-design-generation" {...s}>{f=><>
   <Text y={35}>{['テストの成果物を作る支援と、妥当性の確定を分ける','列挙した候補を、業務リスクへ照合する','期待結果が仕様から決まるか、人が確認する','期待値を保って、コードとダミーデータを作る'][f.stage]}</Text>
   {f.stage===0?<>
    {['観点・ケース','コード・データ','実施記録'].map((t,i)=><g key={t}><Box x={32} y={78+i*103} width={260} height={73} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${114+i*103}H340`} active phase={f.phase}/><Box x={348} y={78+i*103} width={260} height={73} title={['網羅性・仕様との突合','期待値・データの妥当性','合否と提出物の確認'][i]} tone="teal"/></g>)}
    <Text y={420} small>Agent自体の評価と、常設する回帰検査は別の話</Text>
   </>:f.stage===1?<>
    <Box x={77} y={70} width={486} height={98} title="仕様・機能一覧・入力条件" lines={['正常・異常・境界・非機能・状態の候補']} tone="violet"/>
    <Wire id={s.id} d="M320 168V216" active phase={f.phase}/><Box x={77} y={224} width={486} height={138} title="人が業務要件と過不足を確認" lines={['同値クラス・端点・組合せ爆発も検討','列挙したことだけで網羅性を保証しない']} tone="teal" data-candidates-guarantee-coverage="false"/>
   </>:f.stage===2?<>
    <Box x={32} y={83} width={260} height={136} title="仕様からケースを生成" lines={['前提・手順・期待結果','期待値を人が仕様へ照合']} tone="violet"/>
    <Wire id={s.id} d="M292 151H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={136} title="期待値が決まらない" lines={['曖昧な仕様を発見','もっともらしく補完しない']} tone="amber"/>
    <Wire id={s.id} d="M478 219V267H320V293" active phase={f.phase}/><Box x={77} y={301} width={486} height={86} title="上流の要件・設計へ戻して確認" tone="teal"/>
   </>:<>
    <Box x={32} y={90} width={260} height={152} title="コードとデータ" lines={['定型のテスト・setup','匿名のダミーデータ','本番データは経路に従う']} tone="violet"/>
    <Box x={348} y={90} width={260} height={152} title="独立した期待値" lines={['仕様から人が導く','実装の出力を転記しない','実行時に照合']} tone="teal"/>
    <Box x={76} y={298} width={488} height={94} title="生成・確認・修正・実行まで測る" lines={['生成量だけで、省力化の効果を判定しない']} tone="amber"/>
   </>}
  </>}</SeCanvas>}>{children}</SeFigure>
}
export function SeTestOracleEvidence({children}){
 const [oracle,setOracle]=useState('implementation'),[executed,setExecuted]=useState('no'),[green,setGreen]=useState('yes'),[scope,setScope]=useState('no')
 const verdict=seEvidenceGate({green:green==='yes',oracle,executed:executed==='yes',scopeReviewed:scope==='yes'})
 return <SeFigure diagram="se-test-oracle-evidence" title="緑の結果を、仕様の根拠と実行した記録へ照合する"
  controls={({stage,ready})=>stage===1?<Select label="テスト期待値の根拠" value={oracle} onChange={setOracle} ready={ready}><option value="implementation">実装の出力を転記</option><option value="specification">仕様から人が確定</option></Select>:stage===2?<Select label="記録の実施状態" value={executed} onChange={setExecuted} ready={ready}><option value="yes">実際に実行した記録</option><option value="no">未実行の説明だけ</option></Select>:stage===3?<><Select label="テストの結果" value={green} onChange={setGreen} ready={ready}><option value="yes">緑（合格）</option><option value="no">未合格</option></Select><Select label="テスト期待値の根拠" value={oracle} onChange={setOracle} ready={ready}><option value="implementation">実装の出力を転記</option><option value="specification">仕様から人が確定</option></Select><Select label="記録の実施状態" value={executed} onChange={setExecuted} ready={ready}><option value="yes">実行した</option><option value="no">未実行</option></Select><Select label="検証範囲の確認" value={scope} onChange={setScope} ready={ready}><option value="yes">人が妥当性を確認</option><option value="no">未確認</option></Select></>:null}
  scene={s=><SeCanvas diagram="se-test-oracle-evidence" {...s}>{f=><>
   <Text y={35}>{['実装とテストに、同じ誤解が乗り得る','実装の追認を、仕様の期待値へ置き換える','実施した記録だけを集約し、人が合否を確認','緑と根拠・実行・範囲が揃って、判断を支える'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={80} y={75} width={480} height={79} title="同じ仕様理解に誤りがある" tone="amber"/>
    <Wire id={s.id} d="M320 154V197H162V232" active phase={f.phase}/><Wire id={s.id} d="M320 197H478V232" active phase={f.phase}/>
    <Box x={32} y={240} width={260} height={111} title="実装も同じ方向に誤る" lines={['誤った出力を返す']} tone="violet"/>
    <Box x={348} y={240} width={260} height={111} title="テストも同じ方向に誤る" lines={['その出力を期待して合格']} tone="violet"/>
    <Text y={410} small>緑でも、合意した要求への適合を示せない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={87} width={260} height={141} title={oracle==='specification'?'合意した仕様':'実装の出力'} lines={oracle==='specification'?['人が期待値を確定','別の観点を追加']:['出力を期待値へ転記','実装の追認になる']} tone={oracle==='specification'?'teal':'amber'}/>
    <Wire id={s.id} d="M292 157H340" active phase={f.phase}/><Box x={348} y={87} width={260} height={141} title="テストを生成・確認" lines={['根拠を分けて渡す','人がcross-check']} tone="violet" data-oracle-independent={String(oracle==='specification')}/>
    <Box x={77} y={292} width={486} height={104} title={oracle==='specification'?'仕様との突合を支える':'仕様適合の証拠として使えない'} lines={['生成を分離するだけで、正しさを保証しない']} tone={oracle==='specification'?'teal':'amber'}/>
   </>:f.stage===2?<>
    <Box x={32} y={96} width={260} height={149} title={executed==='yes'?'実行ログ・画像':'未実行の説明'} lines={executed==='yes'?['実データを集約','提出書式を整える']:['もっともらしくても未実施','実行結果を捏造しない']} tone={executed==='yes'?'violet':'amber'}/>
    <Wire id={s.id} d="M292 170H340" active={executed==='yes'} phase={f.phase}/><Box x={348} y={96} width={260} height={149} title={executed==='yes'?'人が合否・最終確認':'実施記録に昇格できない'} lines={['整形と、判断を分ける','実施した根拠へ照合']} tone={executed==='yes'?'teal':'amber'} data-evidence-executed={String(executed==='yes')} data-can-fabricate="false"/>
    <Text y={340} small>曖昧に「作って」と頼まず、実行結果の集約に限定</Text>
   </>:<>
    {['合格の結果','仕様の期待値','実行した記録','確認した範囲'].map((t,i)=><Box key={t} x={32+i%2*316} y={74+Math.floor(i/2)*96} width={260} height={69} title={t} tone={[green==='yes',oracle==='specification',executed==='yes',scope==='yes'][i]?'teal':'amber'}/>)}
    <Box x={73} y={292} width={494} height={107} title={verdict.supportsReviewedScope?'確認した範囲の判断を支える':'適合を示す根拠が揃っていない'} lines={['妥当性の確認担当を置き、効果は測る','合格だけで欠陥ゼロを保証しない']} tone={verdict.supportsReviewedScope?'teal':'amber'} data-supports-scope={String(verdict.supportsReviewedScope)} data-no-defects-guaranteed="false"/>
   </>}
  </>}</SeCanvas>}>{children}</SeFigure>
}
