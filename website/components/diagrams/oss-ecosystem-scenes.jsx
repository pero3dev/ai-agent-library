'use client'
import {useState} from 'react'
import {CatalogueFigure,CatalogueCanvas,Text,Box,Wire,Select,Tokens,Pair} from './catalogue-oss-local-primitives'
import {assetAcceptance} from '../../lib/catalogue-oss-local-model.mjs'
export function OssLayersPermission({children}){
 const [layer,setLayer]=useState('hub'),[license,setLicense]=useState('custom'),[access,setAccess]=useState('weights')
 const layers={hub:['ハブとカード','モデル・dataを配布','メタ情報と本体規約'],tools:['OSSツール','接着・推論・変換','モデルとアプリの間'],local:['ローカル実行','推論エンジンと形式','CLIやGUIの補助'],standard:['標準・ガバナンス','許諾・定義・ホスト','資産の条件へ照合']}
 const licenses={permissive:['寛容型','商用・改変・再配布','表示・本文保持等の義務'],behavior:['用途を制限','有害用途の禁止','派生にも及ぶ条件'],custom:['独自規模・用途条件','事業・規模・再配布','対象の条文を読む']}
 return <CatalogueFigure diagram="oss-layers-permission" title="エコシステムの接点と、公開・利用許諾の違い"
 controls={({stage,ready})=>stage===1?<Select label="エコシステムで見る層" value={layer} onChange={setLayer} ready={ready}>{Object.entries(layers).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===2?<Select label="ライセンスの類型" value={license} onChange={setLicense} ready={ready}>{Object.entries(licenses).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===3?<Select label="公開の範囲の模式例" value={access} onChange={setAccess} ready={ready}><option value="weights">重みだけダウンロード可能</option><option value="forms">自由と変更に必要なアクセスを照合</option></Select>:null}
 scene={s=><CatalogueCanvas diagram="oss-layers-permission" {...s}>{f=><>
  <Text y={35}>{['配布・ツール・実行・標準が、採用する資産へ結びつく','同じOSSという語でも、役割と条件は異なる','寛容型でも義務があり、類型だけで許諾を決めない','公開重みと、OSAIDの条件を区分する'][f.stage]}</Text>
  {f.stage===0?<>
   <Tokens labels={['ハブ','ツール','実行系','標準']} y={80} selected={[0,1,2,3]}/>
   <Wire id={s.id} d="M104 127V178H320V203 M248 127V178H320V203 M392 127V178H320V203 M536 127V178H320V203" active phase={f.phase}/>
   <Box x={79} y={203} width={482} height={129} title="採用するモデル・データ・ツール" lines={['ライセンス × 信頼性 × 持続性','ハブ規約と資産の許諾を分けて読む']} tone="teal"/>
  </>:f.stage===1?<><Tokens labels={['ハブ','ツール','実行系','標準']} y={82} selected={[Object.keys(layers).indexOf(layer)]}/><Pair {...s} phase={f.phase} y={180} left={layers[layer]} right={['層ごとに確認','ハブ規約と禁止事項','資産の許諾・保守','配布と実行責任は別']} arrow={false}/></>:f.stage===2?<><Pair {...s} phase={f.phase} left={licenses[license]} right={['使い方へ照合','商用・規模・再配布','派生物・蒸留の扱い','迷う条項は法務へ']}/><Text y={359} small>download可能・OSI定義・商用利用は別の判断</Text></>:<>
   <Tokens labels={['利用','研究','改変','共有']} y={82} selected={access==='forms'?[0,1,2,3]:[]}/>
   <Pair {...s} phase={f.phase} y={180} left={access==='weights'?['重みの公開だけ','downloadできる状態','自由の条件は未確認','適合へ昇格しない']:['変更に必要な形','データの情報','学習・実行のコード','パラメータのアクセス']} right={['OSAID 1.0へ照合','四つの自由とアクセス','原文の定義を読む','図は適合を認証しない']} arrow={false}/>
  </>}
 </>}</CatalogueCanvas>}>{children}</CatalogueFigure>
}
export function OssProvenanceMaintenance({children}){
 const [card,setCard]=useState('license'),[missing,setMissing]=useState('provenance'),[generation,setGeneration]=useState('new')
 const fields={purpose:['想定用途と限界','非推奨用途・bias','薄い記述もリスク'],data:['データと評価','収集・label・分布','評価条件を確認'],license:['licenseと基盤','許諾の宣言と全文','base_modelの系譜']}
 const flags={versionVerified:missing!=='version',useCompared:missing!=='use',provenanceKnown:missing!=='provenance',maintenanceAssessed:missing!=='maintenance'},state=assetAcceptance(flags)
 return <CatalogueFigure diagram="oss-provenance-maintenance" title="カード・系譜・保守から、配布物別の受入条件へ"
 controls={({stage,ready})=>stage===0?<Select label="カードで読む項目" value={card} onChange={setCard} ready={ready}>{Object.entries(fields).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===3?<Select label="Gemmaの原文の世代区分" value={generation} onChange={setGeneration} ready={ready}><option value="old">旧世代のTerms</option><option value="new">Gemma 4のApache-2.0</option></Select>:stage===4?<Select label="受入確認の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="version">対象版の照合</option><option value="use">使い方との照合</option><option value="provenance">系譜の確認</option><option value="maintenance">保守の評価</option><option value="none">4条件を確認済み</option></Select>:null}
 scene={s=><CatalogueCanvas diagram="oss-provenance-maintenance" {...s}>{f=><>
  <Text y={35}>{['カードの宣言と、利用する条件の全文を確認する','派生工程と元の許諾を、系譜に沿ってたどる','保守者・変更・企業の関与を、継続の条件として見る','同じ系列でも、世代ごとのライセンスを読む','不足した確認を残し、受入の判断へ戻す'][f.stage]}</Text>
  {f.stage===0?<><Pair {...s} phase={f.phase} left={fields[card]} right={['モデル・dataカード','用途・限界・データ','評価・license・基盤','宣言だけで契約完了せず']}/><Text y={359} small>カードが薄いことを、安全の根拠にしない</Text></>:f.stage===1?<>
   <Box x={32} y={80} width={260} height={125} title="基盤モデルの出所" lines={['元のLICENSEと条件','作成者・データを確認']} tone="violet"/>
   <Wire id={s.id} d="M292 140H340" active phase={f.phase}/><Box x={348} y={80} width={260} height={125} title="派生した資産" lines={['FT・マージ・量子化','引き継ぐ条件を確認']} tone="teal"/>
   <Wire id={s.id} d="M478 205V246H320V270" active phase={f.phase}/><Box x={91} y={270} width={458} height={108} title="サプライチェーンとして受入" lines={['出所・署名等の照合と、組織の受入経路']} tone="amber"/>
  </>:f.stage===2?<><Pair {...s} phase={f.phase} left={['維持する体制','単独か組織か','更新・保守の状態','組織移管も確認']} right={['企業の関与','利用・貢献・公開','経営と資産の判断','自社配布にも義務']}/><Text y={359} small>図から外部への貢献・送信・公開は行わない</Text></>:f.stage===3?<><Pair {...s} phase={f.phase} left={generation==='old'?['旧世代の対象Terms','対象モデルの規約','Gemma 4とは別','旧条件を流用しない']:['Gemma 4の原文例','Apache-2.0の対象','旧世代のTermsとは別','表示等の義務を読む']} right={['対象と版を照合','系列名だけで決めず','日付から開始日を推測せず','許諾とOSAIDは別']}/><Text y={359} small>原文の世代差を示し、法的適合を判定しない</Text></>:<>
   <Tokens labels={['対象版','使い方','系譜','保守']} y={82} selected={Object.values(flags).flatMap((v,i)=>v?[i]:[])}/>
   <Box x={79} y={181} width={482} height={150} title={state.reviewCandidate?'受入を検討する候補':'未確認の条件を照合'} lines={['他の条件は満たした想定','契約・安全・本番の保証とは別','図は判定・採用を実行しない']} tone={state.reviewCandidate?'teal':'amber'} data-asset-review-candidate={String(state.reviewCandidate)} data-legal-compliance-guaranteed="false" data-asset-deployment-executed="false"/>
  </>}
 </>}</CatalogueCanvas>}>{children}</CatalogueFigure>
}
