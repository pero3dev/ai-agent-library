const grouped = (article, count, headings, groups, types) => ({ article: `docs/02-architecture/${article}.md`, route: `/docs/architecture/${article}`, binding: 'grouped-blocks', stageCount: count, headings, sourceHeadings: headings, blockGroups: groups, blockTypes: types })
export const CONTEXT_DESIGN_BINDINGS = {
  'context-input-design': grouped('context-engineering', 6,
    ['概要: プロンプトの「文言」から「構成」へ', '詳細: コンテキストの構成要素を棚卸しする', '詳細: 4 つの設計原則'],
    [[{ stage: 0, count: 2 }], [{ stage: 1, count: 3 }], [{ stage: 2, count: 1 }]], [['paragraph','paragraph'], ['paragraph','table','paragraph'], ['list']]),
  'context-cycle-retrieval': grouped('context-engineering', 5,
    ['詳細: コンテキストのライフサイクル', '設計判断: 事前ロードと実行時取得の使い分け'],
    [[{ stage: 0, count: 1 }], [{ stage: 2, count: 1 }, { stage: 3, count: 1 }]], [['paragraph'], ['table','paragraph']]),
  'context-layout-budget': grouped('context-engineering-patterns', 6,
    ['概要: 原則記事との分担', 'レイアウトの設計: 更新頻度で層を分ける', '予算の設計: コンテキストを配分する'],
    [[{ stage: 0, count: 2 }], [{ stage: 1, count: 2 }, { stage: 2, count: 1 }], [{ stage: 3, count: 1 }, { stage: 4, count: 1 }]], [['table','paragraph'], ['paragraph','code','list'], ['paragraph','list']]),
  'context-information-design': grouped('context-engineering-patterns', 7,
    ['取得戦略: 事前ロードと実行時取得の設計', '資料の前処理: どの形で渡すか', '統合と競合: 複数情報源をどう束ねるか', '計測と改善: 効いているセクションを見つける'],
    [[{ stage: 0, count: 2 }, { stage: 1, count: 1 }], [{ stage: 2, count: 3 }], [{ stage: 3, count: 2 }], [{ stage: 4, count: 2 }]], [['paragraph','table','list'], ['paragraph','table','paragraph'], ['paragraph','list'], ['paragraph','list']]),
  'context-compaction-design': grouped('context-compaction-and-isolation', 5,
    ['概要: 増やさない・まとめる・混ぜない', '圧縮のトリガ: いつ実行するか', '残すものと落とすもの', '段階的圧縮と要約の階層化', '外部化という第三の道'],
    [[{ stage: 0, count: 3 }], [{ stage: 1, count: 2 }], [{ stage: 2, count: 3 }], [{ stage: 3, count: 2 }], [{ stage: 4, count: 3 }]], [['paragraph','code','paragraph'], ['paragraph','list'], ['paragraph','table','paragraph'], ['paragraph','list'], ['paragraph','list','paragraph']]),
  'context-trust-restart': grouped('context-compaction-and-isolation', 6,
    ['隔離とサブエージェント: コンテキストを分けて汚染を防ぐ', '仕切り直しの判断: 汚染したら作り直す', '圧縮の失敗モード', '思考ブロックと会話履歴の結び付き'],
    [[{ stage: 0, count: 2 }, { stage: 1, count: 1 }], [{ stage: 2, count: 2 }], [{ stage: 3, count: 2 }], [{ stage: 5, count: 2 }]], [['paragraph','list','paragraph'], ['paragraph','list'], ['paragraph','list'], ['paragraph','paragraph']])
}
