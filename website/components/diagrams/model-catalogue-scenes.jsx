'use client'
import {useState} from 'react'
import {CatalogueFigure,CatalogueCanvas,Text,Box,Wire,Select,Tokens,Pair} from './catalogue-oss-local-primitives'
export function CatalogueCommonMap({children}){
 const [axis,setAxis]=useState('tier'),[modality,setModality]=useState('image')
 const axes={tier:['役割のtier','上位・主力・軽量','用途を分担する候補'],reason:['思考の深さ','推論のモードや設定','tierとは別に調整'],context:['文脈の容量','必要な入力が入るか','長さと正確さは別'],cost:['費用の内訳','入力・出力・cache','モードと条件を照合']}
 return <CatalogueFigure diagram="catalogue-common-map" title="モデルの地図を、役割・入力・料金の軸で読む"
 controls={({stage,ready})=>stage===1?<Select label="共通地図で見る軸" value={axis} onChange={setAxis} ready={ready}>{Object.entries(axes).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===2?<Select label="必要な入力・生成の形式" value={modality} onChange={setModality} ready={ready}><option value="image">画像入力</option><option value="media">動画・音声入力</option><option value="generate">画像・音声生成</option></Select>:null}
 scene={s=><CatalogueCanvas diagram="catalogue-common-map" {...s}>{f=><>
  <Text y={35}>{['名前を選ぶ前に、地図の時点と比較軸を見る','同じtierでも、推論設定と用途を別に評価する','画像入力の対応を、すべてのmodalへ広げない','同じ文章でも、旧モデルの費用を転用しない'][f.stage]}</Text>
  {f.stage===0?<><Pair {...s} phase={f.phase} left={['カタログの時点','確認日と対象を読む','モデル例は移り変わる','未確認の範囲を保持']} right={['採用前の照合','公式仕様・料金・終了','モデルIDと提供経路','現在の順位を作らず']}/><Text y={357} small>確認日の地図を、採用の決定へ読み替えない</Text></>:f.stage===1?<>
   <Tokens labels={['tier','推論','文脈','費用']} y={82} selected={[Object.keys(axes).indexOf(axis)]}/>
   <Pair {...s} phase={f.phase} y={180} left={axes[axis]} right={['実タスクへ照合','公開成績と自社入力','設定の許可値は別','モデル名だけで決めず']} arrow={false}/>
  </>:f.stage===2?<><Pair {...s} phase={f.phase} left={[{image:'画像入力',media:'動画・音声入力',generate:'画像・音声生成'}[modality],'必要な形式を先に確認','提供対象と経路を読む','文脈量とも別に評価']} right={['対応はモデルごと','画像対応から推測せず','生成は別系統の場合','長い入力も品質保証せず']}/><Text y={360} small>入力窓の容量と、正しく使える範囲は別</Text></>:<>
   <Tokens labels={['入力','出力','cache','モード']} y={82} selected={[0,1,2,3]}/>
   <Pair {...s} phase={f.phase} y={180} left={['請求条件を分ける','長文割増・割引の併用','読取と書込の条件','token化も版で変わる']} right={['提供経路も照合','データ保持・認証','APIと製品の条件','旧単価を流用しない']} arrow={false}/>
  </>}
 </>}</CatalogueCanvas>}>{children}</CatalogueFigure>
}
export function CatalogueProviderBoundaries({children}){
 const [claude,setClaude]=useState('cache'),[gpt,setGpt]=useState('long'),[gemini,setGemini]=useState('status')
 const claudes={cache:['cacheの読取','新しい対象モデルの単価','旧世代の率を転用せず'],retention:['保持とZDR','モデル固有の保持条件','例外を一次情報へ照合'],token:['token化と長文','同じ文章もtoken数変化','メモリと費用を再見積り']}
 const gpts={long:['長文と料金','リクエスト全体の条件','cacheと出力も照合'],effort:['effortの許可値','モデルごとに設定を確認','noneの可否を転用せず'],surface:['APIとCodex','認証・提供面を区分','一方の終了を転用せず'],retire:['対象IDの予定','利用中のIDの行を照合','予定を実停止にしない']}
 const geminis={status:['安定とpreview','Flashの主力とLite','Proの提供段階を確認'],price:['導入価格と終了','前モデルの条件は別','撤回された告知も確認'],modal:['入力と個別仕様','動画・音声・PDF','未確認を保持して照合']}
 return <CatalogueFigure diagram="catalogue-provider-boundaries" title="三社の役割と、モデル別に読む提供条件"
 controls={({stage,ready})=>stage===1?<Select label="Claudeで読む個別条件" value={claude} onChange={setClaude} ready={ready}>{Object.entries(claudes).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===3?<Select label="GPTで読む個別条件" value={gpt} onChange={setGpt} ready={ready}>{Object.entries(gpts).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===4?<Select label="Geminiで読む個別条件" value={gemini} onChange={setGemini} ready={ready}>{Object.entries(geminis).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:null}
 scene={s=><CatalogueCanvas diagram="catalogue-provider-boundaries" {...s}>{f=><>
  <Text y={35}>{['Claudeの役割と、確認日の範囲を合わせて読む','Claudeの個別条件を、旧世代から引き継がない','GPTの三つの候補を、自分のタスクで評価する','GPTの設定・経路・料金・終了を分けて見る','Geminiの主力・軽量と、提供段階を区分する'][f.stage]}</Text>
  {f.stage===0?<>
   <Tokens labels={['難関','上位','主力','軽量']} y={82} selected={[0,1,2,3]}/>
   <Pair {...s} phase={f.phase} y={180} left={['Claudeの原文地図','Fable・Opus・Sonnet','Haikuも用途で比較','2026-09-10の確認']} right={['順位ではなく候補','品質・遅延・費用','長文・入力・保持','対象モデルで照合']} arrow={false}/>
  </>:f.stage===1?<><Pair {...s} phase={f.phase} left={claudes[claude]} right={['時点と対象を保持','原文の価格と条件','全製品へ一般化せず','未知の値を補完せず']}/><Text y={358} small>旧世代の単価・token数・保持条件を流用しない</Text></>:f.stage===2?<>
   <Tokens labels={['Astra／難関','Sol／主力','Luna／定型']} y={82} selected={[0,1,2]}/>
   <Pair {...s} phase={f.phase} y={180} left={['GPTの原文地図','2026-09-28の部分確認','用途と推論設定を評価','掲載だけで旧世代終了せず']} right={['評価する開始候補','実タスクの品質','提供条件と遅延・費用','モデル名で一律変更せず']} arrow={false}/>
  </>:f.stage===3?<><Pair {...s} phase={f.phase} left={gpts[gpt]} right={['一括りにしない','対象IDと提供経路','確認日と予定を保持','当日実停止は未確認']}/><Text y={359} small>同じ設定・退役日を、ファミリー全体へ転用しない</Text></>:<><Pair {...s} phase={f.phase} left={geminis[gemini]} right={['原文の時点で読む','モデル別の条件','前モデルの単価は別','未確認の個別仕様']}/><Text y={359} small>Flashという名前だけで、軽量枠と決めない</Text></>}
 </>}</CatalogueCanvas>}>{children}</CatalogueFigure>
}
export function CatalogueOpenweightLicenses({children}){
 const [scale,setScale]=useState('total'),[term,setTerm]=useState('usage'),[quick,setQuick]=useState('bulk')
 const terms={usage:['対象の事業・用途','MaaS等の定義を読む','系列全体へ条件を足さず'],aggregate:['集計主体と期間','収益・利用者の集計範囲','別契約のしきい値を照合'],exceptions:['例外と表示','内部利用等の対象範囲','全条項の免除にせず']}
 return <CatalogueFigure diagram="catalogue-openweight-licenses" title="公開重みの規模、配布物別条件と採用前の照合"
 controls={({stage,ready})=>stage===0?<Select label="MoEの規模で見る負担" value={scale} onChange={setScale} ready={ready}><option value="total">総パラメータとメモリ</option><option value="active">稼働パラメータと計算</option></Select>:stage===2?<Select label="配布物別の許諾で読む軸" value={term} onChange={setTerm} ready={ready}>{Object.entries(terms).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===3?<Select label="早見表の評価開始用途" value={quick} onChange={setQuick} ready={ready}><option value="default">通常の開始候補</option><option value="bulk">単純・大量処理</option><option value="hard">難関タスク</option></Select>:null}
 scene={s=><CatalogueCanvas diagram="catalogue-openweight-licenses" {...s}>{f=><>
  <Text y={35}>{['MoEの総量と稼働量を、別の負担として見る','配布された重みと、ホストAPIの条件を分ける','一つの配布物の条項を、別のモデルへ移さない','早見表を入口にし、現在の公式条件へ戻る','利用するID・配布物・経路と確認日を合わせる'][f.stage]}</Text>
  {f.stage===0?<><Tokens labels={['総量／メモリ','稼働量／計算']} y={82} selected={[scale==='total'?0:1]}/><Pair {...s} phase={f.phase} y={180} left={scale==='total'?['保持する重み','全体のメモリを確保','端末・GPU容量を照合']:['実行する部分','稼働する層の計算','速度は実環境で評価']} right={['少ない稼働量でも','総量の保存は残る','小さい端末で動く保証なし','GPU枚数を図で算出せず']} arrow={false}/></>:f.stage===1?<><Pair {...s} phase={f.phase} left={['配布する重み','ダウンロードと版','対象LICENSEの全文','派生物の条件を確認']} right={['ホストAPIの条件','同じIDも提供条件変化','料金と提供段階','重み公開とは別の契約']} arrow={false}/><Text y={359} small>公開・API利用・商用再提供の許諾を区分する</Text></>:f.stage===2?<><Pair {...s} phase={f.phase} left={terms[term]} right={['配布物ごとに読む','元記事の具体値を保持','別の条文の条件は別','法的判断は図で実行せず']}/><Text y={359} small>旧ライセンスや例外を、全モデルへ転用しない</Text></>:f.stage===3?<><Pair {...s} phase={f.phase} left={['用途から開始候補',{default:'通常の主力を比べる',bulk:'軽量・大量処理を比べる',hard:'難関向けを比べる'}[quick],'原文の時点と対象','順位と保証を作らず']} right={['採用前に戻る先','公式仕様・料金・退役','GAかpreviewか','LICENSEと提供経路']}/><Text y={359} small>早見表の候補を、そのまま採用へ昇格しない</Text></>:<>
   <Tokens labels={['IDと配布物','提供経路','確認日']} y={82} selected={[0,1,2]}/>
   <Box x={84} y={183} width={472} height={145} title="最新の一次情報へ照合" lines={['利用する対象の仕様・価格・LICENSE','原文のTODOと未確認を再確認','図は適合・提供終了を判定しない']} tone="teal"/>
  </>}
 </>}</CatalogueCanvas>}>{children}</CatalogueFigure>
}
