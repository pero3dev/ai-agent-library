const grouped=(article,count,headings,groups,types)=>({article:`docs/08-coding-agents/${article}.md`,route:`/docs/coding-agents/${article}`,binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
const runtime=['概要','提供形態と実行環境','リポジトリ理解・編集・実行の仕組み']
const settings=['設定ファイルとカスタマイズ','権限管理とセキュリティ']
const adoption=['外部連携(MCP・CI・API)','チーム導入と提供プラン','代表的なユースケースと向き不向き']
export const CODING_PRODUCT_BINDINGS={
 'claude-surfaces-runtime':grouped('claude-code',5,runtime,[[{stage:0,count:3}],[{stage:1,count:2},{stage:2,count:1}],[{stage:3,count:1}]],[['paragraph','paragraph','list'],['table','list','paragraph'],['list']]),
 'claude-config-permission':grouped('claude-code',5,settings,[[{stage:0,count:1}],[{stage:2,count:1}]],[['list'],['list']]),
 'claude-integrations-adoption':grouped('claude-code',5,adoption,[[{stage:0,count:1}],[{stage:2,count:1}],[{stage:4,count:3}]],[['list'],['list'],['paragraph','paragraph','list']]),
 'codex-surfaces-runtime':grouped('openai-codex',5,runtime,[[{stage:0,count:3}],[{stage:1,count:2}],[{stage:3,count:1}]],[['paragraph','paragraph','list'],['table','list'],['list']]),
 'codex-config-permission':grouped('openai-codex',6,settings,[[{stage:0,count:1}],[{stage:1,count:2},{stage:2,count:2},{stage:4,count:1},{stage:5,count:1}]],[['list'],['paragraph','table','paragraph','list','paragraph','list']]),
 'codex-integrations-adoption':grouped('openai-codex',5,adoption,[[{stage:0,count:1}],[{stage:1,count:1},{stage:2,count:1},{stage:3,count:1}],[{stage:4,count:3}]],[['list'],['paragraph','paragraph','list'],['paragraph','paragraph','list']]),
 'google-products-runtime':grouped('gemini-cli-and-code-assist',5,runtime,[[{stage:0,count:3},{stage:1,count:2}],[{stage:2,count:1}],[{stage:3,count:1}]],[['paragraph','table','paragraph','paragraph','paragraph'],['list'],['list']]),
 'google-config-data':grouped('gemini-cli-and-code-assist',6,settings,[[{stage:0,count:2},{stage:1,count:1}],[{stage:2,count:1}]],[['paragraph','table','paragraph'],['list']]),
 'google-integrations-adoption':grouped('gemini-cli-and-code-assist',5,adoption,[[{stage:0,count:1}],[{stage:2,count:1}],[{stage:4,count:3}]],[['list'],['list'],['paragraph','paragraph','list']])
}
