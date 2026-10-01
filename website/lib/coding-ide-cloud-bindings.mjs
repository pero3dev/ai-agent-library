const grouped=(article,count,headings,groups,types)=>({article:`docs/08-coding-agents/${article}.md`,route:`/docs/coding-agents/${article}`,binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
const runtime=['概要','提供形態と実行環境','リポジトリ理解・編集・実行の仕組み']
const settings=['設定ファイルとカスタマイズ','権限管理とセキュリティ']
const adoption=['外部連携(MCP・CI・API)','チーム導入と提供プラン','代表的なユースケースと向き不向き']
export const IDE_CLOUD_BINDINGS={
 'cursor-runtime-data':grouped('cursor',5,runtime,[[{stage:0,count:3}],[{stage:1,count:2}],[{stage:2,count:1}]],[['paragraph','paragraph','list'],['table','paragraph'],['list']]),
 'cursor-rules-security':grouped('cursor',5,settings,[[{stage:0,count:1}],[{stage:2,count:1}]],[['list'],['list']]),
 'cursor-connections-adoption':grouped('cursor',5,adoption,[[{stage:0,count:1}],[{stage:2,count:1}],[{stage:4,count:3}]],[['list'],['list'],['paragraph','paragraph','list']]),
 'windsurf-runtime-migration':grouped('windsurf',5,runtime,[[{stage:0,count:3}],[{stage:1,count:2}],[{stage:2,count:2}]],[['paragraph','table','paragraph'],['table','paragraph'],['list','paragraph']]),
 'windsurf-rules-security':grouped('windsurf',5,settings,[[{stage:0,count:1}],[{stage:3,count:1}]],[['list'],['list']]),
 'windsurf-connections-adoption':grouped('windsurf',4,adoption,[[{stage:0,count:1}],[{stage:2,count:1}],[{stage:3,count:3}]],[['list'],['list'],['paragraph','paragraph','list']]),
 'devin-delegation-runtime':grouped('devin',5,runtime,[[{stage:0,count:3}],[{stage:1,count:1}],[{stage:3,count:1}]],[['paragraph','paragraph','paragraph'],['list'],['list']]),
 'devin-teaching-security':grouped('devin',5,settings,[[{stage:0,count:2},{stage:1,count:1}],[{stage:2,count:1}]],[['paragraph','table','paragraph'],['list']]),
 'devin-connections-adoption':grouped('devin',5,adoption,[[{stage:0,count:1},{stage:2,count:1}],[{stage:3,count:1}],[{stage:4,count:3}]],[['list','paragraph'],['list'],['paragraph','paragraph','list']])
}
