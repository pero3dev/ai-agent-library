'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CODING_OPTIONS_STAGES,codingOptionsFrame } from '../../lib/coding-options-model.mjs'
import './coding-options.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function OptionsCanvas({diagram,phase,id,children}){
 const frame=codingOptionsFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-coding-options-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function OptionsFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / CHOICE" stages={CODING_OPTIONS_STAGES[diagram]} renderScene={scene} renderControls={controls} className="coding-options-walkthrough"
  footnote="元記事の確認日・未確認項目に沿った模式図です。採用順位や現在価格を作らず、設定変更・送信・課金を起動しません。">{children}</ReadingFigure>
}
