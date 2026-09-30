'use client'

import { useState } from 'react'
import { Canvas, LearningFigure, Text, Box, Tokens, Wire, Select, tones } from './learning-scene-primitives'

const patchColors = ['#74e3cf', '#baa7f3', '#f1c27e', '#f5a697', '#a0c9ef', '#b9d893']
function Patches({ phase, selected }) {
  const progress = Math.min(1, Math.max(0, phase - 2))
  return <g data-patch-layout={progress === 1 ? 'sequence' : 'grid'}>{patchColors.map((color, i) => {
    const fromX = 172 + (i % 3) * 98, fromY = 99 + Math.floor(i / 3) * 91
    const toX = 32 + i * 72, toY = 201
    return <g key={i} transform={`translate(${fromX + (toX - fromX) * progress} ${fromY + (toY - fromY) * progress})`} data-patch-id={`p${i}`}>
      <rect width={84 - 21 * progress} height={78 - 20 * progress} rx="8" fill={color} fillOpacity={Number(selected) === i ? .35 : .12} stroke={color} strokeWidth={Number(selected) === i ? 3 : 1.2} />
      <Text x={(84 - 21 * progress) / 2} y={(78 - 20 * progress) / 2 + 8}>{`P${i + 1}`}</Text>
    </g>
  })}</g>
}
export function MultimodalRepresentation({ children }) {
  const [selected, setSelected] = useState('0')
  return <LearningFigure diagram="multimodal-representation" title="異なる入力を言語モデルへ接続する" eyebrow="MULTIMODAL / REPRESENTATION"
    controls={({ stage, ready }) => stage >= 2 && <Select label="注目する画像領域" value={selected} onChange={setSelected} ready={ready}>{patchColors.map((_, i) => <option key={i} value={i}>P{i + 1}</option>)}</Select>}
    scene={state => <Canvas diagram="multimodal-representation" {...state}>{f => <>
      <Text y={35}>{['入力ごとに異なる入口', '入力に対応した数値表現へ', '格子と表現の列で同じ領域を追う', 'テキスト系列へ接続する構成例', '入力の関係を使って文章を生成'][f.stage]}</Text>
      {f.stage < 2 && <>
        {[
          ['テキスト', 'トークンの埋め込み'], ['画像', '画像の特徴へ変換'], ['音声', '音声専用の変換']
        ].map(([a, b], i) => <g key={a}>
          <Box x={32} y={80 + i * 92} width={160} title={a} height={58} tone={['teal', 'amber', 'violet'][i]} />
          <Wire id={state.id} d={`M192 ${109 + i * 92}H258`} active phase={f.phase + i / 3} tone={['teal', 'amber', 'violet'][i]} />
          <Box x={265} y={80 + i * 92} width={343} title={f.stage === 0 ? '固有の入力経路' : b} height={58} tone={['teal', 'amber', 'violet'][i]} />
        </g>)}
        <Text y={391} small>具体的な形式・接続方法はモデルにより異なる</Text>
      </>}
      {f.stage >= 2 && <>
        {f.stage === 2 ? <Text y={74} small>説明用の 2×3 分割。実トークン換算ではない</Text> : <>
          <Text x={249} y={155} small>画像由来の表現</Text>
          <Text x={537} y={155} small>テキスト</Text>
          <Tokens labels={['質問', '文脈']} y={206} start={464} width={144} selected={[0, 1]} name="text" />
        </>}
        <Patches phase={f.phase} selected={selected} />
        {f.stage === 2 ? <Text y={346} small>{['選んだ領域のIDを列でも保つ', '実際の分割数・圧縮・料金とは別']}</Text>
          : f.stage === 3 ? <Text y={325} small>{['この列は接続方法の一例', '交差注意で別経路を参照する構成もある', '同じ形式でも同じ意味・処理とは限らない']}</Text>
            : <>
              <Wire id={state.id} d={`M${63 + Number(selected) * 72} 262V288H501V257`} active phase={f.phase} tone="amber" />
              <Wire id={state.id} d="M501 262V320H320V333" active phase={f.phase} />
              <Box x={146} y={338} width={348} title="テキスト出力" height={54} />
              <Text y={418} small>線は模式的な関係。実測した注意ではない</Text>
            </>}
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}

function InputCard({ mode }) {
  return <g data-input-mode={mode}>
    <rect x="41" y="95" width="208" height="163" rx="10" fill="#152739" stroke="#8ca5ba" />
    <path d="M61 210L116 153L159 185L225 123V239H61Z" fill="#74e3cf" fillOpacity=".18" stroke="#74e3cf" />
    <circle cx="88" cy="128" r="12" fill="#f1c27e" />
    {mode === 'fine' ? <>
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${81 + i * 40} 95V258M41 ${127 + i * 32}H249`} stroke="#8095ad" opacity=".5" />)}
      <Text x={145} y={225} small>細部</Text>
    </> : <path d="M145 95V258M41 176H249" stroke="#8095ad" opacity=".6" />}
  </g>
}
export function MultimodalInputTradeoffs({ children }) {
  const [detail, setDetail] = useState('fine'), [input, setInput] = useState('image')
  return <LearningFigure diagram="multimodal-input-tradeoffs" title="残る情報と入力の負担を比べる" eyebrow="MULTIMODAL / INPUT CHOICES"
    controls={({ stage, ready }) => stage < 2 ? <Select label="入力の粒度" value={detail} onChange={setDetail} ready={ready}><option value="coarse">粗い模式図</option><option value="fine">細かい模式図</option></Select>
      : stage === 2 && <Select label="渡す入力" value={input} onChange={setInput} ready={ready}><option value="image">画像全体</option><option value="roi">関心領域</option><option value="ocr">OCRテキスト</option><option value="structured">構造化データ</option></Select>}
    scene={state => <Canvas diagram="multimodal-input-tradeoffs" {...state}>{f => <>
      {f.stage < 2 && <>
        <Text y={35}>{f.stage === 0 ? '入力にある細部が、表現に残るか' : '見えていない細部を、補完させない'}</Text>
        <InputCard mode={detail} />
        <Wire id={state.id} d="M254 178H311" active phase={f.phase} />
        <Box x={319} y={115} width={289} title="入力由来の表現" lines={['残った情報を使う', '精度：未計測']} height={140} />
        {f.stage === 1 ? <Tokens labels={['小文字', '表', '位置', '数え上げ']} y={302} selected={[]} />
          : <Text y={322} small>{['粒度が細かくても、正しく読む保証はない', '入力と結果を照合する']}</Text>}
        <Text y={397} small>粒度・トークン換算・料金の関係はモデル別</Text>
      </>}
      {f.stage === 2 && <>
        <Text y={35}>必要な情報が残る入力を選ぶ</Text>
        <Tokens labels={['画像', '切り出し', 'OCR', '構造化']} y={87} selected={['image', 'roi', 'ocr', 'structured'].map((v, i) => v === input ? i : -1).filter(i => i >= 0)} />
        <Box x={32} y={190} width={576} title={{ image: '周辺の文脈・配置・外観も渡す', roi: '必要領域を残す。周辺の文脈に注意', ocr: '文字を渡す。認識誤り・配置の欠落に注意', structured: '項目と値を渡す。変換時の情報欠落に注意' }[input]} height={76} />
        <Text y={309} small>{['解像度・枚数・動画のフレーム数も確認', '費用・遅延・精度：それぞれ未計測', '保持条件は送信先の仕様で確認']}</Text>
      </>}
      {f.stage === 3 && <>
        <Text y={35}>読む能力と、作る能力は別</Text>
        <Box x={32} y={86} width={576} title="画像・音声を理解する" height={63} />
        <Wire id={state.id} d="M320 149V178" active phase={f.phase} />
        <Box x={174} y={183} width={292} title="テキストへ出力" height={61} />
        <path d="M32 284H608" stroke={tones.amber} strokeDasharray="6 5" />
        <Box x={32} y={312} width={280} title="画像を生成する" height={61} tone="violet" />
        <Box x={328} y={312} width={280} title="音声を生成する" height={61} tone="violet" />
        <Text y={414} small>対応する入出力は、採用モデルごとに確認</Text>
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}
