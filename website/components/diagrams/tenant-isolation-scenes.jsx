'use client'
import { useState } from 'react'
import { ContractFigure,ContractCanvas,Text,Box,Wire,Select } from './durable-contract-primitives'
import { tenantContext } from '../../lib/durable-tenant-api-model.mjs'

export function TenantDataSettings({children}) {
  const [context,setContext]=useState('verified'),[separation,setSeparation]=useState('logical')
  const scope=tenantContext(context)
  return <ContractFigure diagram="tenant-data-and-settings" title="確定したテナント文脈を、検索・保存・設定へ通す"
    controls={({stage,ready})=>stage===1?<Select label="実行に使うテナント文脈" value={context} onChange={setContext} ready={ready}><option value="verified">サーバーが認証・認可で確定</option><option value="generated">モデルが生成したIDのみ</option><option value="missing">文脈が欠けている</option></Select>:stage===2?<Select label="データの分離方法" value={separation} onChange={setSeparation} ready={ready}><option value="logical">論理分離：検索でスコープ強制</option><option value="physical">物理分離：保存先を分ける</option></Select>:null}
    scene={s=><ContractCanvas diagram="tenant-data-and-settings" {...s}>{f=><>
      <Text y={35}>{['一つの境界だけで、全てを分離できない','入力やモデル出力だけで、スコープを決めない','分離方法が変わっても、文脈を貫通させる','保存と改善利用まで、テナント範囲を棚卸し','追加指示は、そのテナント内だけに効かせる','版の分岐を、契約と回帰の範囲で管理'][f.stage]}</Text>
      {f.stage===0?<>
        {['データ','プロンプト・設定','レート・容量','コスト'].map((t,i)=><Box key={t} x={32+i%2*292} y={96+Math.floor(i/2)*120} width={284} height={89} title={t} tone={i%2?'violet':'teal'}/>)}
        <Text y={393} small>出力の揺れ・共有ボトルネック・従量費用も考える</Text>
      </>:f.stage===1?<>
        <Box x={32} y={85} width={260} height={119} title="認証と認可" lines={['テナントの所属を確認', 'サーバーで文脈を確定']} tone="violet"/><Wire id={s.id} d="M292 144H340" active phase={f.phase} tone={scope.permit?'teal':'amber'}/><Box x={348} y={85} width={260} height={119} title={scope.label} lines={[scope.permit?'確定したID・権限のみ':'未検証のIDは採用しない']} tone={scope.permit?'teal':'amber'} data-tenant-permit={String(scope.permit)}/>
        {['Agent','ツール','検索・記憶'].map((t,i)=><g key={t}><Box x={32+i*197} y={284} width={182} height={77} title={t} active={scope.permit} tone="violet"/>{i<2&&scope.permit&&<Wire id={s.id} d={`M${214+i*197} 321H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={408} small>モデルが生成した tenant_id で権限を上書きしない</Text>
      </>:f.stage===2?<>
        <Box x={32} y={91} width={260} height={143} title="確定したスコープ" lines={['テナントを先に制限', 'その中でユーザーを制限']} tone="violet"/><Wire id={s.id} d="M292 162H340" active phase={f.phase}/><Box x={348} y={91} width={260} height={143} title={separation==='logical'?'フィルタを必須に':'テナント別の保存先'} lines={separation==='logical'?['フィルタなしの検索不可', '共通検索層で強制']:['運用と資源の負担増', '認可は引き続き必要']}/>
        <Text y={334} small>{['テナント → ユーザーの二段スコープ','物理分離でも、呼出し元の確認を省かない']}</Text>
      </>:f.stage===3?<>
        {['記憶と会話履歴','キャッシュキー','ログの閲覧範囲','改善利用の契約'].map((t,i)=><Box key={t} x={32+i%2*292} y={79+Math.floor(i/2)*101} width={284} height={74} title={t} tone={i===2?'amber':'violet'}/>)}
        <Box x={110} y={306} width={420} height={86} title="解約時の削除まで追跡" lines={['保存層ごとに残るデータを確認']}/>
      </>:f.stage===4?<>
        <Box x={32} y={88} width={260} height={157} title="半信頼の設定データ" lines={['テナントごとの追加指示', '版を持ち変更を管理']} tone="violet"/><Wire id={s.id} d="M292 166H340" active phase={f.phase} tone="amber"/><Box x={348} y={88} width={260} height={157} title="上書きさせない境界" lines={['共通の安全方針', 'ツール権限・他テナント']} tone="amber" data-global-policy-retained="true"/>
        <Text y={338} small>そのテナント内の振舞いだけを変える</Text>
      </>:<>
        <Box x={32} y={101} width={260} height={149} title="原則は共通の版" lines={['モデル・プロンプト', '更新と検証を揃える']} tone="teal"/><Box x={348} y={101} width={260} height={149} title="例外は専用契約" lines={['固定版の提供期間', '回帰・並行運用の費用']} tone="violet"/>
        <Text y={343} small>テナントごとに版が増えるほど、回帰範囲も増える</Text>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}

export function TenantCapacityCost({children}) {
  const [pressure,setPressure]=useState('tenant'),[level,setLevel]=useState('shared')
  return <ContractFigure diagram="tenant-capacity-and-cost" title="公平な容量配分と、テナント別の費用をつなぐ"
    controls={({stage,ready})=>stage===1?<Select label="容量超過の範囲" value={pressure} onChange={setPressure} ready={ready}><option value="tenant">一つのテナントの上限</option><option value="global">全体で共有する上限</option></Select>:stage===5?<Select label="選ぶ分離レベル" value={level} onChange={setLevel} ready={ready}><option value="shared">共有</option><option value="partial">部分専用</option><option value="dedicated">専用</option></Select>:null}
    scene={s=><ContractCanvas diagram="tenant-capacity-and-cost" {...s}>{f=><>
      <Text y={35}>{['大量投入が、全ての枠を占有しないように','超えた範囲を抑え、優先度も設計する','認証の専用化と、容量の専用化を分ける','利用量を集計し、上限の到達先を制御する','原価と価格は、実際の計測から判断する','事故耐性・運用・契約から、分離水準を選ぶ'][f.stage]}</Text>
      {f.stage===0?<>
        {['テナント A','テナント B','テナント C'].map((t,i)=><g key={t}><Box x={32} y={79+i*95} width={228} height={69} title={t} tone={i===0?'amber':'violet'}/><Wire id={s.id} d={`M260 ${113+i*95}H304`} active phase={f.phase}/></g>)}
        <Box x={312} y={115} width={296} height={140} title="クォータと公平キュー" lines={['契約ティアに応じて配分', '共有枠へ順に取り出す']}/>
        <Text y={396} small>共有の一列キューだけでは、先着大量投入が有利</Text>
      </>:f.stage===1?<>
        {['テナント A','テナント B','テナント C'].map((t,i)=><Box key={t} x={32+i*197} y={91} width={182} height={115} title={t} lines={[(pressure==='global'||i===0)?'送信を抑える':'他の範囲は継続']} tone={(pressure==='global'||i===0)?'amber':'teal'} data-tenant-throttled={String(pressure==='global'||i===0)}/>)}
        <Box x={93} y={275} width={454} height={104} title={pressure==='global'?'共有上限では、全体の送信を抑える':'テナント超過では、そのテナントを抑える'} lines={['対話・バッチの優先度は別の軸で設計']} tone="violet" data-capacity-pressure={pressure}/>
      </>:f.stage===2?<>
        <Box x={32} y={87} width={260} height={149} title="専用のAPIキー" lines={['認証・計測を分離', '上位枠は共有しうる']} tone="violet"/><Box x={348} y={87} width={260} height={149} title="専用容量の契約" lines={['独立する範囲を確認', '負荷試験で影響を測る']} tone="amber"/>
        <Text y={330}>{['キーを分けただけでは','独立した容量を保証できない']}</Text>
      </>:f.stage===3?<>
        <Box x={32} y={91} width={260} height={149} title="テナント別に計測" lines={['トークン・ツール', 'タスクの利用量']} tone="violet"/><Wire id={s.id} d="M292 165H340" active phase={f.phase}/><Box x={348} y={91} width={260} height={149} title="上限に達した先へ" lines={['停止または縮退', '原価・課金・異常検知']} tone="amber"/>
        <Text y={340} small>請求の単位と、内部の原価計測を結び付ける</Text>
      </>:f.stage===4?<>
        <Box x={32} y={96} width={260} height={148} title="プラン別の選択" lines={['適切なモデルティア', '利用量と品質を計測']} tone="violet"/><Wire id={s.id} d="M292 170H340" active phase={f.phase}/><Box x={348} y={96} width={260} height={148} title="価格と原価の整合" lines={['負担する変動を確認', '無制限の暴走を防ぐ']} tone="teal"/>
        <Text y={337} small>この図は、現在の料金や利益額を計算しない</Text>
      </>:<>
        {['共有','部分専用','専用'].map((t,i)=><Box key={t} x={32+i*197} y={91} width={182} height={115} title={t} lines={[['共通の資源','一部を分離','資源を分離'][i]]} tone={level===['shared','partial','dedicated'][i]?'teal':'violet'} active={level===['shared','partial','dedicated'][i]}/>)}
        <Box x={91} y={282} width={458} height={99} title="テナント文脈を、一貫して伝える" lines={['後から分離水準を上げられる構成へ']} tone="amber"/>
        <Text y={420} small>専用キーだけで、共有上限を外さない</Text>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}
