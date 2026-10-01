const grouped=(article,count,headings,groups,types)=>({article:`docs/08-coding-agents/${article}.md`,route:`/docs/coding-agents/${article}`,binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
export const CODING_OPTIONS_BINDINGS={
 'copilot-surfaces-flow':grouped('github-copilot',5,['概要','提供形態と実行環境','リポジトリ理解・編集・実行の仕組み'],[[{stage:0,count:3}],[{stage:1,count:3},{stage:2,count:1}],[{stage:3,count:1},{stage:4,count:1}]],[['paragraph','paragraph','list'],['paragraph','table','list','paragraph'],['list','paragraph']]),
 'copilot-policy-boundaries':grouped('github-copilot',5,['設定ファイルとカスタマイズ','権限管理とセキュリティ','外部連携(MCP・CI・API)'],[[{stage:0,count:1}],[{stage:1,count:1}],[{stage:4,count:1}]],[['list'],['list'],['list']]),
 'copilot-adoption-budget':grouped('github-copilot',5,['チーム導入と提供プラン','代表的なユースケースと向き不向き'],[[{stage:0,count:1},{stage:1,count:3},{stage:2,count:2},{stage:3,count:1}],[{stage:4,count:3}]],[['list','paragraph','paragraph','table','paragraph','paragraph','paragraph'],['paragraph','paragraph','list']]),
 'oss-freedom-responsibility':grouped('open-source-coding-agents',4,['概要','主要ツールの一言サマリー(2026-08、Cline・Continue は 2026-09 部分更新)'],[[{stage:0,count:1},{stage:1,count:1}],[{stage:2,count:1},{stage:3,count:1}]],[['paragraph','paragraph'],['table','paragraph']]),
 'oss-evaluation-controls':grouped('open-source-coding-agents',5,['OSS 系を評価する 4 つの軸','サンドボックスと実行環境'],[[{stage:0,count:2}],[{stage:4,count:1}]],[['paragraph','list'],['paragraph']]),
 'comparison-matrix-meaning':grouped('coding-agents-comparison',4,['概要と読み方','提供形態マトリクス','実行環境・権限・セキュリティ'],[[{stage:0,count:1}],[{stage:1,count:2}],[{stage:2,count:2}]],[['list'],['table','list'],['paragraph','table']]),
 'comparison-contract-use':grouped('coding-agents-comparison',4,['機能比較','導入・契約','用途別の向き不向き'],[[{stage:0,count:1}],[{stage:1,count:1}],[{stage:2,count:2}]],[['table'],['table'],['paragraph','table']])
}
