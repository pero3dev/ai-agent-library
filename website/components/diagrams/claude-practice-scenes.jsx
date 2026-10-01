'use client'
import { useState } from 'react'
import { PracticeFigure,PracticeCanvas,Text,Box,Wire,Select } from './coding-practice-primitives'
import { claudeCacheChange } from '../../lib/coding-practice-model.mjs'
export function ClaudePracticeMechanisms({children}){
 const [mechanism,setMechanism]=useState('skill'),choices={skill:['繰り返す手順','必要なときにskillを読む','名前・descriptionで起動を選ぶ'],agent:['ノイズの多い副次作業','別Agentへ専門作業を分ける','別の文脈・モデル・消費を管理'],hook:['必ず行う決定論的処理','hookにscriptを置く','イベントと実発火を確認'],plugin:['複数projectへ配布','まず試作、共有時にplugin化','配布と各環境の適用を確認']},choice=choices[mechanism]
 return <PracticeFigure diagram="claude-practice-mechanisms" title="使いどきから、手順・委任・処理・配布を選ぶ"
  controls={({stage,ready})=>stage===0?<Select label="繰り返している作業" value={mechanism} onChange={setMechanism} ready={ready}>{Object.entries(choices).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:null}
  scene={s=><PracticeCanvas diagram="claude-practice-mechanisms" {...s}>{f=><>
   <Text y={35}>{['問題の型へ、適した機構を合わせる','同じ文脈の分岐と、専門委任は別','人の規約・Agentの学習・共有配布を分ける','計画と試行、復元できる範囲を確認','起動を選ぶ情報と、起動後の文脈は別'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={83} width={506} height={99} title={choice[0]} tone="violet"/>
    <Wire id={s.id} d="M320 182V229" active phase={f.phase}/><Box x={67} y={237} width={506} height={145} title={choice[1]} lines={[choice[2],'配置と、実際に読んだ・起動した結果を分ける']} tone="teal" data-practice-mechanism={mechanism}/>
   </>:f.stage===1?<>
    <Box x={32} y={82} width={260} height={170} title="fork" lines={['同じ文脈を引き継ぐ','親のcacheを再利用し得る','文脈と目的を合わせる']} tone="teal"/>
    <Box x={348} y={82} width={260} height={170} title="subagent" lines={['専門作業を別の文脈へ','モデルと消費を管理','ノイズを主会話へ広げない']} tone="violet"/>
    <Text y={355} small>worktreeはGitの作業分離。OSの隔離とは別</Text>
   </>:f.stage===2?<>
    {['CLAUDE：人の規約','memory：Agentの学習','plugin：共有する配布'].map((t,i)=><Box key={t} x={67} y={79+i*104} width={506} height={77} title={t} tone={i===1?'amber':'violet'}/>)}
    <Text y={418} small>提案・記憶を、承認済みの規約へ自動昇格しない</Text>
   </>:f.stage===3?<>
    <Box x={32} y={81} width={260} height={165} title="不確かな変更" lines={['planで前提を整える','試行・diffで確認','追跡範囲内ならrewind']} tone="violet"/>
    <Box x={348} y={81} width={260} height={165} title="残る作用" lines={['bash経由は追跡外','外部送信等は別','恒久履歴はGitへ']} tone="amber" data-rewind-all-effects="false"/>
    <Text y={352} small>小さなdiffは計画を省く判断も、元記事の基準で行う</Text>
   </>:<>
    <Box x={32} y={84} width={260} height={155} title="起動前" lines={['name・description','手動専用・Claude専用','必要な手順を選ぶ']} tone="violet"/>
    <Wire id={s.id} d="M292 161H340" active phase={f.phase}/><Box x={348} y={84} width={260} height={155} title="起動後" lines={['本文を会話へ注入','以後の文脈へ残る','詳細は補助fileへ']} tone="teal"/>
    <Text y={349} small>旧command互換と、本文の行数目安・適用条件を保持</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
export function ClaudePracticeContextCache({children}){
 const [change,setChange]=useState('model'),[exception,setException]=useState('no'),state=claudeCacheChange(change,exception==='yes')
 return <PracticeFigure diagram="claude-practice-context-cache" title="文脈、TTL、失効条件を分けて消費を管理"
  controls={({stage,ready})=>stage===4?<><Select label="会話で変えたもの" value={change} onChange={setChange} ready={ready}><option value="model">モデルを切替</option><option value="effort">effortを変更</option><option value="rewind">cacheの残る位置へrewind</option><option value="upgrade-resume">版更新後にresume</option></Select><Select label="本文時点のeffort例外" value={exception} onChange={setException} ready={ready}><option value="no">条件を満たさない</option><option value="yes">版・モデル・認証等の全条件を満たす</option></Select></>:null}
  scene={s=><PracticeCanvas diagram="claude-practice-context-cache" {...s}>{f=><>
   <Text y={35}>{['文脈と定義を整理し、思考とモデルを合わせる','消す・要約・戻す・再開を、目的で分ける','同じTTLを、全要求へ一律に適用しない','強制値と、対象ごとの指定を順に照合','有効なcacheが残る前提で、変更の影響を読む','内訳を測り、品質と消費を合わせて判断'][f.stage]}</Text>
   {f.stage===0?<>
    {['文脈：clear・compact・規約','定義：CLI・MCP・前処理','実行：モデル・思考・teams'].map((t,i)=><Box key={t} x={67} y={79+i*104} width={506} height={77} title={t} tone="violet"/>)}
    <Text y={418} small>思考tokenは出力へ計上。teamsの倍率は元の条件付き</Text>
   </>:f.stage===1?<>
    {['別の仕事：clear','要点を残す：compact','捨てる経路：rewind','名前を付けて再開：resume'].map((t,i)=><Box key={t} x={67} y={76+i*81} width={506} height={62} title={t} tone={i===2?'teal':'violet'}/>)}
    <Text y={419} small>コンテキスト整理と、ファイル・外部作用の復元は別</Text>
   </>:f.stage===2?<>
    <Box x={32} y={83} width={260} height={170} title="主会話" lines={['subscription内：1h','API・credits等：5m','本文の確認時点の既定']} tone="teal"/>
    <Box x={348} y={83} width={260} height={170} title="補助の要求" lines={['subagent等は原則5m','サービス側の例外あり','対象ごとの設定を確認']} tone="violet"/>
    <Text y={353} small>TTLの可否、書込・読取単価は接続先とモデルで確認</Text>
   </>:f.stage===3?<>
    {['強制5mの指定','対象の環境変数','対象の設定・experimental','旧互換 → 対象の既定'].map((t,i)=><Box key={t} x={67} y={76+i*81} width={506} height={62} title={t} tone={i===0?'amber':'violet'}/>)}
    <Text y={419} small>主会話とsubagentの項目・版・適用条件は本文へ</Text>
   </>:f.stage===4?<>
    <Box x={67} y={83} width={506} height={133} title={state.prefixCanStay?'prefixを保ち得る変更':'cacheを再構築する変更'} lines={['モデル切替とeffortの例外は別','Fable 5.1等の元記事の全条件を確認']} tone={state.prefixCanStay?'teal':'amber'} data-prefix-can-stay={String(state.prefixCanStay)}/>
    <Box x={67} y={285} width={506} height={107} title="本文の時点・版・接続先へ照合" lines={['opusplanの出入りはモデル切替','全構成へ同じ単価や維持を保証しない']} tone="violet"/>
   </>:<>
    {['usage・context：個人の内訳','telemetry：skill・agent・MCP帰属','headless：呼出し単位のcost'].map((t,i)=><Box key={t} x={67} y={79+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>)}
    <Text y={418} small>節約の見込みを、実際に測った成果として出さない</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
export function ClaudePracticeAutomationQuality({children}){
 const [green,setGreen]=useState('yes'),[verified,setVerified]=useState('no')
 return <PracticeFigure diagram="claude-practice-automation-quality" title="小さな自動化に、上限・検証・早い修正を置く"
  controls={({stage,ready})=>stage===2?<><Select label="Routinesのインフラ結果" value={green} onChange={setGreen} ready={ready}><option value="yes">green：インフラエラーなし</option><option value="no">インフラエラーあり</option></Select><Select label="タスクの検証結果" value={verified} onChange={setVerified} ready={ready}><option value="no">未検証・不適合</option><option value="yes">受入条件を検証した</option></Select></>:null}
  scene={s=><PracticeCanvas diagram="claude-practice-automation-quality" {...s}>{f=><>
   <Text y={35}>{['headlessを小さく試し、必要な依存だけを渡す','反復・時間・同時実行の上限は三つの境界','greenはインフラの結果。タスクは別に検証','実行できる検証手段を、依頼へ組み込む','失敗経路を早く止め、別の視点で確かめる'][f.stage]}</Text>
   {f.stage===0?<>
    {['明示した指示と依存','claude -p：JSON・schema','2〜3fileで試行 → fanout'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={76} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${153+i*104}V${173+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>bareの発見省略と、必要なものの明示注入を確認</Text>
   </>:f.stage===1?<>
    {['反復：max-turnsを指定','時間：workflow timeout','並列：concurrencyを制限'].map((t,i)=><Box key={t} x={67} y={78+i*103} width={506} height={76} title={t} tone={i===0?'amber':'violet'}/>)}
    <Text y={416} small>例10は既定ではない。Secrets・OIDCとGitLab betaは別</Text>
   </>:f.stage===2?<>
    <Box x={32} y={83} width={260} height={155} title={green==='yes'?'インフラ：正常':'インフラ：失敗'} lines={['Routinesの実行一覧','受入条件の結果ではない']} tone={green==='yes'?'teal':'amber'} data-infra-green={green}/>
    <Box x={348} y={83} width={260} height={155} title={verified==='yes'?'タスク：検証した':'タスク：未確定'} lines={['test・実行結果を確認','greenだけで成功にしない']} tone={verified==='yes'?'teal':'amber'} data-task-verified={verified}/>
    <Text y={347} small>research preview・self-host beta・外部推論の条件を保持</Text>
    <Text y={392} small>承認なし、push先とnetworkの範囲は本文へ照合</Text>
   </>:f.stage===3?<>
    {['Explore','Plan','Implement','Commit'].map((t,i)=><Box key={t} x={32+i%2*316} y={83+Math.floor(i/2)*133} width={260} height={95} title={t} tone={i===3?'teal':'violet'}/>)}
    <Text y={371} small>再現・test・lint・画像等、変更に適した検証を渡す</Text>
    <Text y={415} small>小さな修正は、元記事の基準で計画を省くこともある</Text>
   </>:<>
    {['早く中断 → 失敗経路を捨てる','仕様を固める → 新会話で実装','WriterとReviewerの文脈を分ける'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>)}
    <Text y={418} small>正しさに影響するgapへ絞り、際限のない調査を抑える</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
