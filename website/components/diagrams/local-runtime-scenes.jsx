'use client'
import {useState} from 'react'
import {CatalogueFigure,CatalogueCanvas,Text,Box,Wire,Select,Tokens,Pair} from './catalogue-oss-local-primitives'
import {localCloudRoute} from '../../lib/catalogue-oss-local-model.mjs'
export function LocalRuntimeSelection({children}){
 const [benefit,setBenefit]=useState('privacy'),[place,setPlace]=useState('device'),[runtime,setRuntime]=useState('compatibility')
 const benefits={offline:['オフライン','外部APIに依存しない','ネットワーク不足を扱う'],privacy:['プライバシー','端末外へ出さない要件','ログ・更新経路も確認'],latency:['低レイテンシ','通信の往復を減らす','端末性能も評価'],cost:['APIの限界費用','1回のAPI課金はない','総費用ゼロとは別']}
 const places={device:['端末CPU・GPU・NPU','PC・スマホの内部','メモリと性能が制約'],edge:['edgeのサーバー','現場の共有基盤','閉域内の配置を確認'],browser:['ブラウザ内','インストールを省く','サイズと性能に制約']}
 const runtimes={format:['モデルと形式','量子化モデルとruntime','GGUF・MLX等の原文例'],tools:['実行ツールの類型','CLI・server・GUI','機能と版を照合'],compatibility:['APIの互換範囲','互換APIは範囲を確認','本番適合を保証せず']}
 return <CatalogueFigure diagram="local-runtime-selection" title="端末で得る価値と、実行場所・形式の制約"
 controls={({stage,ready})=>stage===1?<Select label="ローカルで得たい価値" value={benefit} onChange={setBenefit} ready={ready}>{Object.entries(benefits).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===2?<Select label="ローカルの実行場所" value={place} onChange={setPlace} ready={ready}>{Object.entries(places).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===3?<Select label="形式と実行系で見る条件" value={runtime} onChange={setRuntime} ready={ready}>{Object.entries(runtimes).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:null}
 scene={s=><CatalogueCanvas diagram="local-runtime-selection" {...s}>{f=><>
  <Text y={35}>{['端末・edgeの要件から、実行場所を選ぶ','通信を減らす価値と、端末側の負担を合わせる','配置と性能の制約を、実行場所へ対応させる','モデル・形式・runtime・APIの版を合わせる'][f.stage]}</Text>
  {f.stage===0?<><Pair {...s} phase={f.phase} left={['端末・ローカル','オフライン・端末内','利用するハードの制約','端末ごとの配布と更新']} right={['サーバーの自社運用','GPU側のセルフホスト','別記事の運用責任','配置だけで保証せず']} arrow={false}/><Text y={359} small>小型モデルの戦略と、端末の実行環境を区分する</Text></>:f.stage===1?<><Pair {...s} phase={f.phase} left={benefits[benefit]} right={['端末で担う負担','メモリ・電力・性能','モデル配布と保守','高度な推論は品質差確認']}/><Text y={359} small>API課金ゼロを、端末・電力・保守も無料にしない</Text></>:f.stage===2?<><Tokens labels={['端末','edge','ブラウザ']} y={82} selected={[Object.keys(places).indexOf(place)]}/><Pair {...s} phase={f.phase} y={180} left={places[place]} right={['実行の境界を確認','端末と共有基盤は別','モデルが載るか実測','速度と品質も評価']} arrow={false}/></>:<><Pair {...s} phase={f.phase} left={runtimes[runtime]} right={['原文の時点を保持','2026-07の代表例','対応モデルと公式条件','全機能の互換にせず']}/><Text y={359} small>モデル・形式・runtimeの対応を版ごとに確認する</Text></>}
 </>}</CatalogueCanvas>}>{children}</CatalogueFigure>
}
export function LocalQualityDeployment({children}){
 const [quality,setQuality]=useState('no'),[network,setNetwork]=useState('yes'),[external,setExternal]=useState('no'),[update,setUpdate]=useState('incomplete')
 const state=localCloudRoute({localQualityAccepted:quality==='yes',networkAvailable:network==='yes',externalUseAllowed:external==='yes'})
 return <CatalogueFigure diagram="local-quality-deployment" title="量子化込みの品質、クラウド昇格と端末の更新"
 controls={({stage,ready})=>stage===1?<>{[['ローカルの品質条件',quality,setQuality],['ネットワークを利用可能',network,setNetwork],['外部送信の条件',external,setExternal]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="no">条件なし・未確認</option><option value="yes">確認済み</option></Select>)}</>:stage===3?<Select label="端末ごとの更新確認" value={update} onChange={setUpdate} ready={ready}><option value="incomplete">配布のみ・動作は未確認</option><option value="verified">互換・品質・旧版を確認</option></Select>:null}
 scene={s=><CatalogueCanvas diagram="local-quality-deployment" {...s}>{f=><>
  <Text y={35}>{['同じ実タスクで、量子化を含む品質差を見る','品質不足だけで、機密をクラウドへ送らない','初回の配布と、実行できる条件を分けて確認する','端末ごとの切替・旧版・品質を確認する'][f.stage]}</Text>
  {f.stage===0?<><Pair {...s} phase={f.phase} left={['ローカルの実タスク','小型と量子化込み','得意・苦手の範囲','入力分布の変化']} right={['クラウド上位と比較','同じケース・評価','品質差と費用・遅延','評判だけで導入せず']} arrow={false}/><Text y={359} small>実測していない精度・速度・電力の曲線を置かない</Text></>:f.stage===1?<>
   <Tokens labels={['ローカル品質','ネットワーク','外部送信条件']} y={82} selected={[quality,network,external].flatMap((v,i)=>v==='yes'?[i]:[])}/>
   <Box x={75} y={181} width={490} height={156} title={{local:'ローカルの利用候補','confirm-cloud-route':'クラウド経路を確認','hold-and-confirm':'品質不足を残して確認'}[state.next]} lines={['検証失敗・難易度・確信度を評価','外部送信の条件を飛ばさない','図は通信・回答を実行しない']} tone={state.next==='hold-and-confirm'?'amber':'teal'} data-local-cloud-next={state.next} data-external-transmission-executed="false" data-local-quality-guaranteed="false"/>
  </>:f.stage===2?<><Pair {...s} phase={f.phase} left={['配布するファイル','初回downloadの負担','端末の保存容量','形式とruntimeの版']} right={['実行する端末','モデルと版の互換','量子化込みの品質','配布だけで完了せず']}/><Text y={359} small>図はモデルのdownloadや配布を実行しない</Text></>:<>
   <Tokens labels={['配布','互換','品質','旧版']} y={82} selected={update==='verified'?[0,1,2,3]:[0]}/>
   <Box x={79} y={181} width={482} height={156} title={update==='verified'?'切替を評価する候補':'端末の動作・品質を確認'} lines={['各端末の版と切替を把握','同じタスクで更新後の品質を測る','サーバーの一斉更新とは別']} tone={update==='verified'?'teal':'amber'} data-local-update-candidate={String(update==='verified')}/>
  </>}
 </>}</CatalogueCanvas>}>{children}</CatalogueFigure>
}
