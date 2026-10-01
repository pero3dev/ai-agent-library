'use client'
import { useState } from 'react'
import { ProductFigure,ProductCanvas,Text,Box,Wire,Select } from './coding-products-primitives'
import { claudeRuntimeBoundary } from '../../lib/coding-products-model.mjs'
export function ClaudeSurfacesRuntime({children}){
 const [location,setLocation]=useState('self'),boundary=claudeRuntimeBoundary(location)
 return <ProductFigure diagram="claude-surfaces-runtime" title="操作の入口から、実行と推論の場所を追う"
  controls={({stage,ready})=>[1,2].includes(stage)?<Select label="実行する場所" value={location} onChange={setLocation} ready={ready}><option value="local">ローカル（遠隔操作も可能）</option><option value="managed">Anthropic管理VM</option><option value="self">自社runner（本文のbeta条件）</option></Select>:null}
  scene={s=><ProductCanvas diagram="claude-surfaces-runtime" {...s}>{f=><>
   <Text y={35}>{['複数の入口から、同じエージェントのループへ','遠隔からの操作と、コマンドの実行先を分ける','自社runnerの実行と、外部の推論・管理を分ける','必要なコードを探し、差分と実行結果を確認','戻せるファイルと、外部に残る作用を分ける'][f.stage]}</Text>
   {f.stage===0?<>
    {['CLI・IDE・アプリ','Web・遠隔接続','CI・Agent SDK'].map((t,i)=><g key={t}><Box x={32} y={79+i*97} width={260} height={70} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${114+i*97}H316V211H340`} active phase={f.phase}/></g>)}
    <Box x={348} y={131} width={260} height={157} title="同じエンジン" lines={['探索・編集・実行','権限・ルール・拡張']} tone="teal"/><Text y={414} small>入口が同じでも、実行基盤の条件を個別に確認</Text>
   </>:[1,2].includes(f.stage)?<>
    <Box x={105} y={69} width={430} height={65} title="Web・アプリ等の操作端末" tone="violet"/>
    <Wire id={s.id} d="M320 134V159H162V185" active phase={f.phase}/>
    <Box x={32} y={193} width={260} height={140} title={{local:'手元で実行',managed:'管理VMで実行',self:'自社runnerで実行'}[location]} lines={[boundary.executionOnOwnHost?'コードは自社ホスト':'コードは管理VM','実行基盤の条件を確認']} tone="teal" data-execution-own-host={String(boundary.executionOnOwnHost)}/>
    <Wire id={s.id} d="M292 264H340" active phase={f.phase}/>
    <Box x={348} y={193} width={260} height={140} title="外部の推論API" lines={['会話・ツール結果を送信',location==='local'?'実行と推論は別の場所':'履歴・キューの管理も外']} tone="amber" data-inference-own-host="false" data-remote-moves-execution="false"/>
    <Text y={405} small>{{self:'自社実行は推論のオンプレミス化を意味しない',local:'遠隔操作だけで、手元の実行場所は移らない',managed:'cloudは、遠隔操作とは別の実行先'}[location]}</Text>
   </>:f.stage===3?<>
    {['必要な対象を探索','差分・チェックポイント','権限に照合して実行'].map((t,i)=><g key={t}><Box x={76} y={78+i*104} width={488} height={71} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${149+i*104}V${174+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={417} small>LSP・下位規約・探索の別文脈で、読む対象を絞る</Text>
   </>:<>
    <Box x={32} y={109} width={260} height={151} title="編集前のファイル" lines={['チェックポイントへ戻す','Gitとは独立の機構']} tone="teal"/>
    <Box x={348} y={109} width={260} height={151} title="外部API・DB・送信" lines={['ファイル巻戻しの対象外','外部で復旧を設計']} tone="amber" data-rewind-external="false"/>
    <Text y={351} small>巻戻しの対象を確認してから、実行の許可を決める</Text>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
export function ClaudeConfigPermission({children}){
 return <ProductFigure diagram="claude-config-permission" title="指示の読込、権限の強制、契約の条件を分ける"
  scene={s=><ProductCanvas diagram="claude-config-permission" {...s}>{f=><>
   <Text y={35}>{['階層の指示を連結し、共有の読込経路を作る','行動指針と、技術的に強制する設定を分ける','拒否・確認・許可と、モードの条件を照合する','権限とOSの隔離は、別の層として確認する','秘密の防御と、データの契約条件を重ねる'][f.stage]}</Text>
   {f.stage===0?<>
    {['管理ポリシー','ユーザー','プロジェクト','ローカル'].map((t,i)=><g key={t}><Box x={32} y={77+i*72} width={231} height={53} title={t} tone="violet"/>{i<3&&<Wire id={s.id} d={`M147 ${130+i*72}V${141+i*72}`} active phase={f.phase}/>}</g>)}
    <Box x={341} y={139} width={267} height={157} title="CLAUDE.mdへ連結" lines={['分割・パス限定の規則','AGENTSはimport等']} tone="teal"/><Text y={418} small>追記の構造と読込を確認。配置だけで適用済みにしない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={105} width={260} height={151} title="CLAUDE.md" lines={['行動指針の文脈','権限を変更しない']} tone="violet"/><Box x={348} y={105} width={260} height={151} title="managed settings" lines={['権限・隔離を強制','実際の設定を確認']} tone="teal"/><Text y={352} small>自然文の禁止は、アクセス拒否の代用にならない</Text>
   </>:f.stage===2?<>
    {['deny','ask','allow'].map((t,i)=><g key={t}><Box x={32+i*197} y={93} width={182} height={89} title={t} tone={i===0?'amber':i===1?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 137H${222+i*197}`} active phase={f.phase}/>}</g>)}
    <Box x={81} y={260} width={478} height={115} title="認証・版・組織設定へ照合" lines={['Manual・auto・plan等の実効範囲を確認','本文の確認時点と現在の既定を分ける']} tone="violet"/><Text y={419} small>承認を省略しても、アクセスが安全になったとは限らない</Text>
   </>:f.stage===3?<>
    <Box x={32} y={88} width={260} height={131} title="権限システム" lines={['操作の許可を照合','実効的なルールを確認']} tone="violet"/><Box x={348} y={88} width={260} height={131} title="OSサンドボックス" lines={['有効化・対応OSを確認','ネイティブWindows制約']} tone="teal"/>
    <Wire id={s.id} d="M478 219V267" active phase={f.phase}/><Box x={77} y={275} width={486} height={97} title="通信のドメインとプロキシ" lines={['広い許可だけで強い持出し防止を保証しない']} tone="amber"/>
   </>:<>
    <Box x={32} y={80} width={260} height={131} title="秘密と外部入力" lines={['読取拒否・マスク','隔離文脈・注入検出']} tone="amber"/><Box x={348} y={80} width={260} height={131} title="利用する契約" lines={['Consumer／Commercial','学習利用・保持を確認']} tone="violet"/>
    <Wire id={s.id} d="M162 211V253H320V273" active phase={f.phase}/><Wire id={s.id} d="M478 211V253H320V273" active phase={f.phase}/><Box x={96} y={281} width={448} height={100} title="防御と契約の条件を合わせる" lines={['元記事の時点と採用時の一次情報へ照合']} tone="teal"/>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
export function ClaudeIntegrationsAdoption({children}){
 return <ProductFigure diagram="claude-integrations-adoption" title="接続と組織統制を、使う環境へつなぐ"
  scene={s=><ProductCanvas diagram="claude-integrations-adoption" {...s}>{f=><>
   <Text y={35}>{['接続の出所・認証・スコープを確かめる','同じループを、フック・CI・SDKへ組み込む','認証経路ごとの枠と、追加消費を確認する','配布した設定が、各環境で実効的か確認','仕事の目的を、OS・モデル・統制条件へ照合'][f.stage]}</Text>
   {f.stage===0?<>
    {['local','project','user','managed'].map((t,i)=><Box key={t} x={32+i%2*316} y={76+Math.floor(i/2)*103} width={260} height={74} title={t} tone="violet"/>)}
    <Box x={88} y={298} width={464} height={100} title="初回承認とOAuth・必要権限" lines={['通信形式だけで、信頼や安全を判定しない']} tone="amber"/>
   </>:f.stage===1?<>
    <Box x={91} y={73} width={458} height={84} title="同じエージェントループ" tone="violet"/>
    {['フック','CIランナー','Agent SDK'].map((t,i)=><g key={t}><Wire id={s.id} d={`M320 157V200H${123+i*197}V246`} active phase={f.phase}/><Box x={32+i*197} y={254} width={182} height={112} title={t} lines={[['前後のイベント','実発火を確認'],['Issue・PR契機','認証と権限'],['Python／TS','組込先を確認']][i]} tone={i===1?'amber':'teal'}/></g>)}
   </>:f.stage===2?<>
    {['サブスクリプション','API従量','提供者経由'].map((t,i)=><g key={t}><Box x={32} y={81+i*100} width={260} height={72} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${117+i*100}H340`} active phase={f.phase}/><Box x={348} y={81+i*100} width={260} height={72} title={['シート・枠・追加消費','使用量と支出上限','利用する経路の条件'][i]} tone="teal"/></g>)}
    <Text y={416} small>価格の現在値を図へ固定せず、採用時の条件を確認</Text>
   </>:f.stage===3?<>
    <Box x={81} y={77} width={478} height={100} title="組織ポリシーとアクセス管理" lines={['危険モードの禁止・設定配布・SSO等']} tone="violet"/>
    <Wire id={s.id} d="M320 177V213H162V253" active phase={f.phase}/><Wire id={s.id} d="M320 213H478V253" active phase={f.phase}/><Box x={32} y={261} width={260} height={113} title="ローカルの実効性" lines={['メトリクス・支出上限']} tone="teal"/><Box x={348} y={261} width={260} height={113} title="cloudの実効性" lines={['監査ログ・配信設定']} tone="amber"/>
   </>:<>
    <Box x={32} y={101} width={260} height={157} title="端末中心・既存IDE" lines={['実装・保守・PR・CI','拡張とチーム規約']} tone="teal"/><Box x={348} y={101} width={260} height={157} title="採用条件へ照合" lines={['GUI体験・OS隔離','モデル選択の前提']} tone="amber"/><Text y={352} small>同じエンジンでも、用途と実行面ごとの制約を見る</Text>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
