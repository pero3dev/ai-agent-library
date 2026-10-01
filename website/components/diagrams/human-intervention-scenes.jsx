'use client'
import { useState } from 'react'
import { ActionFigure, ActionCanvas, Text, Box, Wire, Select } from './action-boundaries-primitives'
import { approvalOutcome } from '../../lib/action-boundaries-model.mjs'
export function HumanInterventionPositions({ children }) {
  const [operation,setOperation] = useState('send')
  return <ActionFigure diagram="human-intervention-positions" title="人の判断を、どこへ差し込むか"
    controls={({ stage, ready }) => stage === 5 && <Select label="可逆化を検討する操作" value={operation} onChange={setOperation} ready={ready}><option value="send">直接送信 → 下書き</option><option value="delete">削除 → アーカイブ</option></Select>}
    scene={s => <ActionCanvas diagram="human-intervention-positions" {...s}>{f => <>
      <Text y={35}>{['モデルの要求を、アプリが実行する','実行する前に、人が承認する','作った成果物を、公開前にレビューする','規定外・低信頼のケースだけ人へ','実行中にも、進捗と停止手段を持つ','操作の設計を変えて、可逆にできるか'][f.stage]}</Text>
      {f.stage === 0 || f.stage === 1 ? <>
        <Box x={32} y={98} width={260} height={88} title="モデルの実行要求" tone="violet" /><Wire id={s.id} d="M292 142H340" active phase={f.phase} />
        <Box x={348} y={98} width={260} height={88} title="アプリの制御" lines={['実行の手前に判断']} />
        <Wire id={s.id} d="M478 186V256" active phase={f.phase} tone="amber" />
        <Box x={348} y={264} width={260} height={88} title={f.stage === 1 ? '承認後の実行' : '実行・公開'} lines={['アプリが経路を開く']} tone="amber" />
        <Text x={159} y={289} small>{f.stage === 1 ? ['不可逆・影響大', '送信・削除・支払い'] : ['人の判断を', '制御へ組み込む']}</Text>
      </> : f.stage === 2 ? <>
        {['成果物を作る','人がレビュー','公開・反映'].map((label,i) => <g key={label}><Box x={32+i*197} y={127} width={182} height={107} title={label} tone={i === 1 ? 'violet' : 'teal'} />{i < 2 && <Wire id={s.id} d={`M${214+i*197} 180H${222+i*197}`} active phase={f.phase} />}</g>)}
        <Text y={328} small>{['レビューは、成果物の公開・反映の前', '実行済みの不可逆な副作用を戻す手段ではない']}</Text>
      </> : f.stage === 3 ? <>
        <Box x={32} y={152} width={230} height={97} title="ケースを確認" tone="violet" /><Wire id={s.id} d="M262 201H302V128H340M262 201H302V281H340" active phase={f.phase} />
        <Box x={348} y={81} width={260} height={97} title="規定内の処理" /><Box x={348} y={234} width={260} height={97} title="例外を人へ" lines={['難しいケースを渡す']} tone="amber" />
        <Text y={395} small>例外の条件と、判断に必要な情報を設計する</Text>
      </> : f.stage === 4 ? <>
        <Box x={32} y={126} width={260} height={116} title="長時間の実行" lines={['進捗を見せる']} /><Wire id={s.id} d="M292 184H340" active phase={f.phase} />
        <Box x={348} y={126} width={260} height={116} title="人の監視・中断" lines={['停止手段を持つ']} tone="amber" />
        <Wire id={s.id} d="M478 242V310H163V242" active phase={f.phase} tone="amber" dash /><Text y={371} small>一度の承認で、実行中の介入を済ませない</Text>
      </> : <>
        <Box x={32} y={110} width={260} height={120} title={operation === 'send' ? '直接送信' : '削除'} lines={['元に戻せるか', '誰に影響するか']} tone="amber" /><Wire id={s.id} d="M292 170H340" active phase={f.phase} />
        <Box x={348} y={110} width={260} height={120} title={operation === 'send' ? '下書きを作る' : 'アーカイブ'} lines={['操作そのものを変える']} />
        <Text y={316} small>{['不可逆性 × 影響の大きさを、本文の表で整理', '可逆化した後も、影響に応じて判断の位置を選ぶ', '図は実操作のリスクを自動判定しない']}</Text>
      </>}
    </>}</ActionCanvas>}>{children}</ActionFigure>
}
export function HumanApprovalLifecycle({ children }) {
  const [status,setStatus] = useState('waiting')
  const outcome = approvalOutcome(status)
  return <ActionFigure diagram="human-approval-lifecycle" title="承認待ちから、実行・拒否・引き継ぎへ"
    controls={({ stage, ready }) => (stage === 2 || stage === 3) && <Select label="人の応答状態" value={status} onChange={setStatus} ready={ready}><option value="waiting">応答待ち</option><option value="approved">承認</option><option value="denied">拒否</option><option value="timeout">期限切れ</option></Select>}
    scene={s => <ActionCanvas diagram="human-approval-lifecycle" {...s}>{f => <>
      <Text y={35}>{['読んで判断できる材料を見せる','待機中の状態を保存し、再開できるように','承認だけが、実行経路を開く','拒否の事実と理由を、観測として返す','判断と実績を残し、自動化範囲を見直す'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={98} width={260} height={164} title="判断の材料" lines={['何を・なぜ', '宛先・件数・影響']} /><Box x={348} y={98} width={260} height={164} title="対象を絞る" lines={['すべてを承認にしない', '許可リストを検討']} tone="violet" />
        <Text y={344} small>{['承認が多すぎると、内容を読まずに押す', '判断材料と対象範囲を、一緒に設計する']}</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={112} width={260} height={129} title="承認待ち" lines={['作業状態・対象・条件']} tone="violet" /><Wire id={s.id} d="M292 177H340" active phase={f.phase} />
        <Box x={348} y={112} width={260} height={129} title="永続化した状態" lines={['中断・再開へ備える']} />
        <Text y={335} small>{['返答に数時間〜数日かかることもある', '状態を保存し、同じ対象への判断として再開']}</Text>
      </> : f.stage === 2 || f.stage === 3 ? <>
        <Box x={32} y={138} width={230} height={112} title={{waiting:'応答待ち',approved:'承認',denied:'拒否',timeout:'期限切れ'}[status]} lines={['対象・条件と照合']} tone="violet" />
        <Wire id={s.id} d="M262 194H302V125H340" active={outcome.execute} phase={f.phase} />
        <Wire id={s.id} d="M262 194H302V279H340" active={!outcome.execute} phase={f.phase} tone="amber" />
        <Box x={348} y={77} width={260} height={95} title="実行へ" lines={['承認した対象・条件']} active={outcome.execute} data-approval-execute={String(outcome.execute)} />
        <Box x={348} y={232} width={260} height={95} title={outcome.observation ? '拒否と理由を返す' : outcome.execute ? '拒否経路は閉じる' : '待機を続ける'} lines={outcome.observation ? ['代替案の検討・報告'] : ['無応答で実行しない']} active={!outcome.execute} tone="amber" />
        <Text y={390} small>{status === 'timeout' ? '期限切れはデフォルト拒否。実行へ進めない' : '拒否を握りつぶしたり、同じ要求を繰り返さない'}</Text>
      </> : <>
        <Box x={32} y={121} width={260} height={135} title="監査ログ" lines={['誰が・何を・いつ', '承認・拒否したか']} tone="violet" /><Wire id={s.id} d="M292 188H340" active phase={f.phase} />
        <Box x={348} y={121} width={260} height={135} title="範囲を見直す" lines={['実績と影響を確認', '運用に反映']} />
        <Text y={350} small>拒否率が低いことだけで、安全性を保証しない</Text>
      </>}
    </>}</ActionCanvas>}>{children}</ActionFigure>
}
