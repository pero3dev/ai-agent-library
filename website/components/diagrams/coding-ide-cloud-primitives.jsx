'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { IDE_CLOUD_STAGES,ideCloudFrame } from '../../lib/coding-ide-cloud-model.mjs'
import './coding-ide-cloud.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function IdeCanvas({diagram,phase,id,children}){
 const frame=ideCloudFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-ide-cloud-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function IdeFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / IDE & CLOUD" stages={IDE_CLOUD_STAGES[diagram]} renderScene={scene} renderControls={controls} className="coding-ide-cloud-walkthrough"
  footnote="本文の確認時点に沿った模式図です。移行期の未確認事項を保ち、起動・送信・課金・契約変更を実行しません。">{children}</ReadingFigure>
}
