'use client'
import {useState} from 'react'
import {RetrievalFigure,RetrievalCanvas,Text,Box,Wire,Select,Tokens} from './retrieval-data-primitives'
export function VectorChoiceApproximation({children}){
 const [kind,setKind]=useState('extension'),[search,setSearch]=useState('ann'),[method,setMethod]=useState('graph')
 const kinds={dedicated:['専用DB','大規模検索の機能','運用対象も増える'],extension:['既存DBの拡張','資産・運用を活かす','実queryで対応を確認'],managed:['managed検索','運用負担を外へ移す','制約・費用を確認'],library:['組込みlibrary','小さく組込みやすい','管理機能を自分で担う']}
 const methods={graph:['グラフ','高速な探索を狙う','メモリと更新を評価'],cluster:['クラスタ','探索する領域を絞る','領域数とrecallを評価'],quantize:['量子化','保存量を抑える','表現損失を評価']}
 return <RetrievalFigure diagram="vector-choice-approximation" title="検索基盤の選択と、近似探索の条件"
 controls={({stage,ready})=>stage===1?<Select label="基盤の類型" value={kind} onChange={setKind} ready={ready}>{Object.entries(kinds).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===2?<Select label="上位kを探す方式" value={search} onChange={setSearch} ready={ready}><option value="exact">厳密探索</option><option value="ann">近似探索</option></Select>:stage===3?<Select label="近似方式の着眼点" value={method} onChange={setMethod} ready={ready}>{Object.entries(methods).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:null}
 scene={s=><RetrievalCanvas diagram="vector-choice-approximation" {...s}>{f=><>
  <Text y={35}>{['専用DBの前に、現在の条件を見る','製品名より、規模・チーム・既存資産を照合する','速度のために、探索の保証が変わる','再現率・速度・メモリ・更新を同時に見る'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={84} width={260} height={159} title="現在の要件" lines={['件数・QPS・更新頻度','filterと併用の要件','運用の人数・スキル']} tone="violet"/>
   <Wire id={s.id} d="M292 164H340" active phase={f.phase}/><Box x={348} y={84} width={260} height={159} title="既存の基盤" lines={['資産を活かせるか','実queryで検証','導入対象を増やす前に']} tone="teal"/>
   <Text y={357} small>将来の規模だけで、専用DBを即採用しない</Text>
  </>:f.stage===1?<>
   <Tokens labels={['専用','DB拡張','managed','組込み']} y={79} selected={[Object.keys(kinds).indexOf(kind)]}/>
   <Box x={88} y={179} width={464} height={143} title={kinds[kind][0]} lines={kinds[kind].slice(1)}/>
   <Text y={388} small>規模・チーム・既存資産の三軸へ戻す</Text>
  </>:f.stage===2?<>
   <Box x={32} y={84} width={260} height={162} title={search==='exact'?'全候補との比較':'探索する候補を絞る'} lines={search==='exact'?['総当たりで順位を決定','件数に伴う負担']:['全候補は見ない','取りこぼしがあり得る']} tone="violet"/>
   <Wire id={s.id} d="M292 165H340" active phase={f.phase}/><Box x={348} y={84} width={260} height={162} title={search==='exact'?'定義上の上位k':'近似の上位k候補'} lines={search==='exact'?['選んだ距離の順位','権限・根拠は別']:['真の上位k保証はない','自社評価でrecall確認']} tone={search==='exact'?'teal':'amber'} data-ann-guarantees-top-k={String(search==='exact')}/>
   <Text y={356} small>図は実ランキングやrecallを計測しない</Text>
  </>:<>
   <Box x={32} y={84} width={260} height={153} title={methods[method][0]} lines={methods[method].slice(1)} tone="violet"/>
   <Box x={348} y={84} width={260} height={153} title="自社の評価" lines={['recall・速度・メモリ','更新のしやすさ']} tone="teal"/>
   <Wire id={s.id} d="M292 160H340" active phase={f.phase}/><Text y={354} small>既定値から始め、必要な調整を確かめる</Text>
  </>}
 </>}</RetrievalCanvas>}>{children}</RetrievalFigure>
}
export function VectorFilterOperations({children}){
 const [timing,setTiming]=useState('before'),[fusion,setFusion]=useState('app')
 return <RetrievalFigure diagram="vector-filter-operations" title="権限filter、併用検索と運用の責任"
 controls={({stage,ready})=>stage===0?<Select label="権限を反映する場所" value={timing} onChange={setTiming} ready={ready}><option value="before">検索段</option><option value="after">生成後に除外</option></Select>:stage===1?<Select label="候補を融合する担当" value={fusion} onChange={setFusion} ready={ready}><option value="app">アプリ側</option><option value="engine">基盤側</option></Select>:null}
 scene={s=><RetrievalCanvas diagram="vector-filter-operations" {...s}>{f=><>
  <Text y={35}>{['権限外の情報を、文脈へ入れる前に止める','filterと併用を、実際のquery形で確認する','費用へ効く要因を、価格の式にしない','再生成と、短時間の復旧を区分する','現在の単純解から、実測した成長signalへ進む'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={82} width={260} height={158} title={timing==='before'?'検索段のfilter':'未反映の候補'} lines={['部署・期間・ACL','テナントの境界']} tone={timing==='before'?'teal':'amber'}/>
   <Wire id={s.id} d="M292 161H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={158} title={timing==='before'?'反映を検証':'文脈への漏れ'} lines={timing==='before'?['実装とqueryを照合','図は認可しない']:['生成後に除外しても','先の入力は消えない']} tone={timing==='before'?'violet':'amber'} data-post-filter-safe={String(timing==='before')}/>
   <Text y={357} small>テナント分離の詳細は、専用記事の条件へ</Text>
  </>:f.stage===1?<>
   <Box x={32} y={82} width={260} height={126} title="vector候補" lines={['意味の近さ']} tone="teal"/><Box x={348} y={82} width={260} height={126} title="BM25候補" lines={['語句の一致']} tone="violet"/>
   <Wire id={s.id} d="M162 208V256H320V275 M478 208V256H320V275" active phase={f.phase}/><Box x={93} y={275} width={454} height={91} title={fusion==='app'?'アプリで融合':'基盤で融合'} lines={['filter込みの対応・責任を確認']} data-fusion-owner={fusion}/>
  </>:f.stage===2?<>
   <Tokens labels={['件数','次元','更新頻度']} y={82} selected={[0,1,2]}/>
   <Box x={32} y={182} width={260} height={141} title="保持する負担" lines={['メモリ・ディスク','復旧・運用も含める']} tone="violet"/>
   <Box x={348} y={182} width={260} height={141} title="量子化の条件" lines={['保存量を抑える候補','recallへの影響を評価']} tone="teal"/>
   <Text y={396} small>模式的な要因です。実価格の式ではありません</Text>
  </>:f.stage===3?<>
   {['原本と索引のbackup','別索引を構築・比較','切替・復帰を準備','時間・recall・サイズ監視'].map((t,i)=><g key={t}><Box x={64} y={69+i*82} width={512} height={62} title={t} tone={i===3?'teal':'violet'}/>{i<3&&<Wire id={s.id} d={`M320 ${131+i*82}V${145+i*82}`} active phase={f.phase}/>}</g>)}
  </>:<>
   <Box x={32} y={82} width={260} height={157} title="単純解で検証" lines={['数万件程度は目安','現要件へ照合','性能保証にはしない']} tone="violet"/>
   <Wire id={s.id} d="M292 161H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={157} title="移行のsignal" lines={['件数・QPS・遅延','実測して条件を更新','運用負担も比較']} tone="teal"/>
   <Text y={356} small>製品名や将来予測だけで、移行を確定しない</Text>
  </>}
 </>}</RetrievalCanvas>}>{children}</RetrievalFigure>
}
