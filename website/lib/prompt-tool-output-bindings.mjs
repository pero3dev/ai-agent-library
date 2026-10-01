const grouped=(name,count,headings,groups,types)=>({article:`docs/03-implementation/${name}.md`,route:`/docs/implementation/${name}`,binding:'grouped-blocks',stageCount:count,headings,sourceHeadings:headings,blockGroups:groups,blockTypes:types})
export const PROMPT_TOOL_OUTPUT_BINDINGS={
 'prompt-structure-boundaries':grouped('agent-prompt-design',6,['概要: Agent 用プロンプトは「長期間・多状況」で読まれる','詳細: 構造化されたセクション設計','詳細: 曖昧語を判断基準に置き換える','詳細: 停止とエスカレーションを指示する','詳細: プロンプトはコードとして管理する'],[[{stage:0,count:1}],[{stage:1,count:2}],[{stage:2,count:3}],[{stage:3,count:1}],[{stage:4,count:1}]],[['paragraph'],['paragraph','list'],['paragraph','list','paragraph'],['paragraph'],['list']]),
 'prompt-cause-revision':grouped('agent-prompt-design',4,['詳細: プロンプトで直すべきでない問題'],[[{stage:0,count:2}]],[['paragraph','table']]),
 'tool-definition-contract':grouped('tool-definition-design',5,['概要: ツール定義はプロンプトである','詳細: 命名 — 動詞 + 対象で、語彙を統一する','詳細: 説明文 — 「いつ使うか」「何ができないか」まで書く','詳細: 入力スキーマ — 自由文字列を減らす'],[[{stage:0,count:1}],[{stage:1,count:1}],[{stage:2,count:5}],[{stage:3,count:1}]],[['paragraph'],['list'],['paragraph','list','paragraph','code','code'],['list']]),
 'tool-result-maintenance':grouped('tool-definition-design',4,['詳細: 結果とエラーの設計','詳細: ツールセットの保守','実装例'],[[{stage:0,count:1}],[{stage:2,count:1}],[{stage:3,count:1}]],[['list'],['list'],['paragraph']]),
 'structured-method-schema':grouped('structured-output',5,['概要: 「読む出力」と「処理する出力」を区別する','詳細: 3 つの手法','詳細: スキーマ設計の勘所'],[[{stage:0,count:1}],[{stage:1,count:3}],[{stage:2,count:1}]],[['paragraph'],['table','paragraph','blockquote'],['list']]),
 'structured-validation-loop':grouped('structured-output',5,['詳細: 検証と再生成のループ','設計判断: どこまで構造化するか'],[[{stage:0,count:1},{stage:2,count:2}],[{stage:4,count:2}]],[['paragraph','code','paragraph'],['paragraph','list']])
}
