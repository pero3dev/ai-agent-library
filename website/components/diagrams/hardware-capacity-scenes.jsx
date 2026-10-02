'use client'
import {useId,useState} from 'react'
import {HardwareCanvas,HardwareFigure,HardwarePair,HardwareThree,Text,Box,Wire,Select,Tokens} from './hardware-serving-primitives'
import {weightBytes,precisionReview} from '../../lib/hardware-serving-model.mjs'
export function HardwareWeightsRuntime({children}){
 const id=useId(),[precision,setPrecision]=useState('fp16'),[missing,setMissing]=useState('quality'),weights=weightBytes(precision),review=precisionReview({qualityChecked:missing!=='quality',peakChecked:missing!=='peak',runtimeSupported:missing!=='runtime'})
 return <HardwareFigure diagram="hardware-weights-runtime" title="行列の並列計算と、重み・実行容量の内訳" scene={({phase})=><HardwareCanvas diagram="hardware-weights-runtime" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['提供の場所によって、持つハードの責任が変わる','同じ種類の行列計算を、多数の演算器へ分ける','原文の7Bから、重みだけのbyte数を計算する','重みの外に、実行時の容量を確保する','載らない重みの分割・退避には、転送と同期が要る','量子化後の品質とピーク容量・runtimeを確認する'][stage]}</Text>
 {stage===0&&<HardwareThree columns={[["APIを借りる","提供者のハード","利用条件を照合"],["自ホストする","model提供層","自分で運用"],["端末で動かす","GPU・NPU等","端末の制約"]]}/>}
 {stage===1&&<><Box x={45} y={80} width={165} height={108} title="行列と入力" lines={['同じ計算を分割','精度と形状を照合']}/><Wire id={id} d="M210 134H264" active phase={phase}/><g>{Array.from({length:12},(_,i)=><rect key={i} x={270+(i%4)*67} y={82+Math.floor(i/4)*42} width={51} height={28} rx={4} fill={phase%1>.3?'#214941':'#17313c'} stroke="#66dac8"/>)}</g><Text y={255}>演算器へ同じ計算を並列に割り当てる</Text><Text y={305} small>速度比は行列・精度・転送・実装を揃えて測る。</Text></>}
 {stage===2||stage===3?<><Text y={96}>{`7B × ${{fp16:'2',int8:'1',int4:'0.5'}[precision]} byte = 重み ${weights.weightsGB} GB`}</Text><rect x={60} y={123} width={520} height={30} rx={5} fill="#112638"/><rect x={60} y={123} width={weights.weightsGB*30} height={30} rx={5} fill="#66dac8"/><HardwareThree y={192} columns={[["重み",`${weights.weightsGB} GB`,"十進GBの概算"],["KV cache","文脈と同時数","実構成で見積る"],["作業領域等","一時memory","metadataも"]]}/></>:null}
 {stage===4&&<><Tokens labels={['GPU','CPU','disk']} y={90}/><HardwarePair left={['配置する容量','複数GPUへの分割','CPU・diskへの退避','runtimeの対応を確認']} right={['実用速度は別','重みを移す転送','GPU間の同期','想定構成で実測する']} id={id} phase={phase} y={182}/></>}
 {stage===5&&<HardwarePair left={['品質と容量の三条件','量子化後の自社品質','想定文脈と同時実行','runtimeの対応とピーク']} right={[review.reviewCandidate?'量子化の検討候補':'不足する条件へ戻る','重みだけで合格しない','実modelで別に測る','図は採用しない']} id={id} phase={phase}/>}
 <Text y={412} small>重みの概算は総容量ではない。図はロード・購入を行わない。</Text>
 </>}</HardwareCanvas>} controls={({stage,ready})=>stage===2||stage===3?<Select label="7B重みの数値精度" value={precision} onChange={setPrecision} ready={ready}><option value="fp16">FP16: 約2 byte</option><option value="int8">INT8: 約1 byte</option><option value="int4">INT4: 約0.5 byte</option></Select>:stage===5?<Select label="量子化で不足する条件" value={missing} onChange={setMissing} ready={ready}><option value="quality">量子化後の品質が未評価</option><option value="peak">ピーク使用量が未確認</option><option value="runtime">runtime対応が未確認</option><option value="none">三条件を照合</option></Select>:null}>{children}</HardwareFigure>
}
export function HardwareBottleneckPurchase({children}){
 const id=useId(),[mode,setMode]=useState('decode'),[purchase,setPurchase]=useState('cloud'),choices={cloud:['クラウド従量／予約','初期投資と需要変動','常時高稼働の費用を点検','提供者が運用を肩代わり'],dedicated:['専有・ホスティング','自社専有の資源を借りる','利用条件と運用分担','cloudと購入の中間'],owned:['オンプレ購入','初期投資と設置','電力・冷却・故障・保守','陳腐化と稼働率を含める']}
 return <HardwareFigure diagram="hardware-bottleneck-purchase" title="処理段階の律速と、調達・保有の総費用" scene={({phase})=><HardwareCanvas diagram="hardware-bottleneck-purchase" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['演算の量と、memoryを読む量の比を確認する','処理段階とbatch数で、効く制約が変わる','製品名の前に、三つの類型と用途を読む','調達経路を、稼働率と総費用で比べる','GPUを持つと、運用する仕事も増える'][stage]}</Text>
 {stage===0&&<HardwarePair left={['演算能力の限界','行列の演算量','大きさと精度','FLOPSだけで決めない']} right={['読み書きの限界','転送するbyte量','VRAM容量と帯域','同じ条件で実測する']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<><Tokens labels={['小batch逐次','入力一括','大batch']} selected={[mode==='decode'?0:mode==='prefill'?1:2]} y={90}/><Box x={65} y={182} width={510} height={176} title={mode==='decode'?'帯域が効きやすい条件':'演算の寄与が増える条件'} lines={mode==='decode'?['毎tokenで重みを多く読み出す','演算に対して読み出しが多い','実装と構成を揃えて実測する']:['入力をまとめる／重みを使い回す','batchでthroughputを作る','待ち時間・memoryも別に確認']} tone="teal"/></>}
 {stage===2&&<HardwareThree columns={[["datacenter","大VRAM・帯域","本格的な提供"],["consumer","中小model","検証と小規模"],["端末GPU・NPU","端末内の推論","電力と対応"]]}/>}
 {stage===3&&<HardwarePair left={choices[purchase]} right={['TCOへ含める','電力・冷却・設置','保守・人件費・陳腐化','稼働率と要求品質']} id={id} phase={phase} arrow={false}/>}
 {stage===4&&<><Tokens labels={['driver','故障','容量','電力','世代追従']} y={90}/><HardwarePair left={['自分で保有する','自由度と主権の要件','運用の仕事も引き受ける','本体価格だけでは不足']} right={['借りる経路も比較','運用の肩代わりを含む','品質を満たす処理件数','一件あたりの総費用']} id={id} phase={phase} y={182} arrow={false}/></>}
 <Text y={412} small>最新製品・価格は原文のTODOへ戻る。図は速度や費用を実測しない。</Text>
 </>}</HardwareCanvas>} controls={({stage,ready})=>stage===1?<Select label="比較する推論の処理段階" value={mode} onChange={setMode} ready={ready}><option value="decode">小batchの逐次生成</option><option value="prefill">長い入力を一括処理</option><option value="batch">大batchで処理</option></Select>:stage===3?<Select label="比較するGPUの調達" value={purchase} onChange={setPurchase} ready={ready}>{Object.entries(choices).map(([v,t])=><option key={v} value={v}>{t[0]}</option>)}</Select>:null}>{children}</HardwareFigure>
}
