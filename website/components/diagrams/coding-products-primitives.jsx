'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CODING_PRODUCT_STAGES,codingProductFrame } from '../../lib/coding-products-model.mjs'
import './coding-products.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function ProductCanvas({diagram,phase,id,children}){
 const frame=codingProductFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-product-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function ProductFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / PRODUCT" stages={CODING_PRODUCT_STAGES[diagram]} renderScene={scene} renderControls={controls} className="coding-products-walkthrough"
  footnote="本文の確認時点に沿った模式図です。現在の既定・料金・採用順位を判定せず、実行・送信・契約変更を起動しません。">{children}</ReadingFigure>
}
