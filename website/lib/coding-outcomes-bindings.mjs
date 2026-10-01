const grouped=(article,count,headings,groups,types)=>({article:`docs/08-coding-agents/${article}.md`,route:`/docs/coding-agents/${article}`,binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
export const CODING_OUTCOME_BINDINGS={
  'coding-team-rollout':grouped('coding-agent-team-adoption',5,['概要','導入ステップの設計'],[[{stage:0,count:1}],[{stage:1,count:2}]],[['paragraph'],['table','paragraph']]),
  'coding-team-review':grouped('coding-agent-team-adoption',4,['レビュー体制と責任'],[[{stage:0,count:1},{stage:1,count:2},{stage:2,count:2},{stage:3,count:1}]],[['paragraph','paragraph','list','paragraph','list','paragraph']]),
  'coding-team-governance':grouped('coding-agent-team-adoption',4,['利用ポリシーの策定','コストと利用状況の管理','教育とオンボーディング'],[[{stage:0,count:2}],[{stage:2,count:1}],[{stage:3,count:1}]],[['paragraph','list'],['list'],['list']]),
  'coding-evaluation-experiment':grouped('coding-agent-evaluation',5,['概要','公開ベンチマークの読み方と限界','社内評価タスクの設計'],[[{stage:0,count:3}],[{stage:1,count:4}],[{stage:2,count:2}]],[['paragraph','list','paragraph'],['paragraph','list','blockquote','paragraph'],['paragraph','list']]),
  'coding-evaluation-effects':grouped('coding-agent-evaluation',4,['導入効果の測定','継続的な再評価'],[[{stage:0,count:2}],[{stage:3,count:1}]],[['paragraph','list'],['list']]),
  'coding-cost-consumption':grouped('coding-agent-cost-optimization',5,['概要: コストはどこで発生するか','課金モデル別の最適化方針'],[[{stage:0,count:2}],[{stage:1,count:3}]],[['paragraph','paragraph'],['paragraph','table','paragraph']]),
  'coding-cost-context':grouped('coding-agent-cost-optimization',5,['コンテキスト管理 = コスト管理'],[[{stage:0,count:2},{stage:4,count:1}]],[['paragraph','list','paragraph']]),
  'coding-cost-limits':grouped('coding-agent-cost-optimization',4,['モデルの使い分け','並列・自律実行の消費制御','測定と可視化'],[[{stage:0,count:1}],[{stage:1,count:2}],[{stage:3,count:1}]],[['list'],['paragraph','list'],['list']])
}
