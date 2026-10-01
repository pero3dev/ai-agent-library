const grouped=(article,count,headings,groups,types)=>({article:`docs/02-architecture/${article}.md`,route:`/docs/architecture/${article}`,binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
export const HARNESS_LOOP_BINDINGS = {
  'harness-system-boundaries':grouped('harness-engineering',5,
    ['概要: なぜハーネスを一級の設計対象にするのか','構成要素の全体マップ','設計原則: モデルに任せる部分とコードで固定する部分'],
    [[{stage:0,count:3},{stage:1,count:1}],[{stage:2,count:3}],[{stage:3,count:2},{stage:4,count:1}]],
    [['paragraph','paragraph','table','paragraph'],['paragraph','code','table'],['paragraph','list','paragraph']]),
  'harness-environment-evolution':grouped('harness-engineering',5,
    ['環境の設計: モデルが働く場所を用意する','既製ハーネスを使うか、自作するか','ハーネスの評価: 同一モデルで A/B する','モデルとの共進化: ハーネスは軽くする方向で見直す'],
    [[{stage:0,count:3}],[{stage:1,count:3}],[{stage:2,count:2}],[{stage:4,count:2}]],
    [['paragraph','list','paragraph'],['paragraph','table','paragraph'],['paragraph','list'],['paragraph','paragraph']]),
  'loop-type-and-stopping':grouped('loop-engineering',5,
    ['概要: ループは「空間」ではなく「時間」の設計','ループの型を選ぶ','停止条件の設計'],
    [[{stage:0,count:2}],[{stage:1,count:4}],[{stage:2,count:1},{stage:3,count:1}]],
    [['paragraph','table'],['paragraph','code','table','paragraph'],['paragraph','list']]),
  'loop-replanning-recovery':grouped('loop-engineering',6,
    ['再計画のリズム','迷走の検知と介入','バックトラックとやり直し','入れ子と分割','コードで制御するか、プロンプトで促すか'],
    [[{stage:0,count:3}],[{stage:1,count:3}],[{stage:3,count:2}],[{stage:4,count:2}],[{stage:5,count:2}]],
    [['paragraph','list','paragraph'],['paragraph','list','paragraph'],['paragraph','list'],['paragraph','list'],['paragraph','list']])
}
