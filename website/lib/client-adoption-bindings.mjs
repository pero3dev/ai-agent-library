const grouped=(count,headings,groups,types)=>({article:'docs/08-coding-agents/se-client-adoption.md',route:'/docs/coding-agents/se-client-adoption',binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
export const CLIENT_ADOPTION_BINDINGS={
 'client-approval-contract':grouped(5,['概要: 合意形成は「誰に・何を・どの順で」','誰の合意が要るか、何を示すか','契約観点','見積り・工数モデルへの影響'],[[{stage:0,count:1}],[{stage:1,count:3}],[{stage:2,count:2}],[{stage:3,count:2}]],[['paragraph'],['paragraph','table','paragraph'],['paragraph','list'],['paragraph','list']]),
 'client-staged-adoption':grouped(4,['小さく始める型'],[[{stage:0,count:1},{stage:1,count:1},{stage:3,count:1}]],[['paragraph','list','paragraph']]),
 'client-measured-evidence':grouped(4,['効果の示し方'],[[{stage:0,count:1},{stage:1,count:1}]],[['paragraph','list']])
}
