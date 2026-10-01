const grouped=(article,count,headings,groups,types)=>({article:`docs/08-coding-agents/${article}.md`,route:`/docs/coding-agents/${article}`,binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
export const CODING_PRACTICE_BINDINGS={
 'claude-practice-mechanisms':grouped('claude-code-in-practice',5,['機能の使いどころ'],[[{stage:0,count:2},{stage:4,count:1}]],[['paragraph','table','paragraph']]),
 'claude-practice-context-cache':grouped('claude-code-in-practice',6,['コスト削減: 公式テクニックの要点'],[[{stage:0,count:2},{stage:2,count:1},{stage:3,count:1},{stage:4,count:2},{stage:5,count:1}]],[['paragraph','list','paragraph','paragraph','paragraph','list','paragraph']]),
 'claude-practice-automation-quality':grouped('claude-code-in-practice',5,['業務効率化・自動化','品質を上げる公式プラクティス'],[[{stage:0,count:1}],[{stage:3,count:2}]],[['list'],['paragraph','list']]),
 'codex-practice-surfaces-config':grouped('openai-codex-in-practice',5,['面の使い分けとハンドオフ','カスタマイズ機構の使い分け'],[[{stage:0,count:2},{stage:1,count:1}],[{stage:2,count:3},{stage:3,count:1}]],[['paragraph','table','paragraph'],['paragraph','table','paragraph','list']]),
 'codex-practice-budget-context':grouped('openai-codex-in-practice',5,['コスト削減: 制限の構造とレバー'],[[{stage:0,count:1},{stage:1,count:2},{stage:2,count:1},{stage:3,count:2},{stage:4,count:1}]],[['paragraph','paragraph','list','paragraph','paragraph','paragraph','list']]),
 'codex-practice-automation-quality':grouped('openai-codex-in-practice',6,['業務効率化・自動化','品質を上げる公式プラクティス'],[[{stage:0,count:2},{stage:1,count:2},{stage:2,count:1},{stage:3,count:2},{stage:4,count:1}],[{stage:5,count:1}]],[['paragraph','list','paragraph','paragraph','paragraph','paragraph','paragraph','paragraph'],['list']]),
 'copilot-practice-functions-config':grouped('github-copilot-in-practice',5,['タスク別の機能の使い分け','カスタマイズ機構の実践'],[[{stage:0,count:2},{stage:1,count:2}],[{stage:2,count:1}]],[['paragraph','table','paragraph','paragraph'],['list']]),
 'copilot-practice-budget-cache':grouped('github-copilot-in-practice',5,['コスト削減: AI Credits の構造とレバー'],[[{stage:0,count:2},{stage:1,count:2},{stage:3,count:1}]],[['paragraph','list','paragraph','list','paragraph']]),
 'copilot-practice-automation':grouped('github-copilot-in-practice',4,['業務効率化・自動化'],[[{stage:0,count:1},{stage:2,count:1},{stage:3,count:1}]],[['list','paragraph','list']])
}
